// SRMS: Suspend Tenant Lambda
// Owner: MUFUNG ANGELBELL MBUYEH

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.DEPLOY_REGION || 'us-east-1' })
);
const sesClient = new SESClient({ region: process.env.DEPLOY_REGION || 'us-east-1' });

exports.handler = async (event) => {
  console.log('[SRMS-SUSPEND-TENANT] Event:', JSON.stringify(event));

  const { tenantId, reason = 'non_payment', gracePeriodDays = 7 } = event;

  if (!tenantId) {
    return { success: false, error: 'tenantId is required' };
  }

  try {
    const now = new Date().toISOString();
    const graceExpiry = new Date(Date.now() + gracePeriodDays * 86400000).toISOString();

    // Update tenant status to suspended
    await docClient.send(new UpdateCommand({
      TableName: process.env.TENANTS_TABLE || 'srms-master-tenants',
      Key: {
        PK: `TENANT#${tenantId}`,
        SK: 'METADATA',
      },
      UpdateExpression: 'SET #status = :suspended, suspendedAt = :now, suspensionReason = :reason, graceExpiryDate = :grace, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':suspended': 'suspended',
        ':now': now,
        ':reason': reason,
        ':grace': graceExpiry,
      },
    }));

    // Send notification email to school admin
    try {
      await sesClient.send(new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL || 'noreply@srms.platform',
        Destination: { ToAddresses: [event.adminEmail || 'admin@school.cm'] },
        Message: {
          Subject: { Data: 'SRMS Account Suspended — Action Required' },
          Body: {
            Html: {
              Data: `
                <h2>Your SRMS Account Has Been Suspended</h2>
                <p>Tenant ID: ${tenantId}</p>
                <p>Reason: ${reason === 'non_payment' ? 'Payment not received' : reason}</p>
                <p>Grace Period Expires: ${new Date(graceExpiry).toLocaleDateString()}</p>
                <p>To reactivate your account, please complete your payment immediately.</p>
                <p>Your data is safe and will be retained for 90 days.</p>
                <p>SRMS Platform — Built by MUFUNG ANGELBELL MBUYEH</p>
              `,
            },
          },
        },
      }));
    } catch (emailErr) {
      console.log('[SRMS-SUSPEND-TENANT] Email notification skipped:', emailErr.message);
    }

    console.log(`[SRMS-SUSPEND-TENANT] Tenant ${tenantId} suspended successfully`);

    return {
      success: true,
      tenantId,
      status: 'suspended',
      suspendedAt: now,
      graceExpiryDate: graceExpiry,
      message: `Tenant suspended. Grace period expires ${new Date(graceExpiry).toLocaleDateString()}`,
    };
  } catch (err) {
    console.error('[SRMS-SUSPEND-TENANT] Error:', err);
    return { success: false, error: err.message };
  }
};