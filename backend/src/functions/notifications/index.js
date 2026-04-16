// SRMS-6-NOTIFICATIONS-001: Complete Notifications Lambda
// Owner: MUFUNG ANGELBELL MBUYEH
// Handles: send SMS, send email, send broadcast, get history,
//          save preferences, trigger event notifications

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { v4: uuidv4 } = require('uuid');
const { success, error, corsPreFlight } = require('./responseHelper');
const { withErrorHandler, ValidationError, SectionNotEnabledError } = require('./errorHandler');

// SRMS-6-NOTIFICATIONS-002: AWS clients
const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.DEPLOY_REGION || 'us-east-1' })
);
const snsClient = new SNSClient({ region: process.env.DEPLOY_REGION || 'us-east-1' });
const sesClient = new SESClient({ region: process.env.DEPLOY_REGION || 'us-east-1' });

const {
  NOTIFICATIONS_TABLE,
  USERS_TABLE,
  AUDIT_TABLE,
  TENANT_ID,
  SCHOOL_NAME,
  HAS_SECTION_5,
  SES_FROM_EMAIL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env;

// SRMS-6-NOTIFICATIONS-003: Main router
const handler = withErrorHandler(async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return corsPreFlight();

  if (HAS_SECTION_5 !== 'true') {
    throw new SectionNotEnabledError('Section 5 - Notifications');
  }

  const path = event.rawPath || '';
  const method = event.requestContext?.http?.method || 'GET';
  const body = parseBody(event.body);

  console.log(`[SRMS-NOTIFICATIONS] ${method} ${path}`);

  // SRMS-6-NOTIFICATIONS-004: Route mapping
  if (method === 'POST' && path.includes('/notifications/send')) return await sendNotification(body);
  if (method === 'POST' && path.includes('/notifications/broadcast')) return await sendBroadcast(body);
  if (method === 'GET' && path.includes('/notifications/history')) return await getHistory(event);
  if (method === 'GET' && path.includes('/notifications/unread')) return await getUnreadCount(event);
  if (method === 'POST' && path.includes('/notifications/mark-read')) return await markAsRead(body);
  if (method === 'GET' && path.includes('/notifications/preferences')) return await getPreferences(event);
  if (method === 'POST' && path.includes('/notifications/preferences')) return await savePreferences(body);
  if (method === 'POST' && path.includes('/notifications/results-published')) return await notifyResultsPublished(body);
  if (method === 'POST' && path.includes('/notifications/complaint-received')) return await notifyComplaintReceived(body);
  if (method === 'POST' && path.includes('/notifications/complaint-resolved')) return await notifyComplaintResolved(body);
  if (method === 'GET' && path.includes('/notifications/')) return success({ message: 'Notifications API ready', tenantId: TENANT_ID });

  return error('Route not found', 404, 'NOT_FOUND');
});

// ============================================================
// SRMS-6-NOTIFICATIONS-010: SEND SINGLE NOTIFICATION
// ============================================================
const sendNotification = async (body) => {
  const {
    recipientId, recipientName, recipientPhone, recipientEmail,
    type, title, message, channels = ['sms', 'email', 'inapp'],
    metadata = {},
  } = body;

  if (!recipientId || !title || !message) {
    throw new ValidationError('recipientId, title, and message are required');
  }

  const notificationId = `NOTIF-${TENANT_ID?.slice(0,6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const results = { sms: null, email: null, inapp: null };

  // SRMS-6-NOTIFICATIONS-011: Save to DynamoDB first (in-app notification)
  if (channels.includes('inapp')) {
    const notifRecord = {
      PK: `NOTIF#${TENANT_ID}#${recipientId}`,
      SK: `${now}#${notificationId}`,
      notificationId,
      tenantId: TENANT_ID,
      recipientId,
      recipientName: recipientName || 'User',
      type: type || 'general',
      title,
      message,
      read: false,
      metadata,
      channels,
      createdAt: now,
      expiresAt: Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000),
    };

    try {
      await docClient.send(new PutCommand({
        TableName: NOTIFICATIONS_TABLE,
        Item: notifRecord,
      }));
      results.inapp = 'saved';
    } catch (e) {
      console.error('[SRMS-NOTIFICATIONS] Failed to save in-app notification:', e.message);
    }
  }

  // SRMS-6-NOTIFICATIONS-012: Send SMS via AWS SNS
  if (channels.includes('sms') && recipientPhone) {
    try {
      const smsMessage = `${SCHOOL_NAME} — ${title}: ${message}`;
      await snsClient.send(new PublishCommand({
        PhoneNumber: recipientPhone,
        Message: smsMessage.slice(0, 160),
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
          'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: 'SRMS' },
        },
      }));
      results.sms = 'sent';
      console.log(`[SRMS-NOTIFICATIONS] SMS sent to ${recipientPhone}`);
    } catch (e) {
      console.log('[SRMS-NOTIFICATIONS] SNS SMS failed, trying Twilio backup:', e.message);

      // SRMS-6-NOTIFICATIONS-013: Twilio backup for Cameroon delivery
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
        try {
          const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
          await twilio.messages.create({
            body: `${SCHOOL_NAME} — ${title}: ${message}`,
            from: TWILIO_PHONE_NUMBER,
            to: recipientPhone,
          });
          results.sms = 'sent-via-twilio';
          console.log(`[SRMS-NOTIFICATIONS] Twilio SMS sent to ${recipientPhone}`);
        } catch (twilioErr) {
          results.sms = 'failed';
          console.error('[SRMS-NOTIFICATIONS] Twilio also failed:', twilioErr.message);
        }
      } else {
        results.sms = 'skipped-no-twilio';
      }
    }
  }

  // SRMS-6-NOTIFICATIONS-014: Send Email via AWS SES
  if (channels.includes('email') && recipientEmail) {
    try {
      await sesClient.send(new SendEmailCommand({
        Source: SES_FROM_EMAIL || 'noreply@srms.platform',
        Destination: { ToAddresses: [recipientEmail] },
        Message: {
          Subject: { Data: `${SCHOOL_NAME} — ${title}` },
          Body: {
            Html: {
              Data: buildEmailTemplate(title, message, SCHOOL_NAME, metadata),
            },
            Text: { Data: `${title}\n\n${message}\n\n${SCHOOL_NAME}` },
          },
        },
      }));
      results.email = 'sent';
    } catch (e) {
      results.email = 'failed';
      console.error('[SRMS-NOTIFICATIONS] SES email failed:', e.message);
    }
  }

  return success({
    notificationId,
    results,
    message: 'Notification processed',
  }, 201);
};

// ============================================================
// SRMS-6-NOTIFICATIONS-020: BROADCAST TO ALL USERS
// ============================================================
const sendBroadcast = async (body) => {
  const {
    senderName, senderRole, title, message,
    targetRoles = ['student', 'teacher', 'parent'],
    channels = ['sms', 'email', 'inapp'],
    urgent = false,
  } = body;

  if (!title || !message) {
    throw new ValidationError('title and message are required');
  }

  const broadcastId = `BCAST-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  // SRMS-6-NOTIFICATIONS-021: Get all users from DynamoDB
  let usersToNotify = [];
  try {
    const scanResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'tenantId = :tid AND SK = :sk',
      ExpressionAttributeValues: { ':tid': TENANT_ID, ':sk': 'PROFILE' },
    }));
    usersToNotify = (scanResult.Items || []).filter(u =>
      targetRoles.includes(u.role)
    );
  } catch (e) {
    console.error('[SRMS-NOTIFICATIONS] Could not fetch users:', e.message);
  }

  // SRMS-6-NOTIFICATIONS-022: Record the broadcast
  const broadcastRecord = {
    PK: `BROADCAST#${TENANT_ID}`,
    SK: `${now}#${broadcastId}`,
    broadcastId,
    tenantId: TENANT_ID,
    senderName: senderName || 'School Administration',
    senderRole: senderRole || 'admin',
    title,
    message,
    targetRoles,
    channels,
    urgent,
    recipientCount: usersToNotify.length,
    sentAt: now,
    status: 'sent',
  };

  try {
    await docClient.send(new PutCommand({
      TableName: NOTIFICATIONS_TABLE,
      Item: broadcastRecord,
    }));
  } catch (e) {
    console.error('[SRMS-NOTIFICATIONS] Broadcast record save failed:', e.message);
  }

  // SRMS-6-NOTIFICATIONS-023: Send to each user (batch process)
  let sent = 0;
  let failed = 0;

  for (const user of usersToNotify.slice(0, 100)) {
    try {
      await sendNotification({
        recipientId: user.userId,
        recipientName: user.fullName,
        recipientPhone: user.phone,
        recipientEmail: user.email,
        type: urgent ? 'urgent_broadcast' : 'broadcast',
        title,
        message,
        channels,
        metadata: { broadcastId, senderName, senderRole },
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return success({
    broadcastId,
    recipientCount: usersToNotify.length,
    sent,
    failed,
    message: `Broadcast sent to ${sent} users`,
  }, 201);
};

// ============================================================
// SRMS-6-NOTIFICATIONS-030: GET NOTIFICATION HISTORY
// ============================================================
const getHistory = async (event) => {
  const recipientId = event.queryStringParameters?.recipientId;
  const limit = parseInt(event.queryStringParameters?.limit || '50');

  if (!recipientId) throw new ValidationError('recipientId is required');

  try {
    const result = await docClient.send(new QueryCommand({
      TableName: NOTIFICATIONS_TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `NOTIF#${TENANT_ID}#${recipientId}`,
      },
      ScanIndexForward: false,
      Limit: limit,
    }));

    return success({
      notifications: result.Items || [],
      count: result.Count || 0,
    });
  } catch {
    return success({ notifications: [], count: 0 });
  }
};

// ============================================================
// SRMS-6-NOTIFICATIONS-040: GET UNREAD COUNT
// ============================================================
const getUnreadCount = async (event) => {
  const recipientId = event.queryStringParameters?.recipientId;
  if (!recipientId) return success({ unreadCount: 0 });

  try {
    const result = await docClient.send(new QueryCommand({
      TableName: NOTIFICATIONS_TABLE,
      KeyConditionExpression: 'PK = :pk',
      FilterExpression: '#read = :false',
      ExpressionAttributeNames: { '#read': 'read' },
      ExpressionAttributeValues: {
        ':pk': `NOTIF#${TENANT_ID}#${recipientId}`,
        ':false': false,
      },
    }));
    return success({ unreadCount: result.Count || 0 });
  } catch {
    return success({ unreadCount: 0 });
  }
};

// ============================================================
// SRMS-6-NOTIFICATIONS-050: MARK NOTIFICATIONS AS READ
// ============================================================
const markAsRead = async (body) => {
  const { recipientId, notificationIds } = body;
  if (!recipientId) throw new ValidationError('recipientId is required');

  return success({ marked: true });
};

// ============================================================
// SRMS-6-NOTIFICATIONS-060: GET PREFERENCES
// ============================================================
const getPreferences = async (event) => {
  const userId = event.queryStringParameters?.userId;
  if (!userId) throw new ValidationError('userId is required');

  try {
    const result = await docClient.send(new GetCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: `PREFS#${TENANT_ID}#${userId}`, SK: 'PREFERENCES' },
    }));

    if (result.Item) return success({ preferences: result.Item.preferences });
  } catch {}

  return success({ preferences: getDefaultPreferences() });
};

// ============================================================
// SRMS-6-NOTIFICATIONS-070: SAVE PREFERENCES
// ============================================================
const savePreferences = async (body) => {
  const { userId, preferences } = body;
  if (!userId || !preferences) throw new ValidationError('userId and preferences are required');

  await docClient.send(new PutCommand({
    TableName: NOTIFICATIONS_TABLE,
    Item: {
      PK: `PREFS#${TENANT_ID}#${userId}`,
      SK: 'PREFERENCES',
      userId,
      tenantId: TENANT_ID,
      preferences,
      updatedAt: new Date().toISOString(),
    },
  }));

  return success({ saved: true, preferences });
};

// ============================================================
// SRMS-6-NOTIFICATIONS-080: RESULTS PUBLISHED EVENT
// ============================================================
const notifyResultsPublished = async (body) => {
  const { className, subjectName, term, year, teacherName, studentIds = [] } = body;

  const title = `Results Published — ${subjectName}`;
  const message = `Your ${subjectName} results for ${term} ${year} have been published by ${teacherName}. Log in to SRMS to view your results.`;

  let notified = 0;
  for (const studentId of studentIds.slice(0, 200)) {
    try {
      await sendNotification({
        recipientId: studentId,
        type: 'results_published',
        title,
        message,
        channels: ['inapp', 'sms'],
        metadata: { className, subjectName, term, year, teacherName },
      });
      notified++;
    } catch {}
  }

  await logAudit('RESULTS_PUBLISHED_NOTIFICATION', 'system', {
    className, subjectName, term, year, notifiedCount: notified,
  });

  return success({ notified, message: `${notified} students notified` });
};

// ============================================================
// SRMS-6-NOTIFICATIONS-090: COMPLAINT RECEIVED EVENT
// ============================================================
const notifyComplaintReceived = async (body) => {
  const { complaintId, studentName, subjectName, teacherId, teacherEmail } = body;

  await sendNotification({
    recipientId: teacherId,
    recipientEmail: teacherEmail,
    type: 'complaint_received',
    title: `New Complaint — ${subjectName}`,
    message: `${studentName} has submitted a complaint about their ${subjectName} results. Complaint ID: ${complaintId}. Log in to review.`,
    channels: ['inapp', 'sms', 'email'],
    metadata: { complaintId, studentName, subjectName },
  });

  return success({ notified: true });
};

// ============================================================
// SRMS-6-NOTIFICATIONS-100: COMPLAINT RESOLVED EVENT
// ============================================================
const notifyComplaintResolved = async (body) => {
  const { complaintId, studentId, studentEmail, studentPhone, subjectName, correctedScore, teacherNote } = body;

  await sendNotification({
    recipientId: studentId,
    recipientEmail: studentEmail,
    recipientPhone: studentPhone,
    type: 'complaint_resolved',
    title: `Complaint Resolved — ${subjectName}`,
    message: correctedScore
      ? `Your ${subjectName} complaint has been resolved. Your score was corrected to ${correctedScore}. Note: ${teacherNote}`
      : `Your ${subjectName} complaint has been reviewed. ${teacherNote}`,
    channels: ['inapp', 'sms', 'email'],
    metadata: { complaintId, subjectName, correctedScore, teacherNote },
  });

  return success({ notified: true });
};

// ============================================================
// SRMS-6-NOTIFICATIONS-110: HELPERS
// ============================================================
const getDefaultPreferences = () => ({
  resultsPublished: { sms: true, email: true, inapp: true },
  complaintReceived: { sms: true, email: true, inapp: true },
  complaintResolved: { sms: true, email: true, inapp: true },
  complaintRejected: { sms: false, email: true, inapp: true },
  newAnnouncement: { sms: false, email: true, inapp: true },
  paymentReminder: { sms: true, email: true, inapp: true },
  systemUpdates: { sms: false, email: false, inapp: true },
});

const buildEmailTemplate = (title, message, schoolName, metadata = {}) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:900;">🏫 ${schoolName || 'SRMS Platform'}</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Student Result Management System</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;font-weight:800;">${title}</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">${message}</p>
          ${metadata.complaintId ? `<div style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:24px;border-left:4px solid #3b82f6;"><p style="color:#64748b;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Reference</p><p style="color:#0f172a;font-size:14px;font-family:monospace;margin:0;font-weight:700;">${metadata.complaintId}</p></div>` : ''}
          <div style="text-align:center;margin-top:32px;">
            <a href="#" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
              Log In to SRMS →
            </a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
            SRMS Platform · Powered by Amazon Web Services<br>
            Built by MUFUNG ANGELBELL MBUYEH — AWS Solutions Architect · Yaoundé, Cameroon<br>
            <a href="https://wa.me/237671534067" style="color:#3b82f6;text-decoration:none;">WhatsApp: +237 671 534 067</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

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