// SRMS-1-DELETE-001: Tenant Deletion Lambda
// Owner: MUFUNG ANGELBELL MBUYEH
// Deletes all resources for a school after 90 days of non-payment
const { success } = require('./responseHelper');

const handler = async (event, context) => {
  const tenantId = event.pathParameters?.tenantId || JSON.parse(event.body || '{}').tenantId;
  console.log(`[SRMS-DELETE] Deletion requested for tenant: ${tenantId}`);
  // Full implementation in Phase 3
  return success({ message: 'Deletion request queued', tenantId });
};

module.exports = { handler };