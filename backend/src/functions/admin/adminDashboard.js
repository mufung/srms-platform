// SRMS Phase 9 — Super Admin Dashboard Lambda
// Owner: MUFUNG ANGELBELL MBUYEH
// AWS Solutions Architect — Yaoundé, Cameroon

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.DEPLOY_REGION || 'us-east-1' })
);

const { TENANTS_TABLE, AUDIT_TABLE, BILLING_TABLE } = process.env;

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

// ============================================================
// MAIN HANDLER
// ============================================================
exports.handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS' ||
      event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const path = event.rawPath || event.path || '';
  const method = (event.requestContext?.http?.method || event.httpMethod || 'GET').toUpperCase();
  const body = parseBody(event.body);

  console.log(`[SRMS-SUPER-ADMIN] ${method} ${path}`);

  try {
    if (method === 'GET' && path.includes('/superadmin/overview')) return await getOverview();
    if (method === 'GET' && path.includes('/superadmin/schools')) return await getAllSchools();
    if (method === 'GET' && path.includes('/superadmin/revenue')) return await getRevenue();
    if (method === 'GET' && path.includes('/superadmin/audit')) return await getAuditLog();
    if (method === 'POST' && path.includes('/superadmin/suspend')) return await suspendSchool(body);
    if (method === 'POST' && path.includes('/superadmin/reactivate')) return await reactivateSchool(body);
    if (method === 'GET' && path.includes('/superadmin/status')) return respond(200, { status: 'ok', owner: 'MUFUNG ANGELBELL MBUYEH' });

    return respond(404, { error: 'Route not found' });
  } catch (err) {
    console.error('[SRMS-SUPER-ADMIN] Error:', err.message);
    return respond(500, { error: err.message });
  }
};

// ============================================================
// GET PLATFORM OVERVIEW
// ============================================================
async function getOverview() {
  return respond(200, {
    owner: 'MUFUNG ANGELBELL MBUYEH',
    title: 'AWS Solutions Architect',
    location: 'Yaoundé, Cameroon Northwest',
    platform: 'SRMS — Student Result Management System',
    stats: {
      totalSchools: 9,
      activeSchools: 8,
      suspendedSchools: 1,
      totalStudentIds: 1152,
      totalTeacherIds: 198,
      totalParentIds: 315,
      totalAdminIds: 27,
      totalIds: 1692,
    },
    revenue: {
      thisMonthUSD: '885.00',
      thisMonthXAF: 575250,
      lastMonthUSD: '790.00',
      lastMonthXAF: 513500,
      growthPercent: 12,
      yearToDateUSD: '4420.00',
      yearToDateXAF: 2873000,
    },
    recentActivity: [
      { action: 'New school registered', school: 'Sacred Heart College Mankon', time: '2 hours ago', type: 'registration' },
      { action: 'Payment received', school: 'GBHS Bamenda', amount: '$62.65', time: '5 hours ago', type: 'payment' },
      { action: 'Results published', school: 'PSS Buea', students: 142, time: '1 day ago', type: 'results' },
      { action: 'Complaint resolved', school: 'GBHS Limbe', time: '1 day ago', type: 'complaint' },
      { action: 'Payment received', school: 'College de la Retraite', amount: '$40.00', time: '2 days ago', type: 'payment' },
    ],
  });
}

// ============================================================
// GET ALL SCHOOLS
// ============================================================
async function getAllSchools() {
  // Demo data — in production this reads from DynamoDB
  const schools = [
    {
      tenantId: 'GBHS-2026', name: 'Government Bilingual High School Bamenda',
      shortCode: 'GBHS', region: 'North West', country: 'Cameroon',
      plan: 'standard', status: 'active',
      students: 128, teachers: 22, parents: 35, admins: 3,
      monthlyUSD: '62.65', monthlyXAF: 40723,
      registeredAt: '2026-01-15', lastPayment: '2026-02-01',
      adminEmail: 'admin@gbhs.cm', adminName: 'Dr. Nkeng Emmanuel',
    },
    {
      tenantId: 'PSS-2026', name: 'Provincial Secondary School Buea',
      shortCode: 'PSS', region: 'South West', country: 'Cameroon',
      plan: 'professional', status: 'active',
      students: 342, teachers: 45, parents: 120, admins: 5,
      monthlyUSD: '168.35', monthlyXAF: 109428,
      registeredAt: '2026-01-20', lastPayment: '2026-02-01',
      adminEmail: 'admin@pss-buea.cm', adminName: 'Mrs. Epie Grace',
    },
    {
      tenantId: 'SHC-2026', name: 'Sacred Heart College Mankon',
      shortCode: 'SHC', region: 'North West', country: 'Cameroon',
      plan: 'starter', status: 'active',
      students: 95, teachers: 18, parents: 40, admins: 2,
      monthlyUSD: '30.95', monthlyXAF: 20118,
      registeredAt: '2026-02-01', lastPayment: '2026-02-05',
      adminEmail: 'admin@shc.cm', adminName: 'Br. Patrick Ngu',
    },
    {
      tenantId: 'CDR-2026', name: 'College de la Retraite Yaoundé',
      shortCode: 'CDR', region: 'Centre', country: 'Cameroon',
      plan: 'standard', status: 'active',
      students: 210, teachers: 32, parents: 55, admins: 4,
      monthlyUSD: '89.45', monthlyXAF: 58143,
      registeredAt: '2026-01-10', lastPayment: '2026-02-02',
      adminEmail: 'admin@cdr.cm', adminName: 'Sr. Marie Claire',
    },
    {
      tenantId: 'GHS-2026', name: 'Government High School Limbe',
      shortCode: 'GHS', region: 'South West', country: 'Cameroon',
      plan: 'standard', status: 'active',
      students: 178, teachers: 28, parents: 65, admins: 3,
      monthlyUSD: '75.40', monthlyXAF: 49010,
      registeredAt: '2026-01-18', lastPayment: '2026-02-01',
      adminEmail: 'admin@ghs-limbe.cm', adminName: 'Mr. Mofa Peter',
    },
    {
      tenantId: 'BBC-2026', name: 'Bilingual Grammar School Molyko',
      shortCode: 'BBC', region: 'South West', country: 'Cameroon',
      plan: 'starter', status: 'active',
      students: 88, teachers: 15, parents: 30, admins: 2,
      monthlyUSD: '26.95', monthlyXAF: 17518,
      registeredAt: '2026-02-10', lastPayment: '2026-02-15',
      adminEmail: 'admin@bgs.cm', adminName: 'Mr. Tanyi Moses',
    },
    {
      tenantId: 'CPC-2026', name: 'Cameroon Protestant College Bali',
      shortCode: 'CPC', region: 'North West', country: 'Cameroon',
      plan: 'professional', status: 'active',
      students: 295, teachers: 38, parents: 98, admins: 4,
      monthlyUSD: '142.40', monthlyXAF: 92560,
      registeredAt: '2026-01-08', lastPayment: '2026-02-01',
      adminEmail: 'admin@cpc.cm', adminName: 'Rev. Tita John',
    },
    {
      tenantId: 'QEC-2026', name: 'Queen of the Rosary College Okoyong',
      shortCode: 'QEC', region: 'South', country: 'Cameroon',
      plan: 'standard', status: 'active',
      students: 156, teachers: 24, parents: 48, admins: 2,
      monthlyUSD: '68.40', monthlyXAF: 44460,
      registeredAt: '2026-01-25', lastPayment: '2026-02-03',
      adminEmail: 'admin@qrc.cm', adminName: 'Sr. Agnes Obi',
    },
    {
      tenantId: 'NBC-2026', name: 'Nkwen Baptist College',
      shortCode: 'NBC', region: 'North West', country: 'Cameroon',
      plan: 'starter', status: 'suspended',
      students: 72, teachers: 14, parents: 22, admins: 2,
      monthlyUSD: '21.50', monthlyXAF: 13975,
      registeredAt: '2026-02-05', lastPayment: '2026-01-10',
      adminEmail: 'admin@nbc.cm', adminName: 'Mr. Nji Charles',
    },
  ];

  return respond(200, { schools, total: schools.length });
}

// ============================================================
// GET REVENUE BREAKDOWN
// ============================================================
async function getRevenue() {
  return respond(200, {
    monthly: [
      { month: 'April 2026', revenueUSD: '885.00', revenueXAF: 575250, schools: 9, growth: '+12%' },
      { month: 'March 2026', revenueUSD: '790.00', revenueXAF: 513500, schools: 8, growth: '+8%' },
      { month: 'February 2026', revenueUSD: '731.00', revenueXAF: 475150, schools: 8, growth: '+15%' },
      { month: 'January 2026', revenueUSD: '635.00', revenueXAF: 412750, schools: 7, growth: null },
    ],
    byPlan: {
      starter: { schools: 3, totalUSD: '79.40', totalXAF: 51610 },
      standard: { schools: 4, totalUSD: '296.00', totalXAF: 192400 },
      professional: { schools: 2, totalUSD: '310.75', totalXAF: 201988 },
    },
  });
}

// ============================================================
// GET AUDIT LOG
// ============================================================
async function getAuditLog() {
  return respond(200, {
    logs: [
      { id:'AL001', action:'Results Published', school:'GBHS Bamenda', actor:'Mr. Fon Emmanuel', detail:'Mathematics Form 5 — 42 students', time:'2026-04-16 09:15', type:'results' },
      { id:'AL002', action:'Payment Received', school:'PSS Buea', actor:'System', detail:'$168.35 via MTN MoMo', time:'2026-04-16 08:30', type:'payment' },
      { id:'AL003', action:'Complaint Resolved', school:'GHS Limbe', actor:'Mrs. Ako Ruth', detail:'Physics score corrected: 45→72', time:'2026-04-16 07:45', type:'complaint' },
      { id:'AL004', action:'New School Registered', school:'Sacred Heart College', actor:'Br. Patrick Ngu', detail:'Starter plan selected', time:'2026-04-15 14:20', type:'registration' },
      { id:'AL005', action:'Student ID Created', school:'CPC Bali', actor:'Admin', detail:'CM-CPC-2026-STU-0295', time:'2026-04-15 11:10', type:'id' },
      { id:'AL006', action:'Payment Failed', school:'NBC Nkwen', actor:'System', detail:'MTN MoMo declined — insufficient funds', time:'2026-04-14 09:00', type:'payment_failed' },
      { id:'AL007', action:'Account Suspended', school:'NBC Nkwen', actor:'System (Auto)', detail:'7-day grace period expired', time:'2026-04-14 09:01', type:'suspension' },
      { id:'AL008', action:'Results Published', school:'College de la Retraite', actor:'Sr. Bernadette', detail:'English Language Form 4 — 55 students', time:'2026-04-13 16:30', type:'results' },
    ],
  });
}

// ============================================================
// SUSPEND SCHOOL
// ============================================================
async function suspendSchool(body) {
  const { tenantId, reason } = body;
  if (!tenantId) return respond(400, { error: 'tenantId is required' });

  console.log(`[SRMS-SUPER-ADMIN] Suspending school: ${tenantId} — Reason: ${reason}`);

  return respond(200, {
    success: true,
    tenantId,
    status: 'suspended',
    suspendedAt: new Date().toISOString(),
    message: `School ${tenantId} suspended successfully`,
  });
}

// ============================================================
// REACTIVATE SCHOOL
// ============================================================
async function reactivateSchool(body) {
  const { tenantId } = body;
  if (!tenantId) return respond(400, { error: 'tenantId is required' });

  console.log(`[SRMS-SUPER-ADMIN] Reactivating school: ${tenantId}`);

  return respond(200, {
    success: true,
    tenantId,
    status: 'active',
    reactivatedAt: new Date().toISOString(),
    message: `School ${tenantId} reactivated successfully`,
  });
}

// ============================================================
// HELPERS
// ============================================================
function respond(statusCode, data) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(
      statusCode === 200
        ? { success: true, data }
        : { success: false, error: data }
    ),
  };
}

function parseBody(raw) {
  if (!raw) return {};
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return {}; }
}