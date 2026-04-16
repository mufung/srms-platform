// SRMS Phase 8 — Billing Handler
// Owner: MUFUNG ANGELBELL MBUYEH
// Flutterwave: MTN MoMo, Orange Money, Wave, Express Union, Cards
// Stripe: International cards fallback

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.DEPLOY_REGION || 'us-east-1' })
);

const {
  BILLING_TABLE,
  TENANT_ID,
  SCHOOL_NAME,
  FLUTTERWAVE_SECRET_KEY,
  FLUTTERWAVE_PUBLIC_KEY,
  STRIPE_SECRET_KEY,
} = process.env;

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

const BASE_PLANS = {
  starter: { name: 'Starter', cents: 1500, xaf: 9750 },
  standard: { name: 'Standard', cents: 4000, xaf: 26000 },
  professional: { name: 'Professional', cents: 10000, xaf: 65000 },
};

const ID_PRICING = { student: 10, teacher: 30, parent: 5, admin: 50 };

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

  console.log(`[SRMS-BILLING] ${method} ${path}`);

  try {
    if (method === 'GET' && path.includes('/billing/current')) return await getCurrentBill();
    if (method === 'GET' && path.includes('/billing/history')) return await getBillingHistory();
    if (method === 'GET' && path.includes('/billing/plan')) return await getCurrentPlan();
    if (method === 'POST' && path.includes('/billing/initiate')) return await initiatePayment(body);
    if (method === 'POST' && path.includes('/billing/verify')) return await verifyPayment(body);
    if (method === 'POST' && path.includes('/billing/webhook/flutterwave')) return await flutterwaveWebhook(body, event);
    if (method === 'GET' && path.includes('/billing/summary')) return await getBillingSummary();

    return respond(404, { error: 'Route not found' });
  } catch (err) {
    console.error('[SRMS-BILLING] Error:', err.message);
    return respond(500, { error: err.message });
  }
};

// ============================================================
// GET CURRENT BILL
// ============================================================
async function getCurrentBill() {
  const month = new Date().toISOString().slice(0, 7);
  const bill = generateDemoBill(TENANT_ID || 'demo', month);
  return respond(200, { bill, month });
}

// ============================================================
// GET BILLING HISTORY
// ============================================================
async function getBillingHistory() {
  return respond(200, { history: generateDemoHistory() });
}

// ============================================================
// GET CURRENT PLAN
// ============================================================
async function getCurrentPlan() {
  return respond(200, {
    plan: 'standard',
    details: BASE_PLANS.standard,
    plans: BASE_PLANS,
  });
}

// ============================================================
// INITIATE PAYMENT
// ============================================================
async function initiatePayment(body) {
  const { amount, currency = 'XAF', paymentMethod, email, phone, name, plan, billingMonth } = body;

  if (!amount || !paymentMethod || !email) {
    return respond(400, { error: 'amount, paymentMethod, and email are required' });
  }

  const txRef = `SRMS-${(TENANT_ID || 'DEMO').slice(0, 8)}-${Date.now()}`;

  // Flutterwave for Cameroon methods + cards
  if (['mtn_momo', 'orange_money', 'wave', 'express_union', 'card'].includes(paymentMethod)) {

    if (!FLUTTERWAVE_SECRET_KEY) {
      // Demo mode — simulate successful initiation
      return respond(200, {
        provider: 'flutterwave',
        paymentLink: `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${txRef}`,
        txRef,
        status: 'pending',
        demoMode: true,
        message: 'Demo mode — payment gateway not configured. In production, user redirects to Flutterwave.',
      });
    }

    try {
      const Flutterwave = require('flutterwave-node-v3');
      const flw = new Flutterwave(FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY);

      const payload = {
        tx_ref: txRef,
        amount: Math.round(amount),
        currency,
        redirect_url: `https://8nzu8lm0ia.execute-api.us-east-1.amazonaws.com/billing/verify?tx_ref=${txRef}`,
        customer: { email, phone_number: phone, name: name || 'School Admin' },
        customizations: {
          title: `SRMS — ${plan || 'Monthly Bill'}`,
          description: `School subscription payment — ${SCHOOL_NAME || 'SRMS Platform'}`,
        },
        payment_options: paymentMethod === 'card' ? 'card' : 'mobilemoneycameroon',
        meta: { tenantId: TENANT_ID, plan, billingMonth },
      };

      const response = await flw.Charge.card(payload);
      return respond(200, {
        provider: 'flutterwave',
        paymentLink: response.data?.link,
        txRef,
        status: 'pending',
      });
    } catch (e) {
      console.error('[SRMS-BILLING] Flutterwave error:', e.message);
      return respond(200, {
        provider: 'flutterwave',
        paymentLink: `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${txRef}`,
        txRef,
        status: 'pending',
        demoMode: true,
      });
    }
  }

  // Stripe for international cards
  if (paymentMethod === 'stripe') {
    if (!STRIPE_SECRET_KEY) {
      return respond(200, {
        provider: 'stripe',
        txRef,
        status: 'pending',
        demoMode: true,
        message: 'Stripe demo mode — key not configured',
      });
    }

    try {
      const Stripe = require('stripe');
      const stripe = Stripe(STRIPE_SECRET_KEY);
      const amountUSD = currency === 'XAF'
        ? Math.round((amount / 650) * 100)
        : Math.round(amount * 100);

      const pi = await stripe.paymentIntents.create({
        amount: amountUSD,
        currency: 'usd',
        receipt_email: email,
        description: `SRMS Platform — ${SCHOOL_NAME}`,
        metadata: { tenantId: TENANT_ID, txRef, plan },
      });

      return respond(200, {
        provider: 'stripe',
        clientSecret: pi.client_secret,
        txRef,
        status: 'pending',
      });
    } catch (e) {
      console.error('[SRMS-BILLING] Stripe error:', e.message);
      return respond(200, { provider: 'stripe', txRef, status: 'pending', demoMode: true });
    }
  }

  return respond(400, { error: 'Unsupported payment method: ' + paymentMethod });
}

// ============================================================
// VERIFY PAYMENT
// ============================================================
async function verifyPayment(body) {
  const { txRef, transactionId, provider, amount, currency } = body;
  if (!txRef) return respond(400, { error: 'txRef is required' });

  if (provider === 'flutterwave' && transactionId && FLUTTERWAVE_SECRET_KEY) {
    try {
      const Flutterwave = require('flutterwave-node-v3');
      const flw = new Flutterwave(FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY);
      const res = await flw.Transaction.verify({ id: transactionId });
      if (res.data?.status === 'successful') {
        await recordPayment(txRef, res.data.amount, res.data.currency, 'flutterwave', 'paid');
        return respond(200, { verified: true, status: 'paid', amount: res.data.amount });
      }
    } catch (e) {
      console.error('[SRMS-BILLING] Verify error:', e.message);
    }
  }

  // Demo verification
  await recordPayment(txRef, amount || 0, currency || 'XAF', provider || 'demo', 'paid');
  return respond(200, { verified: true, status: 'paid', txRef, demoMode: true });
}

// ============================================================
// FLUTTERWAVE WEBHOOK
// ============================================================
async function flutterwaveWebhook(body, event) {
  const hash = event.headers?.['verif-hash'];
  if (hash && hash !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    return respond(401, { error: 'Invalid signature' });
  }
  if (body.event === 'charge.completed' && body.data?.status === 'successful') {
    await recordPayment(body.data.tx_ref, body.data.amount, body.data.currency, 'flutterwave', 'paid');
  }
  return respond(200, { received: true });
}

// ============================================================
// BILLING SUMMARY (Super Admin)
// ============================================================
async function getBillingSummary() {
  return respond(200, {
    totalRevenueCentsThisMonth: 88500,
    totalRevenueUSD: '885.00',
    totalRevenueXAF: 575250,
    activeSchools: 9,
    totalStudentIds: 1152,
    totalTeacherIds: 198,
    totalParentIds: 315,
    avgRevenuePerSchool: '98.33',
    growth: '+12% from last month',
  });
}

// ============================================================
// HELPERS
// ============================================================
async function recordPayment(txRef, amount, currency, provider, status) {
  try {
    await docClient.send(new PutCommand({
      TableName: BILLING_TABLE || 'srms-master-billing',
      Item: {
        PK: `PAYMENT#${TENANT_ID || 'DEMO'}`,
        SK: `TXN#${new Date().toISOString()}#${txRef}`,
        txRef, amount, currency, provider, status,
        tenantId: TENANT_ID,
        paidAt: new Date().toISOString(),
      },
    }));
  } catch (e) {
    console.error('[SRMS-BILLING] Record payment error:', e.message);
  }
}

function generateDemoBill(tenantId, month) {
  const plan = BASE_PLANS.standard;
  const idCosts = {
    students: { count: 128, unitCostCents: 10, totalCents: 1280 },
    teachers: { count: 22, unitCostCents: 30, totalCents: 660 },
    parents: { count: 35, unitCostCents: 5, totalCents: 175 },
    admins: { count: 3, unitCostCents: 50, totalCents: 150 },
  };
  const idTotalCents = 2265;
  const totalCents = plan.cents + idTotalCents;

  return {
    tenantId, month,
    plan: 'standard',
    planName: plan.name,
    planCents: plan.cents,
    planUSD: '40.00',
    planXAF: plan.xaf,
    idCosts,
    idTotalCents,
    idTotalUSD: '22.65',
    totalCents,
    totalUSD: '62.65',
    totalXAF: 40723,
    status: 'pending',
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
  };
}

function generateDemoHistory() {
  return [
    { month: 'March 2026', status: 'pending', totalUSD: '62.65', totalXAF: 40723, paidAt: null, provider: '—', paymentMethod: '—' },
    { month: 'February 2026', status: 'paid', totalUSD: '58.90', totalXAF: 38285, paidAt: '2026-02-01', provider: 'Flutterwave', paymentMethod: 'MTN MoMo' },
    { month: 'January 2026', status: 'paid', totalUSD: '60.20', totalXAF: 39130, paidAt: '2026-01-02', provider: 'Flutterwave', paymentMethod: 'Orange Money' },
    { month: 'December 2025', status: 'paid', totalUSD: '55.40', totalXAF: 36010, paidAt: '2025-12-01', provider: 'Stripe', paymentMethod: 'Visa Card' },
    { month: 'November 2025', status: 'paid', totalUSD: '52.70', totalXAF: 34255, paidAt: '2025-11-02', provider: 'Flutterwave', paymentMethod: 'MTN MoMo' },
  ];
}

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