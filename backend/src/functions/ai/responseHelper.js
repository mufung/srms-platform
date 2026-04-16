// ============================================================
// SRMS-1-UTIL-001: API Response Helper
// Owner: MUFUNG ANGELBELL MBUYEH
// Description: Standardizes all API responses across all Lambda functions
// Every Lambda uses this to return consistent responses
// ============================================================

// SRMS-1-UTIL-002: Standard CORS headers included in every response
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-SRMS-Tenant-ID, X-SRMS-User-Role',
  'Access-Control-Max-Age': '86400',
};

// SRMS-1-UTIL-003: Success response
const success = (data, statusCode = 200, message = 'Success') => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }),
});

// SRMS-1-UTIL-004: Error response
const error = (message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({
    success: false,
    error: {
      code: errorCode,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  }),
});

// SRMS-1-UTIL-005: Specific error types
const notFound = (resource) => error(`${resource} not found`, 404, 'NOT_FOUND');
const unauthorized = (msg = 'Unauthorized') => error(msg, 401, 'UNAUTHORIZED');
const forbidden = (msg = 'Access denied') => error(msg, 403, 'FORBIDDEN');
const badRequest = (msg, details = null) => error(msg, 400, 'BAD_REQUEST', details);
const notEnabled = (section) => error(`This feature requires ${section} to be enabled for your school`, 403, 'SECTION_NOT_ENABLED');

// SRMS-1-UTIL-006: CORS preflight response (for OPTIONS requests)
const corsPreFlight = () => ({
  statusCode: 200,
  headers: CORS_HEADERS,
  body: '',
});

// SRMS-1-UTIL-007: Paginated response
const paginated = (items, total, page, pageSize) => success({
  items,
  pagination: {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: page * pageSize < total,
    hasPreviousPage: page > 1,
  },
});

module.exports = {
  success,
  error,
  notFound,
  unauthorized,
  forbidden,
  badRequest,
  notEnabled,
  corsPreFlight,
  paginated,
  CORS_HEADERS,
};