// SRMS-1-REACTIVATE-001: Tenant Reactivation Lambda
// Owner: MUFUNG ANGELBELL MBUYEH
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { success } = require('./responseHelper');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.DEPLOY_REGION }));
const sesClient = new SESClient({ region: process.env.DEPLOY_REGION });

const handler = async (event, context) => {
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch {}

  const tenantId = event.pathParameters?.tenantId || body.tenantId;
  if (!tenantId) return { statusCode: 400, body: JSON.stringify({ error: 'tenantId required' }) };

  await docClient.send(new UpdateCommand({
    TableName: process.env.MASTER_TENANTS_TABLE,
    Key: { PK: `TENANT#${tenantId}`, SK: 'METADATA' },
    UpdateExpression: 'SET #status = :s, reactivatedAt = :r, paymentFailureCount = :p, updatedAt = :u',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':s': 'active',
      ':r': new Date().toISOString(),
      ':p': 0,
      ':u': new Date().toISOString(),
    },
  }));

  await docClient.send(new PutCommand({
    TableName: process.env.MASTER_AUDIT_TABLE,
    Item: {
      PK: `AUDIT#${tenantId}`,
      SK: `ACTION#${new Date().toISOString()}#REACTIVATE`,
      actionType: 'TENANT_REACTIVATED',
      actorId: 'SYSTEM',
      tenantId,
      who: 'SYSTEM',
      what: 'TENANT_REACTIVATED',
      when: new Date().toISOString(),
      where: 'SRMS Platform',
      why: 'Payment received',
      how: 'Stripe webhook → Lambda',
      timestamp: new Date().toISOString(),
    },
  }));

  return success({ tenantId, status: 'active', message: 'Tenant reactivated successfully' });
};

module.exports = { handler };