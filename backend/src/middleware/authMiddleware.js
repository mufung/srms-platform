// SRMS-2-MIDDLEWARE-001: Authentication Middleware
// Owner: MUFUNG ANGELBELL MBUYEH
// Validates JWT tokens on every protected API request

const { UnauthorizedError } = require('./errorHandler');

// SRMS-2-MIDDLEWARE-002: Cache Cognito verifiers so they are not recreated every request
const verifierCache = new Map();

// SRMS-2-MIDDLEWARE-003: Get or create JWT verifier for a User Pool
const getVerifier = async (userPoolId, clientId) => {
  const key = `${userPoolId}:${clientId}`;
  if (!verifierCache.has(key)) {
    const { CognitoJwtVerifier } = await import('aws-jwt-verify');
    const verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'access',
      clientId,
    });
    verifierCache.set(key, verifier);
  }
  return verifierCache.get(key);
};

// SRMS-2-MIDDLEWARE-004: Extract Bearer token from Authorization header
const extractToken = (event) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No valid authorization token found');
  }
  return authHeader.slice(7);
};

// SRMS-2-MIDDLEWARE-005: Verify token and return user data
const verifyToken = async (event) => {
  const token = extractToken(event);
  const userPoolId = process.env.USER_POOL_ID;
  const clientId = process.env.USER_POOL_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error('USER_POOL_ID or USER_POOL_CLIENT_ID not configured in environment');
  }

  try {
    const verifier = await getVerifier(userPoolId, clientId);
    const payload = await verifier.verify(token);

    return {
      userId: payload.sub,
      email: payload.email || '',
      role: payload['custom:role'] || '',
      srmsId: payload['custom:srmsId'] || '',
      tenantId: payload['custom:tenantId'] || '',
      department: payload['custom:department'] || '',
      class: payload['custom:class'] || '',
      groups: payload['cognito:groups'] || [],
    };
  } catch (err) {
    throw new UnauthorizedError('Token is invalid or expired. Please log in again.');
  }
};

// SRMS-2-MIDDLEWARE-006: Check if user belongs to this tenant
const verifyTenant = (user, expectedTenantId) => {
  if (user.tenantId !== expectedTenantId) {
    throw new UnauthorizedError('Access denied: you do not belong to this school');
  }
};

// SRMS-2-MIDDLEWARE-007: Check if user has one of the allowed roles
const verifyRole = (user, allowedRoles) => {
  if (!allowedRoles.includes(user.role)) {
    throw new UnauthorizedError(`Access denied: this action requires one of these roles: ${allowedRoles.join(', ')}`);
  }
};

// SRMS-2-MIDDLEWARE-008: Full authentication check combining token + tenant + role
const authenticate = async (event, allowedRoles = null) => {
  const user = await verifyToken(event);

  if (process.env.TENANT_ID) {
    verifyTenant(user, process.env.TENANT_ID);
  }

  if (allowedRoles && allowedRoles.length > 0) {
    verifyRole(user, allowedRoles);
  }

  return user;
};

module.exports = {
  extractToken,
  verifyToken,
  verifyTenant,
  verifyRole,
  authenticate,
};