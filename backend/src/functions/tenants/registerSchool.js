// SRMS-3-REGISTER-001: Enhanced Tenant Registration
// Owner: MUFUNG ANGELBELL MBUYEH
// Auto-deploys complete AWS environment for each new school

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudFormationClient, CreateStackCommand, DescribeStacksCommand, UpdateStackCommand } = require('@aws-sdk/client-cloudformation');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { const { success, error } = require('./responseHelper');
const { withErrorHandler, ValidationError, ConflictError } = require('./errorHandler');
const { v4: uuidv4 } = require('uuid');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.DEPLOY_REGION }));
const cfnClient = new CloudFormationClient({ region: process.env.DEPLOY_REGION });
const sesClient = new SESClient({ region: process.env.DEPLOY_REGION });
const snsClient = new SNSClient({ region: process.env.DEPLOY_REGION });

const {
  MASTER_TENANTS_TABLE,
  MASTER_AUDIT_TABLE,
  MASTER_BILLING_TABLE,
  DEPLOY_REGION,
  AWS_ACCOUNT_ID,
  OWNER_EMAIL,
  SES_FROM_EMAIL,
} = process.env;

const handler = withErrorHandler(async (event) => {
  const body = parseBody(event.body);

  const {
    schoolName,
    adminEmail,
    adminPhone,
    country = 'Cameroon',
    plan = 'starter',
    enabledSections = ['section1'],
    stripeCustomerId = 'manual',
    stripeSubscriptionId = 'manual',
    maxStudentIds = getPlanLimits(plan).students,
    maxTeacherIds = getPlanLimits(plan).teachers,
  } = body;

  // SRMS-3-REGISTER-002: Validate required fields
  if (!schoolName || !adminEmail || !adminPhone) {
    throw new ValidationError('schoolName, adminEmail, adminPhone are required');
  }

  if (!validateEmail(adminEmail)) {
    throw new ValidationError('adminEmail format is invalid');
  }

  // SRMS-3-REGISTER-003: Generate unique tenant ID
  const tenantId = generateTenantId(schoolName, country);
  const subdomain = generateSubdomain(schoolName);
  const timestamp = new Date().toISOString();

  // SRMS-3-REGISTER-004: Check if tenant already exists
  const existing = await getTenant(tenantId);
  if (existing) {
    if (existing.status === 'suspended' || existing.status === 'cancelled') {
      // SRMS-3-REGISTER-005: Reactivate instead of creating duplicate
      await updateTenant(tenantId, {
        status: 'active',
        reactivatedAt: timestamp,
        stripeSubscriptionId,
        updatedAt: timestamp,
      });
      return success({ tenantId, status: 'reactivated', message: 'Account reactivated' });
    }
    throw new ConflictError(`School already registered. TenantId: ${tenantId}`);
  }

  // SRMS-3-REGISTER-006: Validate enabled sections
  const validSections = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6', 'section7'];
  const invalidSections = enabledSections.filter((s) => !validSections.includes(s));
  if (invalidSections.length > 0) {
    throw new ValidationError(`Invalid sections: ${invalidSections.join(', ')}. Valid: ${validSections.join(', ')}`);
  }

  // SRMS-3-REGISTER-007: Save tenant record with status "deploying"
  const tenantRecord = {
    PK: `TENANT#${tenantId}`,
    SK: 'METADATA',
    tenantId,
    schoolName,
    adminEmail: adminEmail.toLowerCase(),
    adminPhone,
    country,
    plan,
    enabledSections,
    subdomain,
    stripeCustomerId,
    stripeSubscriptionId,
    maxStudentIds,
    maxTeacherIds,
    status: 'deploying',
    createdAt: timestamp,
    updatedAt: timestamp,
    monthlyRevenueCents: getPlanRevenue(plan),
    activeStudentIds: 0,
    activeTeacherIds: 0,
    activeParentIds: 0,
    freeTrialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    dataScheduledForDeletionAt: null,
    paymentFailureCount: 0,
    deploymentId: uuidv4(),
  };

  await docClient.send(new PutCommand({
    TableName: MASTER_TENANTS_TABLE,
    Item: tenantRecord,
    ConditionExpression: 'attribute_not_exists(PK)',
  }));

  // SRMS-3-REGISTER-008: Queue CDK deployment
  await queueDeployment(tenantRecord);

  // SRMS-3-REGISTER-009: Log to audit trail
  await logAudit({
    actionType: 'TENANT_REGISTERED',
    tenantId,
    details: { schoolName, plan, enabledSections, country, adminEmail, subdomain },
  });

  // SRMS-3-REGISTER-010: Send welcome email
  await sendWelcomeEmail(adminEmail, schoolName, tenantId, subdomain);

  // SRMS-3-REGISTER-011: Notify platform owner
  await notifyOwner(schoolName, adminEmail, plan, tenantId);

  return success({
    tenantId,
    schoolName,
    subdomain,
    status: 'deploying',
    freeTrialDays: 14,
    estimatedReadyTime: '5-10 minutes',
    enabledSections,
    message: 'School registration successful. Your environment is being built. Check your email for updates.',
  }, 201);
});

// SRMS-3-REGISTER-020: Queue CDK deployment via DynamoDB record
const queueDeployment = async (tenantConfig) => {
  await docClient.send(new PutCommand({
    TableName: MASTER_TENANTS_TABLE,
    Item: {
      PK: `DEPLOYMENT#${tenantConfig.tenantId}`,
      SK: `REQUEST#${new Date().toISOString()}`,
      tenantId: tenantConfig.tenantId,
      tenantConfig,
      status: 'queued',
      queuedAt: new Date().toISOString(),
      deploymentId: tenantConfig.deploymentId,
      retryCount: 0,
    },
  }));
  console.log(`[SRMS-REGISTER] Deployment queued for: ${tenantConfig.tenantId}`);
};

// SRMS-3-REGISTER-030: Helper functions
const parseBody = (raw) => {
  if (!raw) return {};
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return {}; }
};

const generateTenantId = (schoolName, country) => {
  const cc = country.slice(0, 2).toLowerCase();
  const name = schoolName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/).slice(0, 3).join('-');
  const suffix = Date.now().toString(36).slice(-4);
  return `${cc}-${name}-${suffix}`.slice(0, 40);
};

const generateSubdomain = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20).replace(/-$/, '');

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getPlanLimits = (plan) => {
  const limits = {
    starter: { students: 300, teachers: 20 },
    standard: { students: 1000, teachers: 50 },
    professional: { students: 5000, teachers: 200 },
    enterprise: { students: 50000, teachers: 1000 },
  };
  return limits[plan] || limits.starter;
};

const getPlanRevenue = (plan) => {
  const prices = { starter: 1500, standard: 4000, professional: 10000, enterprise: 0 };
  return prices[plan] || 0;
};

const getTenant = async (tenantId) => {
  const result = await docClient.send(new GetCommand({
    TableName: MASTER_TENANTS_TABLE,
    Key: { PK: `TENANT#${tenantId}`, SK: 'METADATA' },
  }));
  return result.Item || null;
};

const updateTenant = async (tenantId, fields) => {
  const updates = Object.entries(fields).map(([k]) => `${k} = :${k}`);
  const values = Object.fromEntries(Object.entries(fields).map(([k, v]) => [`:${k}`, v]));
  await docClient.send(new UpdateCommand({
    TableName: MASTER_TENANTS_TABLE,
    Key: { PK: `TENANT#${tenantId}`, SK: 'METADATA' },
    UpdateExpression: `SET ${updates.join(', ')}`,
    ExpressionAttributeValues: values,
  }));
};

const logAudit = async ({ actionType, tenantId, details }) => {
  try {
    const now = new Date().toISOString();
    await docClient.send(new PutCommand({
      TableName: MASTER_AUDIT_TABLE,
      Item: {
        PK: `AUDIT#${tenantId}`,
        SK: `ACTION#${now}#${uuidv4()}`,
        actionType,
        actorId: 'SYSTEM',
        tenantId,
        who: 'SYSTEM_AUTOMATED',
        what: actionType,
        when: now,
        where: 'SRMS Platform',
        why: 'School registration',
        how: 'API call → Lambda',
        details,
        timestamp: now,
      },
    }));
  } catch (e) { console.error('[SRMS-AUDIT-ERROR]', e); }
};

const sendWelcomeEmail = async (email, schoolName, tenantId, subdomain) => {
  try {
    await sesClient.send(new SendEmailCommand({
      Source: SES_FROM_EMAIL || 'noreply@srms.platform',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `Welcome to SRMS Platform — ${schoolName}` },
        Body: {
          Html: {
            Data: `
              <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1d4ed8;">Welcome to SRMS Platform!</h1>
                <p>Dear ${schoolName} Administrator,</p>
                <p>Your school environment is being set up. This takes about 5-10 minutes.</p>
                <table style="border-collapse: collapse; width: 100%;">
                  <tr><td style="padding: 8px; font-weight: bold;">Tenant ID:</td><td style="padding: 8px; font-family: monospace;">${tenantId}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Subdomain:</td><td style="padding: 8px;">${subdomain}.srms-platform.com (configured later)</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Free Trial:</td><td style="padding: 8px;">14 days</td></tr>
                </table>
                <p>You will receive another email when your system is ready with your login credentials.</p>
                <hr/>
                <p style="color: #64748b; font-size: 12px;">
                  SRMS Platform — Built by MUFUNG ANGELBELL MBUYEH<br/>
                  AWS Solutions Architect | Yaoundé, Cameroon<br/>
                  Email: mufungangelbellmbuyeh@gmail.com | WhatsApp: +237671534067
                </p>
              </div>
            `,
          },
        },
      },
    }));
  } catch (e) { console.error('[EMAIL-ERROR]', e); }
};

const notifyOwner = async (schoolName, adminEmail, plan, tenantId) => {
  try {
    await sesClient.send(new SendEmailCommand({
      Source: SES_FROM_EMAIL || 'noreply@srms.platform',
      Destination: { ToAddresses: [OWNER_EMAIL || 'mufungangelbellmbuyeh@gmail.com'] },
      Message: {
        Subject: { Data: `🎉 NEW SCHOOL: ${schoolName}` },
        Body: {
          Html: {
            Data: `<h2>New School Registered</h2><p><b>School:</b> ${schoolName}</p><p><b>Email:</b> ${adminEmail}</p><p><b>Plan:</b> ${plan}</p><p><b>Tenant:</b> ${tenantId}</p><p><b>Time:</b> ${new Date().toISOString()}</p>`,
          },
        },
      },
    }));
  } catch (e) { console.error('[OWNER-NOTIFY-ERROR]', e); }
};

module.exports = { handler };