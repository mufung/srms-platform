// SRMS Phase 7 — AI Lambda Function
// Owner: MUFUNG ANGELBELL MBUYEH
// Uses AWS Bedrock Converse API with 4-model fault tolerance
// Models: Claude Sonnet 4 → Claude Haiku 4.5 → Nova Pro → Nova 2 Lite

const {
  BedrockRuntimeClient,
  ConverseCommand,
} = require('@aws-sdk/client-bedrock-runtime');

const {
  DynamoDBClient,
} = require('@aws-sdk/client-dynamodb');

const {
  DynamoDBDocumentClient,
  PutCommand,
} = require('@aws-sdk/lib-dynamodb');

const { randomUUID } = require('crypto');
const uuidv4 = randomUUID;

// Initialize clients
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.DEPLOY_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.DEPLOY_REGION || 'us-east-1' })
);

const {
  AUDIT_TABLE,
  TENANT_ID,
  SCHOOL_NAME,
} = process.env;

// 4 active non-legacy models — tried in order until one works
const AI_MODELS = [
  'anthropic.claude-haiku-4-5-20251001-v1:0',   // Primary — Claude Haiku 4.5 ACTIVE
  'amazon.nova-pro-v1:0',                         // Backup 1 — Nova Pro ACTIVE
  'amazon.nova-2-lite-v1:0',                      // Backup 2 — Nova 2 Lite ACTIVE
  'anthropic.claude-sonnet-4-5-20250929-v1:0',   // Backup 3 — Claude Sonnet 4.5 ACTIVE
];

// CORS headers for all responses
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
  console.log('[SRMS-AI] Event received:', event.rawPath || event.path || 'unknown');

  // Handle CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS' ||
      event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const path = event.rawPath || event.path || '';
  const method = (event.requestContext?.http?.method || event.httpMethod || 'GET').toUpperCase();
  const body = parseBody(event.body);

  try {
    // Route to correct handler
    if (method === 'POST' && path.includes('/ai/chat')) {
      return await handleChat(body);
    }
    if (method === 'POST' && path.includes('/ai/parent-verify')) {
      return await handleParentVerify(body);
    }
    if (method === 'POST' && path.includes('/ai/detect-anomalies')) {
      return await handleAnomalyDetection(body);
    }
    if (method === 'GET' && path.includes('/ai/status')) {
      return respond(200, {
        available: true,
        models: AI_MODELS,
        school: SCHOOL_NAME || 'SRMS Platform',
        tenant: TENANT_ID,
      });
    }

    return respond(404, { error: 'Route not found', path });
  } catch (err) {
    console.error('[SRMS-AI] Handler error:', err.message);
    return respond(500, { error: 'Internal server error', message: err.message });
  }
};

// ============================================================
// HANDLER 1 — STUDENT CHAT
// ============================================================
async function handleChat(body) {
  const { messages, studentId, studentName } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return respond(400, { error: 'messages array is required' });
  }

  const systemPrompt = buildStudentSystemPrompt(studentName, studentId);
  const reply = await callBedrock(systemPrompt, messages);

  // Log to audit (non-blocking)
  logAudit('AI_STUDENT_CHAT', studentId || 'anonymous', {
    messageCount: messages.length,
    lastMessage: (messages[messages.length - 1]?.content || '').slice(0, 100),
  }).catch(() => {});

  return respond(200, {
    reply,
    sessionId: uuidv4(),
    source: 'bedrock',
  });
}

// ============================================================
// HANDLER 2 — PARENT VERIFICATION
// ============================================================
async function handleParentVerify(body) {
  const { messages, step, answers } = body;

  if (!messages || !Array.isArray(messages)) {
    return respond(400, { error: 'messages array is required' });
  }

  const systemPrompt = buildParentVerifyPrompt(step, answers);
  const reply = await callBedrock(systemPrompt, messages);

  // Check if a Parent ID can be generated
  let generatedParentId = null;
  const answersStr = JSON.stringify(answers || {});
  const studentIdMatch = answersStr.match(/CM-[A-Z0-9]{2,8}-\d{4}-STU-\d{4}/i);

  if (studentIdMatch && Number(step) >= 5) {
    generatedParentId = studentIdMatch[0].toUpperCase().replace('-STU-', '-PAR-');
  }

  return respond(200, {
    reply,
    generatedParentId,
    verificationComplete: Number(step) >= 5 && !!studentIdMatch,
  });
}

// ============================================================
// HANDLER 3 — ANOMALY DETECTION
// ============================================================
async function handleAnomalyDetection(body) {
  const { students, className, subjectName, term, year } = body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    return respond(400, { error: 'students array is required' });
  }

  // Calculate class statistics
  const scores = students.map(s => ({
    name: s.studentName || s.name || 'Unknown',
    score: parseFloat(s.score) || 0,
    pct: s.percentage || Math.round((parseFloat(s.score) / (s.maxScore || 100)) * 100),
  }));

  const avg = Math.round(scores.reduce((sum, s) => sum + s.pct, 0) / scores.length);
  const sorted = [...scores].sort((a, b) => b.pct - a.pct);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const systemPrompt = `You are an academic data analyst for ${SCHOOL_NAME || 'SRMS Platform School'}. 
Your job is to review student result data and identify potential errors before a teacher publishes results.
Be direct, specific, and professional. Always end with a clear RECOMMENDATION section.`;

  const userMessage = `Analyse these ${scores.length} student scores for ${subjectName || 'Unknown Subject'} — ${className || 'Unknown Class'}, ${term || 'Current Term'} ${year || '2026'}.

Class Statistics:
- Average: ${avg}%
- Highest: ${highest?.name} at ${highest?.pct}%
- Lowest: ${lowest?.name} at ${lowest?.pct}%

All Scores:
${scores.map((s, i) => `${i + 1}. ${s.name}: ${s.score} marks (${s.pct}%)`).join('\n')}

Identify:
1. Any scores that look like data entry errors (very far below class average)
2. Any patterns that seem suspicious
3. Overall assessment of class performance
4. RECOMMENDATION: Either SAFE TO PUBLISH or REVIEW THESE STUDENTS FIRST: [list names]`;

  const analysis = await callBedrock(systemPrompt, [{ role: 'user', content: userMessage }]);

  // Auto-flag scores more than 25% below average
  const anomalies = scores
    .filter(s => (avg - s.pct) >= 25 && scores.length > 2)
    .map(s => ({
      studentName: s.name,
      score: s.pct,
      classAverage: avg,
      deviation: avg - s.pct,
      severity: (avg - s.pct) >= 35 ? 'high' : 'medium',
      message: `Score is ${avg - s.pct}% below class average — verify this entry`,
    }));

  return respond(200, {
    analysis,
    anomalies,
    classAverage: avg,
    classSize: students.length,
    flaggedCount: anomalies.length,
    recommendation: anomalies.length > 0
      ? `${anomalies.length} student(s) flagged — review before publishing`
      : 'All scores look normal — safe to publish',
  });
}

// ============================================================
// CORE BEDROCK FUNCTION — 4-model fault tolerance
// ============================================================
async function callBedrock(systemPrompt, messages) {
  // Format messages for Converse API
  const converseMessages = [];

  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'assistant' : 'user';
    const text = typeof msg.content === 'string' ? msg.content : String(msg.content || '');
    if (text.trim()) {
      converseMessages.push({
        role,
        content: [{ text }],
      });
    }
  }

  // Converse API requires starting with user message
  if (converseMessages.length === 0 || converseMessages[0].role !== 'user') {
    converseMessages.unshift({
      role: 'user',
      content: [{ text: 'Hello' }],
    });
  }

  // Try each model in order
  for (let i = 0; i < AI_MODELS.length; i++) {
    const modelId = AI_MODELS[i];

    try {
      console.log(`[SRMS-AI] Trying model ${i + 1}/${AI_MODELS.length}: ${modelId}`);

      const command = new ConverseCommand({
        modelId,
        system: [{ text: systemPrompt }],
        messages: converseMessages,
        inferenceConfig: {
          maxTokens: 1024,
          temperature: 0.1,
          topP: 0.9,
        },
      });

      const response = await bedrockClient.send(command);
      const text = response.output?.message?.content?.[0]?.text;

      if (text && text.trim().length > 5) {
        console.log(`[SRMS-AI] ✅ Model ${modelId} succeeded`);
        return text.trim();
      }

      console.log(`[SRMS-AI] Model ${modelId} returned empty response`);
    } catch (err) {
      console.log(`[SRMS-AI] ❌ Model ${modelId} failed: ${err.message}`);
    }
  }

  // All models failed — return smart demo response
  console.log('[SRMS-AI] All Bedrock models failed — using demo response');
  const lastUserMessage = converseMessages
    .filter(m => m.role === 'user')
    .pop()?.content?.[0]?.text || '';

  return getSmartDemoResponse(lastUserMessage);
}

// ============================================================
// SYSTEM PROMPTS
// ============================================================
function buildStudentSystemPrompt(studentName, studentId) {
  return `You are the SRMS AI Assistant for ${SCHOOL_NAME || 'this school'} — a Student Result Management System built on Amazon Web Services by MUFUNG ANGELBELL MBUYEH, AWS Solutions Architect, Yaoundé, Cameroon.

You are knowledgeable, helpful, friendly, and speak clearly. You give accurate, detailed answers.

COMPLETE SRMS KNOWLEDGE BASE:

GRADING SYSTEM:
- A (80-100%) = Excellent (shown in green)
- B (70-79%) = Very Good (shown in blue)
- C (60-69%) = Good (shown in purple)
- D (50-59%) = Pass (shown in amber/yellow)
- F (0-49%) = Fail (shown in red)
- Class positions are ranked by total percentage across all subjects

USER ROLES:
- Students: View results, confirm scores, raise complaints, download report card
- Teachers: Upload results, review complaints, correct scores, publish results
- Parents: View child's results using Parent ID (linked to Student ID)
- School Admins: Manage IDs, billing, broadcasts, settings
- Super Admin: Platform owner (MUFUNG ANGELBELL MBUYEH) sees all schools

ID FORMAT: CM-SCHOOLCODE-YEAR-ROLE-NUMBER
Examples: CM-GBHS-2026-STU-0042 (student), CM-GBHS-2026-TCH-0007 (teacher)
Parent IDs: Replace STU with PAR — CM-GBHS-2026-STU-0042 becomes CM-GBHS-2026-PAR-0042

RESULTS SYSTEM:
- Teachers upload scores via Excel/CSV or by typing directly
- AI anomaly detection flags suspicious scores before publishing
- Status flow: Draft → Published → Final (locked)
- Students must confirm results (click Confirm button)
- Each result shows: score, grade, progress bar, class position, teacher remarks

COMPLAINT PROCESS:
1. Student goes to Results page
2. Clicks Dispute on the subject with wrong score
3. Selects reason (wrong score, missing marks, calculation error, etc.)
4. Enters current score and claimed correct score
5. Uploads photo of exam paper as proof (REQUIRED)
6. Writes detailed description (minimum 20 characters)
7. Submits — gets unique Complaint ID (e.g. CMP-SRMS-ABC123-XY12)
8. Teacher reviews within 2-5 business days
9. Statuses: Open → Under Review → Resolved/Rejected/Needs Evidence
10. Track at /student/complaints/track

REPORT CARD:
- Available at bottom of Results page
- Shows all subjects, scores, grades, class positions, teacher remarks, signature lines
- Click "Print Report Card / Save as PDF"
- In print dialog: change destination to "Save as PDF" → click Save

NOTIFICATIONS:
- Types: SMS (text), Email, In-App (bell icon)
- Events: results published, complaint updates, school announcements
- Control at: /student/notifications/preferences
- In-App notifications cannot be turned off

BILLING (School Admins only):
- Base plans: Starter $15/mo, Standard $40/mo, Professional $100/mo
- Per ID: Students $0.10, Teachers $0.30, Parents $0.05, Admins $0.50
- All prices shown in USD and XAF (Central African Franc)
- Payment: MTN Mobile Money, Orange Money, Wave, Visa/Mastercard, Stripe

STUDENT CONTEXT: ${studentName ? `Talking to: ${studentName} (ID: ${studentId})` : 'General student inquiry'}

RULES:
- Give specific, accurate answers about SRMS
- For general knowledge questions (science, history, etc.), answer correctly and helpfully
- Never invent specific scores — tell students to check their Results page
- Be encouraging when students face difficulties
- Format responses clearly with line breaks for readability
- Keep responses helpful but concise`;
}

function buildParentVerifyPrompt(step, answers) {
  return `You are the SRMS Parent Verification AI for ${SCHOOL_NAME || 'this school'}.

Your job: Verify parents/guardians step by step and generate their Parent ID.

QUESTIONS TO ASK (one at a time, in order):
Step 1: "What is your child's full name?"
Step 2: "What class or form is your child in? (e.g. Form 5 Science A)"
Step 3: "Please provide your child's Student ID number. It looks like: CM-SCHOOLCODE-YEAR-STU-XXXX. You can find it on any school document."
Step 4: "What is your relationship to this student? (e.g. Mother, Father, Uncle, Legal Guardian)"
Step 5: "What is your own full name?"

After Step 5:
- If a valid Student ID was found (matching CM-XX-XXXX-STU-XXXX format):
  - Generate Parent ID by replacing STU with PAR
  - Say clearly: "Your Parent ID is: [generated ID]"
  - Congratulate them and welcome them to SRMS
- If NO valid Student ID found:
  - Explain politely that you could not find a valid ID
  - Tell them to check their child's school documents
  - The format must be: CM-SCHOOLCODE-YEAR-STU-XXXX

Be warm, patient, and professional.

Current step: ${step || 1}
Answers so far: ${JSON.stringify(answers || {})}`;
}

// ============================================================
// SMART DEMO — Runs when Bedrock is unavailable
// ============================================================
function getSmartDemoResponse(userMessage) {
  const msg = (userMessage || '').toLowerCase();

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('help') || msg.includes('start')) {
    return 'Hello! I am the SRMS AI Assistant. I can help you with:\n\n📊 Understanding your grades and results\n⚖️ How to raise a complaint about a wrong score\n🖨️ Downloading your report card as PDF\n📋 Tracking your complaint status\n🔔 Managing your notifications\n👨‍👩‍👧 Getting a Parent ID for your guardian\n\nWhat would you like to know?';
  }

  if (msg.includes('srms') || msg.includes('system') || msg.includes('platform') || msg.includes('what is')) {
    return 'SRMS (Student Result Management System) is a secure academic platform built on Amazon Web Services.\n\nWhat SRMS does:\n📊 Results — Teachers upload scores. SRMS auto-calculates grades, class positions, and report cards\n⚖️ Complaints — Dispute wrong scores by uploading your exam paper as proof\n📋 Tracking — Monitor complaints in real-time with status updates\n🔔 Notifications — SMS and email alerts when results are published\n🤖 AI Assistant — That is me!\n\nBuilt by MUFUNG ANGELBELL MBUYEH, AWS Solutions Architect, Yaoundé, Cameroon.';
  }

  if (msg.includes('admin') || msg.includes('school admin')) {
    return 'A School Admin in SRMS manages the entire school account:\n\n🏫 Manage all student, teacher, and parent IDs\n📢 Send broadcasts and announcements to all users\n💳 Handle monthly billing and payments (MTN MoMo, Orange Money, Visa)\n⚙️ Customize school settings and branding\n📊 View school-wide analytics\n⚖️ Monitor complaint statistics\n\nAdmin SRMS ID format: CM-SCHOOLCODE-YEAR-ADM-XXXX\nAdmins must use MFA (two-factor authentication) for security.';
  }

  if (msg.includes('teacher')) {
    return 'Teachers in SRMS:\n\n📝 Upload student scores (Excel, CSV, or type directly)\n🤖 Run AI anomaly detection before publishing\n✅ Publish results when ready\n⚖️ Review student complaints in their inbox\n🔧 Correct scores when complaints are valid\n❌ Reject complaints with a written reason\n\nTeacher SRMS ID format: CM-SCHOOLCODE-YEAR-TCH-XXXX\nTeachers use MFA (Google Authenticator) for extra security.';
  }

  if (msg.includes('grade') || msg.includes('score') || msg.includes('percentage') || msg.includes('gpa') || msg.includes('pass') || msg.includes('fail')) {
    return 'SRMS Grading Scale:\n\nA (80-100%) = Excellent 🟢\nB (70-79%) = Very Good 🔵\nC (60-69%) = Good 🟣\nD (50-59%) = Pass 🟡\nF (0-49%) = Fail 🔴\n\nYour overall grade is the average percentage across all subjects. Class positions are ranked highest to lowest. Position 1 = best overall average in your class.';
  }

  if (msg.includes('complaint') || msg.includes('wrong') || msg.includes('dispute') || msg.includes('error') || msg.includes('incorrect') || msg.includes('mistake')) {
    return 'How to raise a complaint about a wrong result:\n\n1. Go to your Results page\n2. Find the subject with the wrong score\n3. Click ⚖️ Dispute on that row\n4. Select the reason (wrong score, missing marks, calculation error, etc.)\n5. Enter the current score and what you believe the correct score is\n6. Upload a photo of your exam paper as proof (this is required)\n7. Write a clear description of the error\n8. Click Submit\n\nYou will receive a Complaint ID. Teacher responds within 2-5 business days.\nTrack your complaint at /student/complaints/track';
  }

  if (msg.includes('report') || msg.includes('print') || msg.includes('download') || msg.includes('pdf')) {
    return 'How to download your Report Card:\n\n1. Go to /student/results\n2. Scroll down past the results table\n3. You will see a professional white report card\n4. It contains: school name, your name and ID, all subjects, scores, grades, class positions, teacher remarks, and signature lines\n5. Click "🖨️ Print Report Card / Save as PDF"\n6. In the print dialog: change Destination to "Save as PDF"\n7. Click Save\n\nThe PDF is an official school document ready to share.';
  }

  if (msg.includes('parent') || msg.includes('parent id') || msg.includes('guardian')) {
    return 'Parent IDs in SRMS are automatically linked to Student IDs:\n\nStudent ID: CM-GBHS-2026-STU-0042\nParent ID:  CM-GBHS-2026-PAR-0042\n(Just replace STU with PAR)\n\nTo get a Parent ID:\n1. Go to /parent/verify\n2. The AI will ask you 5 verification questions\n3. You must provide your child\'s Student ID\n4. After verification, your Parent ID is generated automatically\n\nParents can then log in to view their child\'s results and report card.';
  }

  if (msg.includes('notification') || msg.includes('sms') || msg.includes('email') || msg.includes('alert')) {
    return 'SRMS sends 3 types of notifications:\n\n📱 SMS — Text message to your phone\n✉️ Email — To your registered email\n🔔 In-App — Bell icon (top right of every page)\n\nNotification events:\n- Results published for any subject\n- Complaint resolved, rejected, or needs evidence\n- School announcement\n- Urgent school notice\n\nControl settings at: /student/notifications/preferences\nToggle SMS and Email on/off per event type. In-App cannot be disabled.';
  }

  if (msg.includes('biology')) return 'Biology is a science subject that studies living organisms. In SRMS, your Biology score is entered by your teacher and automatically graded. If your Biology score seems wrong, go to your Results page and click Dispute on the Biology row — upload your exam paper as proof.';

  if (msg.includes('mathematics') || msg.includes('math')) return 'Mathematics results in SRMS are uploaded by your Mathematics teacher. SRMS automatically calculates your grade and class position. If your Mathematics score is wrong, click Dispute on the Mathematics row in your Results page and upload your exam paper.';

  if (msg.includes('physics')) return 'Physics results in SRMS show your score, grade, and class position. If your Physics grade is F and you believe it should be higher, raise a complaint immediately — go to Results page, click Dispute on Physics, upload your exam paper with your answers clearly visible.';

  if (msg.includes('position') || msg.includes('rank') || msg.includes('class position')) return 'Class positions in SRMS are calculated automatically:\n\n1. All students\' percentages are calculated across all subjects\n2. Students are ranked from highest to lowest percentage\n3. Position 1 = highest overall average in your class\n4. Your position for each subject is also shown individually\n\nYour overall class position appears on your report card.';

  if (msg.includes('confirm') || msg.includes('pending') || msg.includes('unconfirmed')) return 'Result Confirmation:\n\n✅ Confirmed = You agree the score is correct\n⏳ Pending = You have not yet reviewed this result\n\nTo confirm: Go to Results page → click ✓ Confirm on any pending subject.\n\nNote: Confirming does NOT stop you from raising a complaint later. You can still click Dispute on any subject even after confirming it.';

  if (msg.includes('mtn') || msg.includes('mobile money') || msg.includes('orange') || msg.includes('payment') || msg.includes('billing')) return 'SRMS accepts these payment methods for school billing:\n\n🇨🇲 Cameroon Mobile Money:\n📱 MTN Mobile Money\n🟠 Orange Money\n🌊 Wave\n🏦 Express Union Mobile\n\n💳 International Cards:\nVisa, Mastercard (via Flutterwave)\nStripe (international payments)\n\nAll amounts shown in both USD and XAF (Central African Franc).\nStudents do not pay — billing is handled by your school admin.';

  return 'I am the SRMS AI Assistant, ready to help you with anything about your results, grades, complaints, report card, notifications, and the SRMS platform.\n\nTry asking me:\n- "How do I download my report card?"\n- "What does grade F mean?"\n- "How do I raise a complaint?"\n- "What is my class position?"\n\nWhat would you like to know?';
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
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
}

async function logAudit(actionType, actorId, details) {
  if (!AUDIT_TABLE) return;
  try {
    await docClient.send(new PutCommand({
      TableName: AUDIT_TABLE,
      Item: {
        PK: `AUDIT#${TENANT_ID || 'PLATFORM'}`,
        SK: `ACTION#${new Date().toISOString()}#${uuidv4()}`,
        actionType,
        actorId,
        tenantId: TENANT_ID,
        details,
        timestamp: new Date().toISOString(),
      },
    }));
  } catch (e) {
    console.error('[SRMS-AI] Audit log error:', e.message);
  }
}