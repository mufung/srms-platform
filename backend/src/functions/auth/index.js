// SRMS-2-AUTH-001: Complete Authentication Lambda
// Owner: MUFUNG ANGELBELL MBUYEH
// Handles: login, logout, MFA, token refresh, get current user, create school user

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { success, error, badRequest, unauthorized, corsPreFlight } = require('./responseHelper');
const { withErrorHandler, ValidationError, UnauthorizedError } = require('./errorHandler');
const { generateSrmsId, generateParentId, isValidSrmsId } = require('./idGenerator');
const { v4: uuidv4 } = require('uuid');

// SRMS-2-AUTH-002: AWS clients
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.DEPLOY_REGION || 'us-east-1' }));
const cognito = new CognitoIdentityProviderClient({ region: process.env.DEPLOY_REGION || 'us-east-1' });

const {
  USER_POOL_ID,
  USER_POOL_CLIENT_ID,
  USERS_TABLE,
  AUDIT_TABLE,
  TENANT_ID,
  SCHOOL_NAME,
} = process.env;

// SRMS-2-AUTH-003: Route handler
const handler = withErrorHandler(async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return corsPreFlight();

  const path = event.rawPath || '';
  const method = event.requestContext?.http?.method || 'GET';
  const body = parseBody(event.body);

  // SRMS-2-AUTH-004: Login
  if (method === 'POST' && path.endsWith('/auth/login')) {
    return await login(body, event);
  }

  // SRMS-2-AUTH-005: MFA verification
  if (method === 'POST' && path.endsWith('/auth/verify-mfa')) {
    return await verifyMFA(body);
  }

  // SRMS-2-AUTH-006: Refresh access token
  if (method === 'POST' && path.endsWith('/auth/refresh')) {
    return await refreshToken(body);
  }

  // SRMS-2-AUTH-007: Logout
  if (method === 'POST' && path.endsWith('/auth/logout')) {
    return await logout(event);
  }

  // SRMS-2-AUTH-008: Get current user info
  if (method === 'GET' && path.endsWith('/auth/me')) {
    return await getMe(event);
  }

  // SRMS-2-AUTH-009: Create a user (school admin only)
  if (method === 'POST' && path.endsWith('/auth/create-user')) {
    return await createUser(body, event);
  }

  // SRMS-2-AUTH-010: Generate Parent ID from student ID
  if (method === 'POST' && path.endsWith('/auth/generate-parent-id')) {
    return await generateParentID(body);
  }

  return error('Route not found', 404, 'NOT_FOUND');
});

// SRMS-2-AUTH-020: LOGIN
const login = async (body, event) => {
  const { identifier, password } = body;

  if (!identifier || !password) {
    throw new ValidationError('identifier and password are both required');
  }

  try {
    const result = await cognito.send(new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: identifier.toLowerCase().trim(),
        PASSWORD: password,
      },
    }));

    // SRMS-2-AUTH-021: MFA challenge
    if (result.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
      return success({
        requiresMFA: true,
        challengeName: 'SOFTWARE_TOKEN_MFA',
        session: result.Session,
        message: 'Enter your Google Authenticator code',
      });
    }

    // SRMS-2-AUTH-022: New password required
    if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      return success({
        requiresPasswordChange: true,
        session: result.Session,
        message: 'You must set a new password',
      });
    }

    // SRMS-2-AUTH-023: Success
    await auditLog('USER_LOGIN', identifier, { ip: event.requestContext?.http?.sourceIp });

    return success({
      accessToken: result.AuthenticationResult.AccessToken,
      idToken: result.AuthenticationResult.IdToken,
      refreshToken: result.AuthenticationResult.RefreshToken,
      expiresIn: result.AuthenticationResult.ExpiresIn,
      schoolName: SCHOOL_NAME,
      tenantId: TENANT_ID,
    }, 200, 'Login successful');

  } catch (err) {
    if (err.name === 'NotAuthorizedException') {
      throw new UnauthorizedError('Incorrect username or password');
    }
    if (err.name === 'UserNotFoundException') {
      throw new UnauthorizedError('Incorrect username or password');
    }
    if (err.name === 'TooManyRequestsException') {
      throw new ValidationError('Too many attempts. Please wait a few minutes and try again.');
    }
    throw err;
  }
};

// SRMS-2-AUTH-030: MFA VERIFICATION
const verifyMFA = async (body) => {
  const { session, mfaCode, identifier } = body;
  if (!session || !mfaCode || !identifier) {
    throw new ValidationError('session, mfaCode, and identifier are all required');
  }

  try {
    const result = await cognito.send(new RespondToAuthChallengeCommand({
      ClientId: USER_POOL_CLIENT_ID,
      ChallengeName: 'SOFTWARE_TOKEN_MFA',
      Session: session,
      ChallengeResponses: {
        USERNAME: identifier.toLowerCase().trim(),
        SOFTWARE_TOKEN_MFA_CODE: mfaCode.trim(),
      },
    }));

    return success({
      accessToken: result.AuthenticationResult.AccessToken,
      idToken: result.AuthenticationResult.IdToken,
      refreshToken: result.AuthenticationResult.RefreshToken,
      expiresIn: result.AuthenticationResult.ExpiresIn,
      schoolName: SCHOOL_NAME,
      tenantId: TENANT_ID,
    }, 200, 'MFA verified. Login successful.');

  } catch (err) {
    if (err.name === 'CodeMismatchException') {
      throw new UnauthorizedError('Incorrect authenticator code. Please try again.');
    }
    if (err.name === 'ExpiredCodeException') {
      throw new UnauthorizedError('Code has expired. Please log in again.');
    }
    throw err;
  }
};

// SRMS-2-AUTH-040: REFRESH TOKEN
const refreshToken = async (body) => {
  const { refreshToken: token } = body;
  if (!token) throw new ValidationError('refreshToken is required');

  const result = await cognito.send(new InitiateAuthCommand({
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: USER_POOL_CLIENT_ID,
    AuthParameters: { REFRESH_TOKEN: token },
  }));

  return success({
    accessToken: result.AuthenticationResult.AccessToken,
    idToken: result.AuthenticationResult.IdToken,
    expiresIn: result.AuthenticationResult.ExpiresIn,
  });
};

// SRMS-2-AUTH-050: LOGOUT
const logout = async (event) => {
  try {
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      await cognito.send(new GlobalSignOutCommand({
        AccessToken: authHeader.slice(7),
      }));
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
  return success({ message: 'Logged out successfully from all devices' });
};

// SRMS-2-AUTH-060: GET CURRENT USER
const getMe = async (event) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) throw new UnauthorizedError('No token provided');

  const cognitoUser = await cognito.send(new GetUserCommand({
    AccessToken: authHeader.slice(7),
  }));

  const attrs = {};
  cognitoUser.UserAttributes.forEach(a => {
    attrs[a.Name.replace('custom:', '')] = a.Value;
  });

  return success({
    userId: cognitoUser.Username,
    email: attrs.email,
    role: attrs.role,
    srmsId: attrs.srmsId,
    tenantId: attrs.tenantId,
    department: attrs.department,
    class: attrs.class,
    schoolName: SCHOOL_NAME,
  });
};

// SRMS-2-AUTH-070: CREATE USER (called by school admin to add new teacher/student)
const createUser = async (body, event) => {
  const { role, email, phone, firstName, lastName, department, class: userClass, academicYear } = body;

  if (!role || !email || !firstName || !lastName) {
    throw new ValidationError('role, email, firstName, lastName are required');
  }

  const allowedRoles = ['student', 'teacher', 'parent', 'school-admin'];
  if (!allowedRoles.includes(role)) {
    throw new ValidationError(`role must be one of: ${allowedRoles.join(', ')}`);
  }

  // SRMS-2-AUTH-071: Generate sequence number for SRMS ID
  const seqNum = Math.floor(Math.random() * 9000) + 1000;
  const countryCode = 'CM';
  const schoolCode = TENANT_ID?.slice(3, 9).toUpperCase() || 'SCHOOL';
  const srmsId = generateSrmsId(countryCode, schoolCode, role, seqNum);

  const userId = uuidv4();
  const tempPassword = generateTempPassword();
  const now = new Date().toISOString();

  // SRMS-2-AUTH-072: Create user in Cognito
  await cognito.send(new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email.toLowerCase(),
    TemporaryPassword: tempPassword,
    UserAttributes: [
      { Name: 'email', Value: email.toLowerCase() },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'phone_number', Value: phone || '' },
      { Name: 'custom:role', Value: role },
      { Name: 'custom:srmsId', Value: srmsId },
      { Name: 'custom:tenantId', Value: TENANT_ID },
      { Name: 'custom:department', Value: department || '' },
      { Name: 'custom:class', Value: userClass || '' },
      { Name: 'custom:academicYear', Value: academicYear || new Date().getFullYear().toString() },
    ],
    MessageAction: 'SUPPRESS',
  }));

  // SRMS-2-AUTH-073: Add user to their Cognito group
  const groupMap = {
    'student': 'students',
    'teacher': 'teachers',
    'parent': 'parents',
    'school-admin': 'school-admins',
  };

  await cognito.send(new AdminAddUserToGroupCommand({
    UserPoolId: USER_POOL_ID,
    Username: email.toLowerCase(),
    GroupName: groupMap[role],
  }));

  // SRMS-2-AUTH-074: Save user record in DynamoDB
  await ddb.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      userId,
      tenantId: TENANT_ID,
      role,
      email: email.toLowerCase(),
      phone: phone || '',
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      srmsId,
      department: department || '',
      class: userClass || '',
      academicYear: academicYear || new Date().getFullYear().toString(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
  }));

  await auditLog('USER_CREATED', 'school-admin', { srmsId, role, email });

  return success({
    userId,
    srmsId,
    email: email.toLowerCase(),
    role,
    tempPassword,
    message: `User created. Temporary password: ${tempPassword}. User must change on first login.`,
  }, 201, 'User created successfully');
};

// SRMS-2-AUTH-080: GENERATE PARENT ID
const generateParentID = async (body) => {
  const { studentSrmsId } = body;

  if (!studentSrmsId) {
    throw new ValidationError('studentSrmsId is required');
  }

  if (!isValidSrmsId(studentSrmsId)) {
    throw new ValidationError('Invalid Student SRMS ID format. Expected format: CM-SCHOOL-2026-STU-0042');
  }

  const parentId = generateParentId(studentSrmsId);

  if (!parentId) {
    throw new ValidationError('Could not generate Parent ID from the provided Student ID');
  }

  return success({
    parentId,
    linkedStudentId: studentSrmsId,
    message: `Parent ID generated: ${parentId}. Use this to create your parent account.`,
  });
};

// SRMS-2-AUTH-090: HELPERS
const parseBody = (rawBody) => {
  if (!rawBody) return {};
  try { return JSON.parse(rawBody); } catch { return {}; }
};

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '!@#$%';
  let pass = '';
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  pass += specials[Math.floor(Math.random() * specials.length)];
  pass += Math.floor(Math.random() * 90 + 10);
  return pass;
};

const auditLog = async (actionType, actorId, details = {}) => {
  try {
    const now = new Date().toISOString();
    await ddb.send(new PutCommand({
      TableName: AUDIT_TABLE,
      Item: {
        PK: `AUDIT#${TENANT_ID}`,
        SK: `ACTION#${now}#${uuidv4()}`,
        actionType,
        actorId,
        tenantId: TENANT_ID,
        who: actorId,
        what: actionType,
        when: now,
        where: SCHOOL_NAME,
        details,
        timestamp: now,
      },
    }));
  } catch (e) {
    console.error('Audit log error:', e);
  }
};

module.exports = { handler };