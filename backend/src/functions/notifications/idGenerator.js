// ============================================================
// SRMS-1-UTIL-020: SRMS ID Generator
// Owner: MUFUNG ANGELBELL MBUYEH
// Description: Generates structured IDs for all system users
// Format: COUNTRY-SCHOOL-YEAR-ROLE-NUMBER
// Example: CM-GBHS-2026-STU-0042
// ============================================================

// SRMS-1-UTIL-021: Role codes for each user type
const ROLE_CODES = {
  student: 'STU',
  teacher: 'TCH',
  parent: 'PAR',
  admin: 'ADM',
  schoolAdmin: 'SAD',
  other: 'OTH',
};

// SRMS-1-UTIL-022: Generate a structured SRMS ID
// Example: generateSrmsId('Cameroon', 'GBHS', 'student', 42) → CM-GBHS-2026-STU-0042
const generateSrmsId = (country, schoolCode, role, sequenceNumber) => {
  // SRMS-1-UTIL-023: Get 2-letter country code
  const countryCode = getCountryCode(country);

  // SRMS-1-UTIL-024: Clean school code (uppercase, no spaces)
  const cleanSchoolCode = schoolCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

  // SRMS-1-UTIL-025: Get current academic year
  const year = new Date().getFullYear().toString();

  // SRMS-1-UTIL-026: Get role code
  const roleCode = ROLE_CODES[role] || ROLE_CODES.other;

  // SRMS-1-UTIL-027: Pad sequence number to 4 digits (0001, 0042, etc.)
  const paddedNumber = String(sequenceNumber).padStart(4, '0');

  return `${countryCode}-${cleanSchoolCode}-${year}-${roleCode}-${paddedNumber}`;
};

// SRMS-1-UTIL-028: Parse an SRMS ID back into its components
const parseSrmsId = (srmsId) => {
  // SRMS-1-UTIL-029: ID format: CM-GBHS-2026-STU-0042
  const parts = srmsId.split('-');
  if (parts.length !== 5) {
    return null; // Invalid ID format
  }

  const [countryCode, schoolCode, year, roleCode, number] = parts;

  // SRMS-1-UTIL-030: Find role from role code
  const role = Object.keys(ROLE_CODES).find(key => ROLE_CODES[key] === roleCode) || 'unknown';

  return {
    countryCode,
    schoolCode,
    year: parseInt(year),
    roleCode,
    role,
    number: parseInt(number),
    isValid: true,
  };
};

// SRMS-1-UTIL-031: Validate if a string is a valid SRMS ID
const isValidSrmsId = (srmsId) => {
  if (!srmsId || typeof srmsId !== 'string') return false;
  // SRMS-1-UTIL-032: Regex: 2 letters - 2-6 letters/numbers - 4 digits - 3 letters - 4 digits
  const pattern = /^[A-Z]{2}-[A-Z0-9]{2,6}-\d{4}-[A-Z]{3}-\d{4}$/;
  return pattern.test(srmsId);
};

// SRMS-1-UTIL-033: Generate a Parent ID linked to a student ID
// Parent of CM-GBHS-2026-STU-0042 gets CM-GBHS-2026-PAR-0042
const generateParentId = (studentSrmsId) => {
  const parsed = parseSrmsId(studentSrmsId);
  if (!parsed || parsed.role !== 'student') return null;

  return `${parsed.countryCode}-${parsed.schoolCode}-${parsed.year}-PAR-${String(parsed.number).padStart(4, '0')}`;
};

// SRMS-1-UTIL-034: Extract role from SRMS ID
const getRoleFromSrmsId = (srmsId) => {
  const parsed = parseSrmsId(srmsId);
  return parsed ? parsed.role : null;
};

// SRMS-1-UTIL-035: Get school code from SRMS ID
const getSchoolCodeFromSrmsId = (srmsId) => {
  const parsed = parseSrmsId(srmsId);
  return parsed ? parsed.schoolCode : null;
};

// SRMS-1-UTIL-036: Country code lookup
const getCountryCode = (country) => {
  const codes = {
    cameroon: 'CM',
    nigeria: 'NG',
    ghana: 'GH',
    kenya: 'KE',
    'south africa': 'ZA',
    ethiopia: 'ET',
    uganda: 'UG',
    senegal: 'SN',
    default: 'XX',
  };
  return codes[country.toLowerCase()] || codes.default;
};

// SRMS-1-UTIL-037: Generate a unique complaint tracking number
const generateComplaintId = (tenantId, sequenceNumber) => {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(6, '0');
  return `CMP-${tenantId.toUpperCase()}-${year}-${paddedNumber}`;
};

// SRMS-1-UTIL-038: Generate a unique result set ID
const generateResultSetId = (tenantId, classCode, term, year) => {
  return `RES-${tenantId.toUpperCase()}-${classCode}-${term}-${year}`;
};

module.exports = {
  generateSrmsId,
  parseSrmsId,
  isValidSrmsId,
  generateParentId,
  getRoleFromSrmsId,
  getSchoolCodeFromSrmsId,
  generateComplaintId,
  generateResultSetId,
  ROLE_CODES,
};