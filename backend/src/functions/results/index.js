// SRMS-4-RESULTS-001: Complete Results Lambda Handler
// Owner: MUFUNG ANGELBELL MBUYEH
// Handles: upload, calculate, save, publish, get, export

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { success, error, corsPreFlight, badRequest } = require('./responseHelper');
const { withErrorHandler, ValidationError, UnauthorizedError, SectionNotEnabledError } = require('./errorHandler');
const { calculateClassResults, parseUploadedData, generateClassSummary, detectAnomalies, getGrade } = require('./gradeCalculator');
const { v4: uuidv4 } = require('uuid');

// SRMS-4-RESULTS-002: Initialize AWS clients
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.DEPLOY_REGION || 'us-east-1' }));
const s3Client = new S3Client({ region: process.env.DEPLOY_REGION || 'us-east-1' });

const {
  RESULTS_TABLE,
  USERS_TABLE,
  AUDIT_TABLE,
  STORAGE_BUCKET,
  TENANT_ID,
  SCHOOL_NAME,
  HAS_SECTION_1,
  HAS_SECTION_3,
} = process.env;

// SRMS-4-RESULTS-003: Main router
const handler = withErrorHandler(async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return corsPreFlight();

  if (HAS_SECTION_1 !== 'true') {
    throw new SectionNotEnabledError('Section 1 - Result Publishing');
  }

  const path = event.rawPath || '';
  const method = event.requestContext?.http?.method || 'GET';
  const body = parseBody(event.body);

  console.log(`[SRMS-RESULTS] ${method} ${path}`);

  // SRMS-4-RESULTS-004: Route mapping
  if (method === 'POST' && path.includes('/results/upload')) return await uploadResults(body, event);
  if (method === 'POST' && path.includes('/results/calculate')) return await calculateResults(body);
  if (method === 'POST' && path.includes('/results/save')) return await saveResults(body, event);
  if (method === 'POST' && path.includes('/results/publish')) return await publishResults(body, event);
  if (method === 'POST' && path.includes('/results/finalize')) return await finalizeResults(body, event);
  if (method === 'GET' && path.includes('/results/student/')) return await getStudentResults(event);
  if (method === 'GET' && path.includes('/results/class/')) return await getClassResults(event);
  if (method === 'GET' && path.includes('/results/my')) return await getMyResults(event);
  if (method === 'POST' && path.includes('/results/confirm')) return await confirmResults(body, event);
  if (method === 'GET' && path.includes('/results/upload-url')) return await getUploadUrl(event);
  if (method === 'POST' && path.includes('/results/from-file')) return await processFileUpload(body, event);
  if (method === 'GET' && path.includes('/results/history')) return await getResultHistory(event);
  if (method === 'GET' && path.includes('/results/summary')) return await getClassSummary(event);

  return error('Route not found', 404, 'NOT_FOUND');
});

// ============================================================
// SRMS-4-RESULTS-010: UPLOAD RESULTS (Teacher enters scores)
// ============================================================
const uploadResults = async (body, event) => {
  const { className, term, year, academicYear, subjectName, teacherId, students, gradingScale } = body;

  if (!className || !term || !subjectName || !teacherId || !students) {
    throw new ValidationError('className, term, subjectName, teacherId, students are required');
  }

  if (!Array.isArray(students) || students.length === 0) {
    throw new ValidationError('students must be a non-empty array');
  }

  // SRMS-4-RESULTS-011: Validate each student entry
  const validatedStudents = students.map((student, index) => {
    const score = parseFloat(student.score);
    if (isNaN(score) || score < 0 || score > 100) {
      throw new ValidationError(`Invalid score for student at index ${index}: "${student.score}". Score must be 0-100.`);
    }
    return {
      studentId: student.studentId,
      studentName: student.studentName,
      score,
      maxScore: student.maxScore || 100,
    };
  });

  const resultSetId = `${TENANT_ID}-${className.replace(/\s+/g, '-')}-${term}-${year || new Date().getFullYear()}-${subjectName.replace(/\s+/g, '-')}`.toLowerCase();
  const now = new Date().toISOString();

  // SRMS-4-RESULTS-012: Calculate grades immediately
  const studentsWithGrades = validatedStudents.map(student => {
    const percentage = Math.round((student.score / student.maxScore) * 100);
    const gradeInfo = getGrade(percentage);
    return {
      ...student,
      percentage,
      grade: gradeInfo.grade,
      gradeColor: gradeInfo.color,
      gradeLabel: gradeInfo.label,
      passed: gradeInfo.grade !== 'F',
    };
  });

  // SRMS-4-RESULTS-013: Save to DynamoDB as draft
  const resultRecord = {
    PK: `RESULT#${resultSetId}`,
    SK: 'METADATA',
    resultSetId,
    tenantId: TENANT_ID,
    schoolName: SCHOOL_NAME,
    className,
    term,
    year: year || new Date().getFullYear().toString(),
    academicYear: academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    subjectName,
    teacherId,
    students: studentsWithGrades,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    finalizedAt: null,
    gradingScale: gradingScale || 'default',
    totalStudents: studentsWithGrades.length,
    passedCount: studentsWithGrades.filter(s => s.passed).length,
    failedCount: studentsWithGrades.filter(s => !s.passed).length,
    classAverage: Math.round(studentsWithGrades.reduce((sum, s) => sum + s.percentage, 0) / studentsWithGrades.length),
  };

  await docClient.send(new PutCommand({ TableName: RESULTS_TABLE, Item: resultRecord }));

  await logAudit('RESULTS_UPLOADED', teacherId, { resultSetId, className, subjectName, studentCount: students.length });

  return success({
    resultSetId,
    status: 'draft',
    students: studentsWithGrades,
    summary: {
      totalStudents: studentsWithGrades.length,
      passed: studentsWithGrades.filter(s => s.passed).length,
      failed: studentsWithGrades.filter(s => !s.passed).length,
      classAverage: resultRecord.classAverage,
    },
    message: 'Results uploaded as draft. Review and publish when ready.',
  }, 201, 'Results uploaded successfully');
};

// ============================================================
// SRMS-4-RESULTS-020: CALCULATE (Full class calculation)
// ============================================================
const calculateResults = async (body) => {
  const { students, gradingScale } = body;

  if (!students || !Array.isArray(students)) {
    throw new ValidationError('students array is required');
  }

  // SRMS-4-RESULTS-021: Run through the grade calculator engine
  const calculated = calculateClassResults(students, gradingScale);
  const summary = generateClassSummary(calculated);

  return success({
    students: calculated.students,
    summary,
    subjectStats: calculated.subjectStats,
    message: 'Calculation complete. Review results before saving.',
  });
};

// ============================================================
// SRMS-4-RESULTS-030: SAVE RESULTS (After calculation)
// ============================================================
const saveResults = async (body, event) => {
  const { resultSetId, students, className, term, year, subjectName, teacherId, gradingScale } = body;

  if (!resultSetId || !students) {
    throw new ValidationError('resultSetId and students are required');
  }

  const calculated = calculateClassResults(students, gradingScale);
  const summary = generateClassSummary(calculated);
  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: RESULTS_TABLE,
    Key: { PK: `RESULT#${resultSetId}`, SK: 'METADATA' },
    UpdateExpression: 'SET students = :students, classAverage = :avg, #status = :status, updatedAt = :now, subjectStats = :stats, summary = :summary',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':students': calculated.students,
      ':avg': summary.averageScore,
      ':status': 'saved',
      ':now': now,
      ':stats': calculated.subjectStats,
      ':summary': summary,
    },
  }));

  return success({ resultSetId, status: 'saved', summary, message: 'Results saved successfully.' });
};

// ============================================================
// SRMS-4-RESULTS-040: PUBLISH RESULTS (Make visible to students)
// ============================================================
const publishResults = async (body, event) => {
  const { resultSetId, teacherId } = body;

  if (!resultSetId) throw new ValidationError('resultSetId is required');

  const existing = await getResultRecord(resultSetId);
  if (!existing) throw new ValidationError('Result set not found');
  if (existing.status === 'final') throw new ValidationError('Final results cannot be changed');

  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: RESULTS_TABLE,
    Key: { PK: `RESULT#${resultSetId}`, SK: 'METADATA' },
    UpdateExpression: 'SET #status = :status, publishedAt = :now, updatedAt = :now',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':status': 'published', ':now': now },
  }));

  await logAudit('RESULTS_PUBLISHED', teacherId || 'teacher', { resultSetId });

  return success({ resultSetId, status: 'published', publishedAt: now, message: 'Results are now visible to students.' });
};

// ============================================================
// SRMS-4-RESULTS-050: FINALIZE RESULTS (Lock permanently)
// ============================================================
const finalizeResults = async (body, event) => {
  const { resultSetId, teacherId } = body;
  if (!resultSetId) throw new ValidationError('resultSetId is required');

  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: RESULTS_TABLE,
    Key: { PK: `RESULT#${resultSetId}`, SK: 'METADATA' },
    UpdateExpression: 'SET #status = :status, finalizedAt = :now, updatedAt = :now',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':status': 'final', ':now': now },
  }));

  await logAudit('RESULTS_FINALIZED', teacherId || 'teacher', { resultSetId });

  return success({ resultSetId, status: 'final', message: 'Results finalized and locked permanently.' });
};

// ============================================================
// SRMS-4-RESULTS-060: GET STUDENT RESULTS
// ============================================================
const getStudentResults = async (event) => {
  const studentId = event.pathParameters?.studentId || event.queryStringParameters?.studentId;
  const term = event.queryStringParameters?.term;
  const year = event.queryStringParameters?.year;

  if (!studentId) throw new ValidationError('studentId is required');

  // SRMS-4-RESULTS-061: Scan for all result sets containing this student
  const scanResult = await docClient.send(new ScanCommand({
    TableName: RESULTS_TABLE,
    FilterExpression: 'tenantId = :tid AND SK = :sk AND #status IN (:pub, :fin)',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':tid': TENANT_ID,
      ':sk': 'METADATA',
      ':pub': 'published',
      ':fin': 'final',
    },
  }));

  const allResults = (scanResult.Items || []);
  const studentResults = [];

  allResults.forEach(resultSet => {
    const studentData = (resultSet.students || []).find(s => s.studentId === studentId);
    if (studentData) {
      if (term && resultSet.term !== term) return;
      if (year && resultSet.year !== year) return;

      studentResults.push({
        resultSetId: resultSet.resultSetId,
        subjectName: resultSet.subjectName,
        className: resultSet.className,
        term: resultSet.term,
        year: resultSet.year,
        academicYear: resultSet.academicYear,
        score: studentData.score,
        maxScore: studentData.maxScore,
        percentage: studentData.percentage,
        grade: studentData.grade,
        gradeColor: studentData.gradeColor,
        gradeLabel: studentData.gradeLabel,
        classPosition: studentData.subjectPosition,
        classSize: resultSet.totalStudents,
        remarks: studentData.remarks,
        teacherId: resultSet.teacherId,
        publishedAt: resultSet.publishedAt,
        status: resultSet.status,
        confirmed: studentData.confirmed || false,
      });
    }
  });

  // SRMS-4-RESULTS-062: Group by term and calculate overall
  const byTerm = {};
  studentResults.forEach(result => {
    const key = `${result.term}-${result.year}`;
    if (!byTerm[key]) byTerm[key] = { term: result.term, year: result.year, subjects: [] };
    byTerm[key].subjects.push(result);
  });

  Object.values(byTerm).forEach(termData => {
    const total = termData.subjects.reduce((sum, s) => sum + s.percentage, 0);
    const avg = Math.round(total / termData.subjects.length);
    const overallGrade = getGrade(avg);
    termData.average = avg;
    termData.overallGrade = overallGrade.grade;
    termData.overallGradeColor = overallGrade.color;
    termData.totalSubjects = termData.subjects.length;
    termData.passed = termData.subjects.filter(s => s.grade !== 'F').length;
    termData.failed = termData.subjects.filter(s => s.grade === 'F').length;
  });

  return success({
    studentId,
    results: studentResults,
    byTerm: Object.values(byTerm),
    totalSubjects: studentResults.length,
  });
};

// ============================================================
// SRMS-4-RESULTS-070: GET CLASS RESULTS (Teacher view)
// ============================================================
const getClassResults = async (event) => {
  const className = event.pathParameters?.className || event.queryStringParameters?.className;
  const term = event.queryStringParameters?.term;
  const year = event.queryStringParameters?.year;

  const scanResult = await docClient.send(new ScanCommand({
    TableName: RESULTS_TABLE,
    FilterExpression: 'tenantId = :tid AND SK = :sk AND className = :cn',
    ExpressionAttributeValues: {
      ':tid': TENANT_ID,
      ':sk': 'METADATA',
      ':cn': className || '',
    },
  }));

  return success({ results: scanResult.Items || [] });
};

// ============================================================
// SRMS-4-RESULTS-080: GET MY RESULTS (Student self-view)
// ============================================================
const getMyResults = async (event) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) throw new UnauthorizedError('Authentication required');

  const term = event.queryStringParameters?.term;
  const year = event.queryStringParameters?.year || new Date().getFullYear().toString();

  const scanResult = await docClient.send(new ScanCommand({
    TableName: RESULTS_TABLE,
    FilterExpression: 'tenantId = :tid AND SK = :sk AND #status IN (:pub, :fin)',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':tid': TENANT_ID,
      ':sk': 'METADATA',
      ':pub': 'published',
      ':fin': 'final',
    },
  }));

  return success({ results: scanResult.Items || [], term, year });
};

// ============================================================
// SRMS-4-RESULTS-090: CONFIRM RESULTS (Student confirms)
// ============================================================
const confirmResults = async (body, event) => {
  const { resultSetId, studentId, confirmed } = body;
  if (!resultSetId || !studentId) throw new ValidationError('resultSetId and studentId are required');

  const existing = await getResultRecord(resultSetId);
  if (!existing) throw new ValidationError('Result set not found');

  const updatedStudents = (existing.students || []).map(student => {
    if (student.studentId === studentId) {
      return { ...student, confirmed: confirmed !== false, confirmedAt: new Date().toISOString() };
    }
    return student;
  });

  await docClient.send(new UpdateCommand({
    TableName: RESULTS_TABLE,
    Key: { PK: `RESULT#${resultSetId}`, SK: 'METADATA' },
    UpdateExpression: 'SET students = :students, updatedAt = :now',
    ExpressionAttributeValues: { ':students': updatedStudents, ':now': new Date().toISOString() },
  }));

  return success({ confirmed: true, message: 'Result confirmation recorded.' });
};

// ============================================================
// SRMS-4-RESULTS-100: GET UPLOAD URL (For file uploads)
// ============================================================
const getUploadUrl = async (event) => {
  const fileName = event.queryStringParameters?.fileName || `upload-${Date.now()}.xlsx`;
  const fileKey = `${TENANT_ID}/results/uploads/${Date.now()}-${fileName}`;

  const putCommand = new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: fileKey,
    ContentType: 'application/octet-stream',
  });

  const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 300 });

  return success({ uploadUrl, fileKey, expiresIn: 300 });
};

// ============================================================
// SRMS-4-RESULTS-110: PROCESS FILE UPLOAD
// ============================================================
const processFileUpload = async (body, event) => {
  const { fileData, className, term, year, subjectName, teacherId } = body;

  if (!fileData) throw new ValidationError('fileData is required');

  // SRMS-4-RESULTS-111: Parse the raw data from the uploaded file
  const parsedStudents = parseUploadedData(fileData);

  if (parsedStudents.length === 0) {
    throw new ValidationError('No valid student data found in the uploaded file. Check the format.');
  }

  return success({
    parsedStudents,
    count: parsedStudents.length,
    message: `${parsedStudents.length} students parsed from file. Review and save.`,
  });
};

// ============================================================
// SRMS-4-RESULTS-120: GET RESULT HISTORY
// ============================================================
const getResultHistory = async (event) => {
  const studentId = event.queryStringParameters?.studentId;

  const scanResult = await docClient.send(new ScanCommand({
    TableName: RESULTS_TABLE,
    FilterExpression: 'tenantId = :tid AND SK = :sk',
    ExpressionAttributeValues: { ':tid': TENANT_ID, ':sk': 'METADATA' },
  }));

  const history = (scanResult.Items || []).filter(r =>
    r.status === 'published' || r.status === 'final'
  );

  return success({ history, count: history.length });
};

// ============================================================
// SRMS-4-RESULTS-130: GET CLASS SUMMARY
// ============================================================
const getClassSummary = async (event) => {
  const resultSetId = event.queryStringParameters?.resultSetId;
  if (!resultSetId) throw new ValidationError('resultSetId is required');

  const result = await getResultRecord(resultSetId);
  if (!result) throw new ValidationError('Result set not found');

  const calculated = calculateClassResults(result.students || []);
  const summary = generateClassSummary(calculated);

  return success({ summary, resultSetId });
};

// ============================================================
// SRMS-4-RESULTS-140: HELPER FUNCTIONS
// ============================================================
const getResultRecord = async (resultSetId) => {
  const result = await docClient.send(new GetCommand({
    TableName: RESULTS_TABLE,
    Key: { PK: `RESULT#${resultSetId}`, SK: 'METADATA' },
  }));
  return result.Item || null;
};

const parseBody = (raw) => {
  if (!raw) return {};
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return {}; }
};

const logAudit = async (actionType, actorId, details = {}) => {
  try {
    const now = new Date().toISOString();
    await docClient.send(new PutCommand({
      TableName: AUDIT_TABLE,
      Item: {
        PK: `AUDIT#${TENANT_ID}`,
        SK: `ACTION#${now}#${uuidv4()}`,
        actionType, actorId, tenantId: TENANT_ID,
        who: actorId, what: actionType, when: now,
        where: SCHOOL_NAME, details, timestamp: now,
      },
    }));
  } catch (e) { console.error('[AUDIT-ERROR]', e); }
};

module.exports = { handler };