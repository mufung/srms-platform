// SRMS-5-COMPLAINTS-001: Complete Complaints Lambda Handler
// Owner: MUFUNG ANGELBELL MBUYEH
// Handles: raise complaint, get complaints, resolve, reject, get proof upload URL

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { v4: uuidv4 } = require('uuid');
const { success, error, corsPreFlight } = require('./responseHelper');
const { withErrorHandler, ValidationError, SectionNotEnabledError, UnauthorizedError } = require('./errorHandler');

// SRMS-5-COMPLAINTS-002: AWS clients
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.DEPLOY_REGION || 'us-east-1' }));
const s3Client = new S3Client({ region: process.env.DEPLOY_REGION || 'us-east-1' });
const sesClient = new SESClient({ region: process.env.DEPLOY_REGION || 'us-east-1' });
const snsClient = new SNSClient({ region: process.env.DEPLOY_REGION || 'us-east-1' });

const {
  COMPLAINTS_TABLE, RESULTS_TABLE, USERS_TABLE, AUDIT_TABLE,
  STORAGE_BUCKET, TENANT_ID, SCHOOL_NAME, HAS_SECTION_2,
  SES_FROM_EMAIL,
} = process.env;

// SRMS-5-COMPLAINTS-003: Main router
const handler = withErrorHandler(async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return corsPreFlight();

  if (HAS_SECTION_2 !== 'true') {
    throw new SectionNotEnabledError('Section 2 - Complaint Engine');
  }

  const path = event.rawPath || '';
  const method = event.requestContext?.http?.method || 'GET';
  const body = parseBody(event.body);

  console.log(`[SRMS-COMPLAINTS] ${method} ${path}`);

  if (method === 'POST' && path.includes('/complaints/raise')) return await raiseComplaint(body, event);
  if (method === 'GET' && path.includes('/complaints/my')) return await getMyComplaints(event);
  if (method === 'GET' && path.includes('/complaints/inbox')) return await getTeacherInbox(event);
  if (method === 'GET' && path.includes('/complaints/detail')) return await getComplaintDetail(event);
  if (method === 'POST' && path.includes('/complaints/resolve')) return await resolveComplaint(body, event);
  if (method === 'POST' && path.includes('/complaints/reject')) return await rejectComplaint(body, event);
  if (method === 'POST' && path.includes('/complaints/request-more')) return await requestMoreEvidence(body, event);
  if (method === 'GET' && path.includes('/complaints/proof-url')) return await getProofUploadUrl(event);
  if (method === 'GET' && path.includes('/complaints/stats')) return await getComplaintStats(event);

  return error('Route not found', 404, 'NOT_FOUND');
});

// ============================================================
// SRMS-5-COMPLAINTS-010: RAISE A COMPLAINT
// ============================================================
const raiseComplaint = async (body, event) => {
  const {
    studentId, studentName, subjectName, resultSetId,
    currentScore, claimedScore, reason, description,
    proofFileKey, onBehalfOfStudentId, onBehalfOfStudentName,
  } = body;

  if (!studentId || !subjectName || !reason || !description) {
    throw new ValidationError('studentId, subjectName, reason, and description are required');
  }

  if (description.trim().length < 20) {
    throw new ValidationError('Please provide a more detailed description (at least 20 characters)');
  }

  const complaintId = `CMP-${TENANT_ID?.slice(0,6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0,4).toUpperCase()}`;
  const now = new Date().toISOString();

  // SRMS-5-COMPLAINTS-011: Build complaint record
  const complaint = {
    PK: `COMPLAINT#${complaintId}`,
    SK: 'DETAILS',
    complaintId,
    tenantId: TENANT_ID,
    schoolName: SCHOOL_NAME,
    studentId,
    studentName: studentName || 'Unknown Student',
    subjectName,
    resultSetId: resultSetId || null,
    currentScore: currentScore !== undefined ? parseFloat(currentScore) : null,
    claimedScore: claimedScore !== undefined ? parseFloat(claimedScore) : null,
    reason,
    description: description.trim(),
    proofFileKey: proofFileKey || null,
    hasProof: !!proofFileKey,
    onBehalfOf: onBehalfOfStudentId ? {
      studentId: onBehalfOfStudentId,
      studentName: onBehalfOfStudentName || 'Unknown',
    } : null,
    status: 'open',
    priority: calculatePriority(reason, currentScore, claimedScore),
    teacherResponse: null,
    correctedScore: null,
    resolvedAt: null,
    rejectedAt: null,
    resolvedBy: null,
    reviewedBy: null,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      {
        status: 'open',
        timestamp: now,
        actorId: studentId,
        note: 'Complaint submitted by student',
      }
    ],
  };

  await docClient.send(new PutCommand({
    TableName: COMPLAINTS_TABLE,
    Item: complaint,
  }));

  // SRMS-5-COMPLAINTS-012: Log to audit trail
  await logAudit('COMPLAINT_RAISED', studentId, {
    complaintId,
    subjectName,
    currentScore,
    claimedScore,
    reason,
    hasProof: !!proofFileKey,
  });

  // SRMS-5-COMPLAINTS-013: Notify teacher via email (best effort)
  try {
    await sesClient.send(new SendEmailCommand({
      Source: SES_FROM_EMAIL || 'noreply@srms.platform',
      Destination: { ToAddresses: ['teacher@school.cm'] },
      Message: {
        Subject: { Data: `New Complaint: ${subjectName} — ${SCHOOL_NAME}` },
        Body: {
          Html: {
            Data: `
              <h2>New Student Complaint</h2>
              <p><strong>Complaint ID:</strong> ${complaintId}</p>
              <p><strong>Student:</strong> ${studentName} (${studentId})</p>
              <p><strong>Subject:</strong> ${subjectName}</p>
              <p><strong>Current Score:</strong> ${currentScore}</p>
              <p><strong>Claimed Score:</strong> ${claimedScore}</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Description:</strong> ${description}</p>
              <p><strong>Has Proof:</strong> ${proofFileKey ? 'Yes — file uploaded' : 'No'}</p>
              <p>Log in to SRMS to review this complaint.</p>
              <p>SRMS Platform — ${SCHOOL_NAME}</p>
            `,
          },
        },
      },
    }));
  } catch (e) {
    console.log('[SRMS-COMPLAINTS] Email notification skipped:', e.message);
  }

  return success({
    complaintId,
    status: 'open',
    priority: complaint.priority,
    message: `Complaint ${complaintId} submitted successfully. The teacher will be notified and will review your complaint.`,
    expectedResponseTime: '2-5 business days',
  }, 201, 'Complaint submitted');
};

// ============================================================
// SRMS-5-COMPLAINTS-020: GET MY COMPLAINTS (Student view)
// ============================================================
const getMyComplaints = async (event) => {
  const studentId = event.queryStringParameters?.studentId;
  if (!studentId) throw new ValidationError('studentId is required');

  const result = await docClient.send(new ScanCommand({
    TableName: COMPLAINTS_TABLE,
    FilterExpression: 'tenantId = :tid AND studentId = :sid AND SK = :sk',
    ExpressionAttributeValues: {
      ':tid': TENANT_ID,
      ':sid': studentId,
      ':sk': 'DETAILS',
    },
  }));

  const complaints = (result.Items || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return success({
    complaints,
    summary: {
      total: complaints.length,
      open: complaints.filter(c => c.status === 'open').length,
      reviewing: complaints.filter(c => c.status === 'reviewing').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      rejected: complaints.filter(c => c.status === 'rejected').length,
    },
  });
};

// ============================================================
// SRMS-5-COMPLAINTS-030: GET TEACHER INBOX
// ============================================================
const getTeacherInbox = async (event) => {
  const teacherId = event.queryStringParameters?.teacherId;
  const status = event.queryStringParameters?.status;

  const result = await docClient.send(new ScanCommand({
    TableName: COMPLAINTS_TABLE,
    FilterExpression: 'tenantId = :tid AND SK = :sk',
    ExpressionAttributeValues: { ':tid': TENANT_ID, ':sk': 'DETAILS' },
  }));

  let complaints = result.Items || [];

  if (status && status !== 'all') {
    complaints = complaints.filter(c => c.status === status);
  }

  complaints.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return success({
    complaints,
    summary: {
      total: complaints.length,
      open: complaints.filter(c => c.status === 'open').length,
      reviewing: complaints.filter(c => c.status === 'reviewing').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      rejected: complaints.filter(c => c.status === 'rejected').length,
      highPriority: complaints.filter(c => c.priority === 'high').length,
    },
  });
};

// ============================================================
// SRMS-5-COMPLAINTS-040: GET COMPLAINT DETAIL
// ============================================================
const getComplaintDetail = async (event) => {
  const complaintId = event.queryStringParameters?.complaintId;
  if (!complaintId) throw new ValidationError('complaintId is required');

  const result = await docClient.send(new GetCommand({
    TableName: COMPLAINTS_TABLE,
    Key: { PK: `COMPLAINT#${complaintId}`, SK: 'DETAILS' },
  }));

  if (!result.Item) throw new ValidationError('Complaint not found');

  let proofUrl = null;
  if (result.Item.proofFileKey) {
    try {
      const getCmd = new GetObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: result.Item.proofFileKey,
      });
      proofUrl = await getSignedUrl(s3Client, getCmd, { expiresIn: 3600 });
    } catch (e) {
      console.log('[SRMS-COMPLAINTS] Could not generate proof URL:', e.message);
    }
  }

  return success({ complaint: result.Item, proofUrl });
};

// ============================================================
// SRMS-5-COMPLAINTS-050: RESOLVE COMPLAINT (Teacher corrects score)
// ============================================================
const resolveComplaint = async (body, event) => {
  const { complaintId, teacherId, correctedScore, teacherNote, notifyStudent } = body;

  if (!complaintId || !teacherId) {
    throw new ValidationError('complaintId and teacherId are required');
  }

  const existing = await getComplaint(complaintId);
  if (!existing) throw new ValidationError('Complaint not found');
  if (existing.status === 'resolved') throw new ValidationError('This complaint is already resolved');

  const now = new Date().toISOString();

  // SRMS-5-COMPLAINTS-051: Update complaint status
  const updatedHistory = [
    ...(existing.statusHistory || []),
    {
      status: 'resolved',
      timestamp: now,
      actorId: teacherId,
      note: teacherNote || 'Score correction approved by teacher',
      correctedScore: correctedScore !== undefined ? parseFloat(correctedScore) : null,
    }
  ];

  await docClient.send(new UpdateCommand({
    TableName: COMPLAINTS_TABLE,
    Key: { PK: `COMPLAINT#${complaintId}`, SK: 'DETAILS' },
    UpdateExpression: 'SET #status = :s, resolvedAt = :t, resolvedBy = :tb, correctedScore = :cs, teacherResponse = :tr, statusHistory = :sh, updatedAt = :u',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':s': 'resolved',
      ':t': now,
      ':tb': teacherId,
      ':cs': correctedScore !== undefined ? parseFloat(correctedScore) : null,
      ':tr': teacherNote || 'Complaint reviewed and resolved',
      ':sh': updatedHistory,
      ':u': now,
    },
  }));

  // SRMS-5-COMPLAINTS-052: Update the actual result if corrected score provided
  if (correctedScore !== undefined && existing.resultSetId) {
    try {
      await updateResultScore(existing.resultSetId, existing.studentId, parseFloat(correctedScore), teacherId, complaintId);
    } catch (e) {
      console.error('[SRMS-COMPLAINTS] Could not update result score:', e.message);
    }
  }

  // SRMS-5-COMPLAINTS-053: Log to audit trail
  await logAudit('COMPLAINT_RESOLVED', teacherId, {
    complaintId,
    studentId: existing.studentId,
    subjectName: existing.subjectName,
    originalScore: existing.currentScore,
    correctedScore,
    teacherNote,
  });

  // SRMS-5-COMPLAINTS-054: Notify student
  if (notifyStudent !== false) {
    try {
      await sesClient.send(new SendEmailCommand({
        Source: SES_FROM_EMAIL || 'noreply@srms.platform',
        Destination: { ToAddresses: ['student@school.cm'] },
        Message: {
          Subject: { Data: `Complaint Resolved — ${existing.subjectName}` },
          Body: {
            Html: {
              Data: `
                <h2>Your Complaint Has Been Resolved</h2>
                <p>Dear ${existing.studentName},</p>
                <p>Your complaint regarding <strong>${existing.subjectName}</strong> has been reviewed and resolved.</p>
                ${correctedScore !== undefined ? `<p><strong>Your score has been corrected from ${existing.currentScore} to ${correctedScore}</strong></p>` : ''}
                <p><strong>Teacher's Note:</strong> ${teacherNote || 'Your complaint has been reviewed.'}</p>
                <p>Log in to SRMS to view your updated results.</p>
                <p>SRMS Platform — ${SCHOOL_NAME}</p>
              `,
            },
          },
        },
      }));
    } catch (e) {
      console.log('[SRMS-COMPLAINTS] Student notification skipped:', e.message);
    }
  }

  return success({
    complaintId,
    status: 'resolved',
    correctedScore,
    message: 'Complaint resolved successfully. Student will be notified.',
  });
};

// ============================================================
// SRMS-5-COMPLAINTS-060: REJECT COMPLAINT
// ============================================================
const rejectComplaint = async (body, event) => {
  const { complaintId, teacherId, rejectionReason } = body;

  if (!complaintId || !teacherId || !rejectionReason) {
    throw new ValidationError('complaintId, teacherId, and rejectionReason are required');
  }

  const existing = await getComplaint(complaintId);
  if (!existing) throw new ValidationError('Complaint not found');
  if (existing.status === 'resolved' || existing.status === 'rejected') {
    throw new ValidationError('This complaint is already closed');
  }

  const now = new Date().toISOString();

  const updatedHistory = [
    ...(existing.statusHistory || []),
    {
      status: 'rejected',
      timestamp: now,
      actorId: teacherId,
      note: rejectionReason,
    }
  ];

  await docClient.send(new UpdateCommand({
    TableName: COMPLAINTS_TABLE,
    Key: { PK: `COMPLAINT#${complaintId}`, SK: 'DETAILS' },
    UpdateExpression: 'SET #status = :s, rejectedAt = :t, resolvedBy = :tb, teacherResponse = :tr, statusHistory = :sh, updatedAt = :u',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':s': 'rejected',
      ':t': now,
      ':tb': teacherId,
      ':tr': rejectionReason,
      ':sh': updatedHistory,
      ':u': now,
    },
  }));

  await logAudit('COMPLAINT_REJECTED', teacherId, {
    complaintId,
    studentId: existing.studentId,
    rejectionReason,
  });

  return success({ complaintId, status: 'rejected', message: 'Complaint rejected.' });
};

// ============================================================
// SRMS-5-COMPLAINTS-070: REQUEST MORE EVIDENCE
// ============================================================
const requestMoreEvidence = async (body, event) => {
  const { complaintId, teacherId, message: requestMessage } = body;
  if (!complaintId || !teacherId || !requestMessage) {
    throw new ValidationError('complaintId, teacherId, and message are required');
  }

  const existing = await getComplaint(complaintId);
  if (!existing) throw new ValidationError('Complaint not found');

  const now = new Date().toISOString();
  const updatedHistory = [
    ...(existing.statusHistory || []),
    { status: 'needs-evidence', timestamp: now, actorId: teacherId, note: requestMessage }
  ];

  await docClient.send(new UpdateCommand({
    TableName: COMPLAINTS_TABLE,
    Key: { PK: `COMPLAINT#${complaintId}`, SK: 'DETAILS' },
    UpdateExpression: 'SET #status = :s, teacherResponse = :tr, statusHistory = :sh, reviewedBy = :rb, updatedAt = :u',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':s': 'needs-evidence',
      ':tr': requestMessage,
      ':sh': updatedHistory,
      ':rb': teacherId,
      ':u': now,
    },
  }));

  return success({ complaintId, status: 'needs-evidence', message: 'Student will be asked for more evidence.' });
};

// ============================================================
// SRMS-5-COMPLAINTS-080: GET PROOF UPLOAD URL
// ============================================================
const getProofUploadUrl = async (event) => {
  const fileName = event.queryStringParameters?.fileName || `proof-${Date.now()}`;
  const contentType = event.queryStringParameters?.contentType || 'image/jpeg';
  const fileKey = `${TENANT_ID}/proofs/complaints/${Date.now()}-${fileName}`;

  const putCmd = new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, putCmd, { expiresIn: 300 });

  return success({ uploadUrl, fileKey, expiresIn: 300, message: 'Upload your proof file within 5 minutes.' });
};

// ============================================================
// SRMS-5-COMPLAINTS-090: GET COMPLAINT STATS
// ============================================================
const getComplaintStats = async (event) => {
  const result = await docClient.send(new ScanCommand({
    TableName: COMPLAINTS_TABLE,
    FilterExpression: 'tenantId = :tid AND SK = :sk',
    ExpressionAttributeValues: { ':tid': TENANT_ID, ':sk': 'DETAILS' },
  }));

  const complaints = result.Items || [];

  return success({
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    reviewing: complaints.filter(c => c.status === 'reviewing').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length,
    needsEvidence: complaints.filter(c => c.status === 'needs-evidence').length,
    highPriority: complaints.filter(c => c.priority === 'high').length,
    resolutionRate: complaints.length > 0 
      ? Math.round((complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100)
      : 0,
  });
};

// ============================================================
// SRMS-5-COMPLAINTS-100: HELPERS
// ============================================================
const getComplaint = async (complaintId) => {
  const result = await docClient.send(new GetCommand({
    TableName: COMPLAINTS_TABLE,
    Key: { PK: `COMPLAINT#${complaintId}`, SK: 'DETAILS' },
  }));
  return result.Item || null;
};

const calculatePriority = (reason, currentScore, claimedScore) => {
  const scoreDiff = claimedScore !== undefined && currentScore !== undefined
    ? Math.abs(parseFloat(claimedScore) - parseFloat(currentScore))
    : 0;
  if (scoreDiff >= 20 || reason === 'wrong_score') return 'high';
  if (scoreDiff >= 10 || reason === 'missing_marks') return 'medium';
  return 'low';
};

const updateResultScore = async (resultSetId, studentId, newScore, teacherId, complaintId) => {
  const resultRecord = await docClient.send(new GetCommand({
    TableName: RESULTS_TABLE,
    Key: { PK: `RESULT#${resultSetId}`, SK: 'METADATA' },
  }));

  if (!resultRecord.Item) return;

  const updatedStudents = (resultRecord.Item.students || []).map(student => {
    if (student.studentId !== studentId) return student;
    const gradeInfo = getGrade((newScore / student.maxScore) * 100);
    return {
      ...student,
      score: newScore,
      percentage: Math.round((newScore / student.maxScore) * 100),
      grade: gradeInfo.grade,
      gradeColor: gradeInfo.color,
      gradeLabel: gradeInfo.label,
      correctedAt: new Date().toISOString(),
      correctedBy: teacherId,
      correctionComplaintId: complaintId,
    };
  });

  await docClient.send(new UpdateCommand({
    TableName: RESULTS_TABLE,
    Key: { PK: `RESULT#${resultSetId}`, SK: 'METADATA' },
    UpdateExpression: 'SET students = :s, updatedAt = :u, hasCorrections = :hc',
    ExpressionAttributeValues: {
      ':s': updatedStudents,
      ':u': new Date().toISOString(),
      ':hc': true,
    },
  }));
};

const getGrade = (pct) => {
  if (pct >= 80) return { grade: 'A', color: '#10b981', label: 'Excellent' };
  if (pct >= 70) return { grade: 'B', color: '#3b82f6', label: 'Very Good' };
  if (pct >= 60) return { grade: 'C', color: '#8b5cf6', label: 'Good' };
  if (pct >= 50) return { grade: 'D', color: '#f59e0b', label: 'Pass' };
  return { grade: 'F', color: '#ef4444', label: 'Fail' };
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