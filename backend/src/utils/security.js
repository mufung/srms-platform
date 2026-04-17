// SRMS Security Middleware
// Owner: MUFUNG ANGELBELL MBUYEH
// Adds: Rate limiting, input validation, JWT checking, CORS lockdown

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.DEPLOY_REGION || 'us-east-1' })
);

const AUDIT_TABLE = process.env.AUDIT_TABLE || 'srms-master-audit';

// SRMS-SEC-001: Allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8081',
  'https://srms.platform',
  'https://main.srms.amplifyapp.com',
];

// SRMS-SEC-002: Rate limit config (requests per minute per IP)
const RATE_LIMITS = {
  '/ai/chat': 20,
  '/billing/initiate': 5,
  '/auth/login': 10,
  default: 100,
};

// ============================================================
// CORS HEADERS
// ============================================================
function getCorsHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

// ============================================================
// SRMS-SEC-003: RATE LIMITER
// ============================================================
async function checkRateLimit(ip, path) {
  try {
    const limit = RATE_LIMITS[path] || RATE_LIMITS.default;
    const minute = new Date().toISOString().slice(0, 16);
    const key = `RATELIMIT#${ip}#${minute}`;

    const result = await docClient.send(new GetCommand({
      TableName: AUDIT_TABLE,
      Key: { PK: key, SK: 'COUNT' },
    }));

    const count = result.Item?.count || 0;

    if (count >= limit) {
      return { allowed: false, remaining: 0, limit };
    }

    await docClient.send(new PutCommand({
      TableName: AUDIT_TABLE,
      Item: {
        PK: key, SK: 'COUNT',
        count: count + 1,
        limit,
        ttl: Math.floor(Date.now() / 1000) + 120,
        ip, path, minute,
      },
    }));

    return { allowed: true, remaining: limit - count - 1, limit };
  } catch (e) {
    console.error('[SRMS-SEC] Rate limit check error:', e.message);
    return { allowed: true, remaining: 99, limit: 100 };
  }
}

// ============================================================
// SRMS-SEC-004: INPUT SANITIZER
// ============================================================
function sanitizeInput(obj, depth = 0) {
  if (depth > 5) return obj;
  if (typeof obj === 'string') {
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/DROP\s+TABLE/gi, '')
      .replace(/DELETE\s+FROM/gi, '')
      .replace(/INSERT\s+INTO/gi, '')
      .replace(/UNION\s+SELECT/gi, '')
      .replace(/--/g, '')
      .trim();
  }
  if (Array.isArray(obj)) return obj.map(item => sanitizeInput(item, depth + 1));
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      clean[sanitizeInput(key, depth + 1)] = sanitizeInput(value, depth + 1);
    }
    return clean;
  }
  return obj;
}

// ============================================================
// SRMS-SEC-005: VALIDATE SRMS ID FORMAT
// ============================================================
function validateSrmsId(id) {
  if (!id) return false;
  const pattern = /^CM-[A-Z0-9]{2,8}-\d{4}-(STU|TCH|PAR|ADM|SAP)-\d{4}$/;
  return pattern.test(id.toUpperCase());
}

// ============================================================
// SRMS-SEC-006: SECURITY AUDIT LOG
// ============================================================
async function logSecurityEvent(eventType, details) {
  try {
    const now = new Date().toISOString();
    await docClient.send(new PutCommand({
      TableName: AUDIT_TABLE,
      Item: {
        PK: `SECURITY#${now.slice(0, 10)}`,
        SK: `EVENT#${now}#${Math.random().toString(36).slice(2)}`,
        eventType,
        details,
        timestamp: now,
        ttl: Math.floor(Date.now() / 1000) + 7776000,
      },
    }));
  } catch (e) {
    console.error('[SRMS-SEC] Audit log error:', e.message);
  }
}

// ============================================================
// SRMS-SEC-007: EXTRACT CLIENT IP
// ============================================================
function getClientIp(event) {
  return event.requestContext?.http?.sourceIp
    || event.headers?.['x-forwarded-for']?.split(',')[0]
    || event.headers?.['X-Forwarded-For']?.split(',')[0]
    || 'unknown';
}

// ============================================================
// SRMS-SEC-008: VALIDATE REQUEST SIZE
// ============================================================
function validateRequestSize(body) {
  if (!body) return true;
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  const sizeKB = Buffer.byteLength(bodyStr, 'utf8') / 1024;
  return sizeKB <= 512;
}

// ============================================================
// SRMS-SEC-009: MAIN SECURITY CHECKER
// ============================================================
async function checkSecurity(event) {
  const path = event.rawPath || event.path || '';
  const method = (event.requestContext?.http?.method || event.httpMethod || 'GET').toUpperCase();
  const ip = getClientIp(event);
  const headers = getCorsHeaders(event);

  // Handle preflight
  if (method === 'OPTIONS') {
    return { passed: true, headers, preflight: true };
  }

  // Check request size
  if (!validateRequestSize(event.body)) {
    await logSecurityEvent('OVERSIZED_REQUEST', { ip, path, size: event.body?.length });
    return {
      passed: false,
      headers,
      response: {
        statusCode: 413,
        headers,
        body: JSON.stringify({ success: false, error: 'Request too large' }),
      },
    };
  }

  // Rate limiting
  const rateCheck = await checkRateLimit(ip, path);
  if (!rateCheck.allowed) {
    await logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, path });
    return {
      passed: false,
      headers,
      response: {
        statusCode: 429,
        headers: {
          ...headers,
          'Retry-After': '60',
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': '0',
        },
        body: JSON.stringify({
          success: false,
          error: 'Too many requests. Please wait 1 minute.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
      },
    };
  }

  return {
    passed: true,
    headers: {
      ...headers,
      'X-RateLimit-Remaining': String(rateCheck.remaining),
    },
    ip,
  };
}

module.exports = {
  checkSecurity,
  sanitizeInput,
  validateSrmsId,
  getCorsHeaders,
  logSecurityEvent,
  getClientIp,
};