// SRMS-1-CLEANUP-001: Data Cleanup Lambda
// Owner: MUFUNG ANGELBELL MBUYEH
// Runs daily to delete data for schools suspended 90+ days
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { success } = require('./responseHelper');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.DEPLOY_REGION }));

const handler = async (event, context) => {
  console.log('[SRMS-CLEANUP] Daily data cleanup check started');
  const now = new Date();

  const suspendedResult = await docClient.send(new QueryCommand({
    TableName: process.env.MASTER_TENANTS_TABLE,
    IndexName: 'StatusIndex',
    KeyConditionExpression: '#status = :s',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':s': 'suspended' },
  }));

  const tenantsToDelete = (suspendedResult.Items || []).filter(tenant => {
    if (!tenant.dataScheduledForDeletionAt) return false;
    return new Date(tenant.dataScheduledForDeletionAt) <= now;
  });

  console.log(`[SRMS-CLEANUP] Found ${tenantsToDelete.length} tenants scheduled for deletion`);

  // Full deletion logic implemented in Phase 3
  return success({
    checked: suspendedResult.Items?.length || 0,
    scheduledForDeletion: tenantsToDelete.length,
    timestamp: now.toISOString(),
  });
};

module.exports = { handler };