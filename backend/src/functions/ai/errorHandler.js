// ============================================================
// SRMS-1-UTIL-010: Global Error Handler
// Owner: MUFUNG ANGELBELL MBUYEH
// Description: Catches all errors in Lambda functions
// Logs them to CloudWatch and returns friendly error messages
// ============================================================

const { error } = require('./responseHelper');

// SRMS-1-UTIL-011: Error types and their HTTP status codes
const ERROR_MAP = {
  ValidationError: 400,
  BadRequestError: 400,
  UnauthorizedError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  ConflictError: 409,
  TenantSuspendedError: 402,
  SectionNotEnabledError: 403,
  ResourceExistsError: 409,
};

// SRMS-1-UTIL-012: Main error handler wrapper
// Wraps any Lambda handler to catch errors automatically
const withErrorHandler = (handler) => async (event, context) => {
  // SRMS-1-UTIL-013: Add request ID to all logs for tracing
  const requestId = context.awsRequestId;
  console.log(`[SRMS-${requestId}] Request received:`, {
    path: event.rawPath || event.path,
    method: event.requestContext?.http?.method,
    tenantId: event.headers?.['x-srms-tenant-id'],
  });

  try {
    // SRMS-1-UTIL-014: Execute the actual handler
    const result = await handler(event, context);
    console.log(`[SRMS-${requestId}] Request completed successfully`);
    return result;
  } catch (err) {
    // SRMS-1-UTIL-015: Log the full error to CloudWatch
    console.error(`[SRMS-${requestId}] ERROR:`, {
      name: err.name,
      message: err.message,
      stack: err.stack,
      tenantId: event.headers?.['x-srms-tenant-id'],
    });

    // SRMS-1-UTIL-016: Determine HTTP status code from error type
    const statusCode = ERROR_MAP[err.name] || 500;

    // SRMS-1-UTIL-017: Return a friendly error (never expose internal details)
    return error(
      err.message || 'An unexpected error occurred. Please try again.',
      statusCode,
      err.name || 'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? err.stack : null
    );
  }
};

// SRMS-1-UTIL-018: Custom error classes for clear error handling
class ValidationError extends Error {
  constructor(message) { super(message); this.name = 'ValidationError'; }
}
class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') { super(message); this.name = 'UnauthorizedError'; }
}
class ForbiddenError extends Error {
  constructor(message = 'Access denied') { super(message); this.name = 'ForbiddenError'; }
}
class NotFoundError extends Error {
  constructor(resource) { super(`${resource} not found`); this.name = 'NotFoundError'; }
}
class TenantSuspendedError extends Error {
  constructor() { super('Your school account is suspended. Please contact support.'); this.name = 'TenantSuspendedError'; }
}
class SectionNotEnabledError extends Error {
  constructor(section) { super(`Feature not available. Your school needs to purchase ${section}.`); this.name = 'SectionNotEnabledError'; }
}
class ConflictError extends Error {
  constructor(message) { super(message); this.name = 'ConflictError'; }
}

module.exports = {
  withErrorHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  TenantSuspendedError,
  SectionNotEnabledError,
  ConflictError,
};