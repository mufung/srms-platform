// SRMS-1-ADMIN-001: Admin Dashboard Data Lambda
// Owner: MUFUNG ANGELBELL MBUYEH
// Provides all platform data to the super admin dashboard

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { success, unauthorized } = require('./responseHelper');
const { withErrorHandler } = require('./errorHandler');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.DEPLOY_REGION }));
const { MASTER_TENANTS_TABLE, MASTER_BILLING_TABLE, MASTER_AUDIT_TABLE } = process.env;

const handler = withErrorHandler(async (event, context) => {
  console.log('[SRMS-ADMIN] Dashboard data requested');

  const path = event.rawPath || '';
  const method = event.requestContext?.http?.method;

  if (method === 'GET' && path.includes('/schools')) {
    const result = await docClient.send(new ScanCommand({
      TableName: MASTER_TENANTS_TABLE,
      FilterExpression: 'SK = :sk',
      ExpressionAttributeValues: { ':sk': 'METADATA' },
    }));

    const schools = (result.Items || []).map(school => ({
      tenantId: school.tenantId,
      schoolName: school.schoolName,
      plan: school.plan,
      status: school.status,
      country: school.country,
      enabledSections: school.enabledSections,
      activeStudentIds: school.activeStudentIds || 0,
      activeTeacherIds: school.activeTeacherIds || 0,
      activeParentIds: school.activeParentIds || 0,
      monthlyRevenueCents: school.monthlyRevenueCents || 0,
      createdAt: school.createdAt,
      lastPaymentAt: school.lastPaymentAt,
      adminEmail: school.adminEmail,
      adminPhone: school.adminPhone,
      subdomain: school.subdomain,
    }));

    const totalRevenue = schools.reduce((sum, s) => sum + (s.monthlyRevenueCents || 0), 0);
    const activeSchools = schools.filter(s => s.status === 'active').length;

    return success({
      schools,
      summary: {
        totalSchools: schools.length,
        activeSchools,
        suspendedSchools: schools.filter(s => s.status === 'suspended').length,
        totalMonthlyRevenueCents: totalRevenue,
        totalMonthlyRevenueUSD: (totalRevenue / 100).toFixed(2),
        owner: {
          name: 'MUFUNG ANGELBELL MBUYEH',
          title: 'AWS Solutions Architect',
          email: 'mufungangelbellmbuyeh@gmail.com',
          whatsapp: '+237671534067',
          location: 'Yaoundé, Cameroon Northwest',
          latitude: 3.8480,
          longitude: 11.5021,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }

  return success({ message: 'Admin API operational', timestamp: new Date().toISOString() });
});

module.exports = { handler };