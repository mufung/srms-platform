// SRMS-1-AUDITLOG-001: Audit Logger Lambda
// Owner: MUFUNG ANGELBELL MBUYEH
// Records everything: who, what, where, when, why, how

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { success } = require('./responseHelper');
const { withErrorHandler } = require('./errorHandler');
const { v4: uuidv4 } = require('uuid');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.DEPLOY_REGION }));
const { MASTER_AUDIT_TABLE } = process.env;

const handler = withErrorHandler(async (event, context) => {
  const method = event.requestContext?.http?.method;
  const path = event.rawPath || '';

  if (method === 'POST') {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch {}

    const { actionType, actorId, tenantId, who, what, where: where_, when, why, how, details } = body;
    const timestamp = new Date().toISOString();

    await docClient.send(new PutCommand({
      TableName: MASTER_AUDIT_TABLE,
      Item: {
        PK: `AUDIT#${tenantId || 'PLATFORM'}`,
        SK: `ACTION#${timestamp}#${uuidv4()}`,
        actionType,
        actorId,
        tenantId,
        who: who || actorId,
        what: what || actionType,
        when: when || timestamp,
        where: where_ || 'SRMS Platform',
        why: why || 'System action',
        how: how || 'API call',
        details,
        timestamp,
        recordedBy: 'SRMS Audit System',
        platformOwner: 'MUFUNG ANGELBELL MBUYEH',
      },
    }));

    return success({ logged: true, timestamp });
  }

  if (method === 'GET') {
    const tenantId = event.queryStringParameters?.tenantId || 'PLATFORM';
    const result = await docClient.send(new QueryCommand({
      TableName: MASTER_AUDIT_TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `AUDIT#${tenantId}` },
      ScanIndexForward: false,
      Limit: 100,
    }));

    return success({ auditLogs: result.Items || [], count: result.Count });
  }

  return success({ message: 'Audit system operational' });
});

module.exports = { handler };