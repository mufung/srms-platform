// ============================================================
// SRMS-1-MASTER-001: SRMS Platform Master Stack
// ============================================================
// Owner: MUFUNG ANGELBELL MBUYEH
// Email: mufungangelbellmbuyeh@gmail.com
// Location: Yaoundé, Cameroon Northwest
// Title: AWS Solutions Architect
// WhatsApp: +237671534067
// ============================================================
// PURPOSE: Creates ALL platform-wide AWS resources.
// Deployed ONCE. Manages everything.
// This stack is the heart of the entire SRMS platform.
// ============================================================

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

// ============================================================
// SRMS-1-MASTER-010: MasterStack Class Definition
// ============================================================
export class MasterStack extends cdk.Stack {

  // SRMS-1-MASTER-011: Public properties so other code can reference these resources
  public readonly masterTenantsTable: dynamodb.Table;
  public readonly masterBillingTable: dynamodb.Table;
  public readonly masterAuditTable: dynamodb.Table;
  public readonly masterSessionsTable: dynamodb.Table;
  public readonly masterAssetsBucket: s3.Bucket;
  public readonly superAdminUserPool: cognito.UserPool;
  public readonly superAdminClientId: string;
  public readonly adminHttpApi: apigateway.HttpApi;
  public readonly platformSNSTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // SRMS-1-MASTER-012: Read owner configuration
    const masterConfig = this.node.tryGetContext('masterConfig') || {};

    // ============================================================
    // SRMS-1-MASTER-020: DYNAMODB TABLES — Platform-Wide Data
    // ============================================================

    // SRMS-1-MASTER-021: TENANTS TABLE
    // Stores every school registered on the platform
    // PK: TENANT#<tenantId>  SK: METADATA or SECTION#<sectionId>
    this.masterTenantsTable = new dynamodb.Table(this, 'MasterTenantsTable', {
      tableName: 'srms-master-tenants',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // SRMS-1-MASTER-022: Query by tenant status (active, suspended, trial, cancelled)
    this.masterTenantsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-MASTER-023: Query by plan type (starter, standard, professional, enterprise)
    this.masterTenantsTable.addGlobalSecondaryIndex({
      indexName: 'PlanIndex',
      partitionKey: { name: 'plan', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'monthlyRevenueCents', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-MASTER-024: Query by country (for regional analytics)
    this.masterTenantsTable.addGlobalSecondaryIndex({
      indexName: 'CountryIndex',
      partitionKey: { name: 'country', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-MASTER-025: Query suspended tenants by suspension date
    // Used to find schools that need to be deleted after 90 days
    this.masterTenantsTable.addGlobalSecondaryIndex({
      indexName: 'SuspensionDateIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'suspendedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-MASTER-030: BILLING TABLE
    // Tracks all payments, invoices, subscription changes
    // PK: BILLING#<tenantId>  SK: INVOICE#<year>-<month> or PAYMENT#<timestamp>
    this.masterBillingTable = new dynamodb.Table(this, 'MasterBillingTable', {
      tableName: 'srms-master-billing',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // SRMS-1-MASTER-031: Query all bills for a specific month
    this.masterBillingTable.addGlobalSecondaryIndex({
      indexName: 'BillingMonthIndex',
      partitionKey: { name: 'billingMonth', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'amountCents', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-MASTER-032: Query by payment status (paid, failed, pending, refunded)
    this.masterBillingTable.addGlobalSecondaryIndex({
      indexName: 'PaymentStatusIndex',
      partitionKey: { name: 'paymentStatus', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-MASTER-040: AUDIT TABLE
    // The most important table - records EVERYTHING that happens
    // WHO did WHAT, WHERE, WHEN, WHY, HOW - full permanent record
    // PK: AUDIT#<tenantId>  SK: ACTION#<timestamp>#<actionId>
    this.masterAuditTable = new dynamodb.Table(this, 'MasterAuditTable', {
      tableName: 'srms-master-audit',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // SRMS-1-MASTER-041: No TTL - audit logs are permanent (legal requirement)
    });

    // SRMS-1-MASTER-042: Query audit by action type (login, upload, complaint, payment, etc.)
    this.masterAuditTable.addGlobalSecondaryIndex({
      indexName: 'ActionTypeIndex',
      partitionKey: { name: 'actionType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-MASTER-043: Query audit by user who performed the action
    this.masterAuditTable.addGlobalSecondaryIndex({
      indexName: 'ActorIndex',
      partitionKey: { name: 'actorId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-MASTER-050: SESSIONS TABLE
    // Tracks your active super admin sessions
    // Expires automatically after 2 hours (7200 seconds) of inactivity
    this.masterSessionsTable = new dynamodb.Table(this, 'MasterSessionsTable', {
      tableName: 'srms-master-sessions',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // SRMS-1-MASTER-051: DynamoDB TTL auto-deletes expired sessions
      // When expiresAt timestamp is in the past, DynamoDB removes the item
      timeToLiveAttribute: 'expiresAt',
    });

    // ============================================================
    // SRMS-1-MASTER-060: S3 BUCKET — Platform-Wide Storage
    // ============================================================

    // SRMS-1-MASTER-061: Master Assets Bucket
    // Stores: platform templates, shared images, CDK artifacts
    this.masterAssetsBucket = new s3.Bucket(this, 'MasterAssetsBucket', {
      // SRMS-1-MASTER-062: Unique bucket name using your AWS account ID
      bucketName: `srms-master-assets-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'ArchiveOldVersions',
          // SRMS-1-MASTER-063: Move old file versions to cheaper storage after 30 days
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // ============================================================
    // SRMS-1-MASTER-070: COGNITO — Super Admin Authentication
    // ============================================================

    // SRMS-1-MASTER-071: Super Admin User Pool
    // ONLY YOU (Mufung Angelbell Mbuyeh) are in this pool
    // selfSignUpEnabled: false means nobody can register themselves
    this.superAdminUserPool = new cognito.UserPool(this, 'SuperAdminUserPool', {
      userPoolName: 'srms-super-admin-pool',
      selfSignUpEnabled: false,
      signInAliases: { email: true, username: false, phone: false },
      autoVerify: { email: true },
      // SRMS-1-MASTER-072: Very strong password for the platform owner
      passwordPolicy: {
        minLength: 16,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(1),
      },
      // SRMS-1-MASTER-073: MFA is MANDATORY - cannot be turned off
      // Uses Google Authenticator (TOTP) - not SMS
      // This means even if someone has your password, they cannot login
      // without your phone which has the authenticator app
      mfa: cognito.Mfa.REQUIRED,
      mfaSecondFactor: {
        sms: false,
        otp: true, // TOTP = Google Authenticator
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      // SRMS-1-MASTER-074: Advanced security detects suspicious logins
      // (unusual location, failed attempts, etc.)
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // SRMS-1-MASTER-075: Custom attributes stored in your Cognito profile
      customAttributes: {
        fullName: new cognito.StringAttribute({ mutable: true }),
        role: new cognito.StringAttribute({ mutable: false }),
        title: new cognito.StringAttribute({ mutable: true }),
        location: new cognito.StringAttribute({ mutable: true }),
        whatsapp: new cognito.StringAttribute({ mutable: true }),
        platformOwner: new cognito.StringAttribute({ mutable: false }),
      },
      userInvitation: {
  emailSubject: 'SRMS Platform - Super Admin Account Created',
  emailBody: 'Your SRMS Super Admin account has been created. Username: {username}. Temporary password: {####}. You must set up MFA on first login.',
  smsMessage: 'SRMS Platform: Hello {username}, your temporary password is {####}',
},
    });

    // SRMS-1-MASTER-076: Super Admin App Client
    // accessTokenValidity: 2 hours (implements the 2-hour inactivity timeout)
    const superAdminClient = new cognito.UserPoolClient(this, 'SuperAdminClient', {
      userPool: this.superAdminUserPool,
      userPoolClientName: 'srms-super-admin-web-client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      // SRMS-1-MASTER-077: 2-hour session timeout
      // After 2 hours of inactivity, you must login again
      accessTokenValidity: cdk.Duration.hours(2),
      idTokenValidity: cdk.Duration.hours(2),
      refreshTokenValidity: cdk.Duration.hours(4),
      enableTokenRevocation: true,
      preventUserExistenceErrors: true,
    });

    // SRMS-1-MASTER-078: Store client ID for outputs
    this.superAdminClientId = superAdminClient.userPoolClientId;

    // ============================================================
    // SRMS-1-MASTER-080: IAM ROLE — Lambda Execution Permissions
    // ============================================================

    // SRMS-1-MASTER-081: Role that all master Lambda functions use
    const masterLambdaRole = new iam.Role(this, 'MasterLambdaRole', {
      roleName: 'srms-master-lambda-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM Role for SRMS master platform Lambda functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // SRMS-1-MASTER-082: Grant DynamoDB read/write to all master tables
    this.masterTenantsTable.grantReadWriteData(masterLambdaRole);
    this.masterBillingTable.grantReadWriteData(masterLambdaRole);
    this.masterAuditTable.grantReadWriteData(masterLambdaRole);
    this.masterSessionsTable.grantReadWriteData(masterLambdaRole);

    // SRMS-1-MASTER-083: Grant S3 access
    this.masterAssetsBucket.grantReadWrite(masterLambdaRole);

    // SRMS-1-MASTER-084: Grant Cognito access (for managing super admin account)
    masterLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminDisableUser',
        'cognito-idp:AdminEnableUser',
        'cognito-idp:ListUsers',
      ],
      resources: [this.superAdminUserPool.userPoolArn],
    }));

    // SRMS-1-MASTER-085: Grant CDK deployment permissions
    // This allows the registerSchool Lambda to automatically deploy tenant stacks
    masterLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudformation:CreateStack',
        'cloudformation:UpdateStack',
        'cloudformation:DeleteStack',
        'cloudformation:DescribeStacks',
        'cloudformation:ListStacks',
        'cloudformation:GetTemplate',
        'iam:CreateRole',
        'iam:DeleteRole',
        'iam:AttachRolePolicy',
        'iam:DetachRolePolicy',
        'iam:PutRolePolicy',
        'iam:DeleteRolePolicy',
        'iam:PassRole',
        'lambda:CreateFunction',
        'lambda:UpdateFunctionCode',
        'lambda:UpdateFunctionConfiguration',
        'lambda:DeleteFunction',
        'lambda:AddPermission',
        'lambda:RemovePermission',
        'dynamodb:CreateTable',
        'dynamodb:DeleteTable',
        'dynamodb:UpdateTable',
        'dynamodb:DescribeTable',
        's3:CreateBucket',
        's3:DeleteBucket',
        's3:PutBucketPolicy',
        's3:GetBucketPolicy',
        'cognito-idp:CreateUserPool',
        'cognito-idp:DeleteUserPool',
        'cognito-idp:CreateUserPoolClient',
        'apigateway:POST',
        'apigateway:PUT',
        'apigateway:DELETE',
        'apigateway:GET',
        'events:PutRule',
        'events:DeleteRule',
        'events:PutTargets',
        'sns:CreateTopic',
        'sns:DeleteTopic',
        'ses:SendEmail',
        'ses:SendRawEmail',
        'bedrock:InvokeModel',
        'sts:AssumeRole',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }));

    // SRMS-1-MASTER-086: Grant Stripe webhook Lambda SNS permissions
    masterLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sns:Publish'],
      resources: ['*'],
    }));

    // SRMS-1-MASTER-087: Common environment variables for ALL master Lambda functions
    const masterLambdaEnv: Record<string, string> = {
      MASTER_TENANTS_TABLE: this.masterTenantsTable.tableName,
      MASTER_BILLING_TABLE: this.masterBillingTable.tableName,
      MASTER_AUDIT_TABLE: this.masterAuditTable.tableName,
      MASTER_SESSIONS_TABLE: this.masterSessionsTable.tableName,
      MASTER_ASSETS_BUCKET: this.masterAssetsBucket.bucketName,
      SUPER_ADMIN_USER_POOL_ID: this.superAdminUserPool.userPoolId,
      SUPER_ADMIN_CLIENT_ID: superAdminClient.userPoolClientId,
      AWS_ACCOUNT_ID: this.account,
      DEPLOY_REGION: this.region,
      DATA_RETENTION_DAYS: '90',
      PAYMENT_GRACE_PERIOD_DAYS: '7',
      ADMIN_SESSION_TIMEOUT: '7200',
      PLATFORM_VERSION: '1.0.0',
      OWNER_NAME: 'MUFUNG ANGELBELL MBUYEH',
      OWNER_EMAIL: 'mufungangelbellmbuyeh@gmail.com',
      OWNER_LOCATION: 'Yaounde-Cameroon',
      OWNER_LATITUDE: '3.8480',
      OWNER_LONGITUDE: '11.5021',
      NODE_OPTIONS: '--enable-source-maps',
    };

    // ============================================================
    // SRMS-1-MASTER-090: LAMBDA FUNCTIONS — Platform Logic
    // ============================================================

    // SRMS-1-MASTER-091: Tenant Registration Lambda
    // Triggered when a school pays. Creates their complete AWS stack automatically.
    const registerTenantLambda = new lambda.Function(this, 'RegisterTenantLambda', {
      functionName: 'srms-register-tenant',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../backend/src/functions/tenants'),
      handler: 'registerSchool.handler',
      role: masterLambdaRole,
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: masterLambdaEnv,
      description: 'SRMS: Registers a new school tenant and triggers CDK deployment automatically',
      logRetention: logs.RetentionDays.ONE_YEAR,
      retryAttempts: 0,
    });

    // SRMS-1-MASTER-092: Tenant Deletion Lambda
    // Triggered after 90 days of non-payment. Deletes everything.
    const deleteTenantLambda = new lambda.Function(this, 'DeleteTenantLambda', {
      functionName: 'srms-delete-tenant',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../backend/src/functions/tenants'),
      handler: 'deleteTenant.handler',
      role: masterLambdaRole,
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: masterLambdaEnv,
      description: 'SRMS: Deletes a tenant stack after 90 days of non-payment',
      logRetention: logs.RetentionDays.ONE_YEAR,
      retryAttempts: 0,
    });

    // SRMS-1-MASTER-093: Suspend Tenant Lambda
    // Triggered when payment fails for 7+ days. Blocks all logins.
    const suspendTenantLambda = new lambda.Function(this, 'SuspendTenantLambda', {
      functionName: 'srms-suspend-tenant',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../backend/src/functions/billing'),
      handler: 'suspendTenant.handler',
      role: masterLambdaRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: masterLambdaEnv,
      description: 'SRMS: Suspends a tenant on payment failure after 7-day grace period',
      logRetention: logs.RetentionDays.ONE_YEAR,
    });

    // SRMS-1-MASTER-094: Reactivate Tenant Lambda
    // Triggered immediately when a suspended school makes payment.
    const reactivateTenantLambda = new lambda.Function(this, 'ReactivateTenantLambda', {
      functionName: 'srms-reactivate-tenant',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../backend/src/functions/billing'),
      handler: 'reactivateTenant.handler',
      role: masterLambdaRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: masterLambdaEnv,
      description: 'SRMS: Reactivates a suspended tenant within 30 seconds of payment',
      logRetention: logs.RetentionDays.ONE_YEAR,
    });

    // SRMS-1-MASTER-095: Stripe Webhook Lambda
    // Listens to every Stripe payment event (success, failure, refund, etc.)
    const stripeWebhookLambda = new lambda.Function(this, 'StripeWebhookLambda', {
      functionName: 'srms-stripe-webhook',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../backend/src/functions/billing'),
      handler: 'stripeWebhook.handler',
      role: masterLambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: masterLambdaEnv,
      description: 'SRMS: Processes all Stripe payment events and triggers appropriate actions',
      logRetention: logs.RetentionDays.ONE_YEAR,
    });

    // SRMS-1-MASTER-096: Monthly Billing Lambda
    // Runs automatically on the 1st of every month
    // Counts all active IDs per school and reports to Stripe for billing
    const monthlyBillingLambda = new lambda.Function(this, 'MonthlyBillingLambda', {
      functionName: 'srms-monthly-billing',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../backend/src/functions/billing'),
      handler: 'countActiveIDs.handler',
      role: masterLambdaRole,
      timeout: cdk.Duration.minutes(10),
      memorySize: 512,
      environment: masterLambdaEnv,
      description: 'SRMS: Monthly ID count and billing report to Stripe - runs 1st of each month',
      logRetention: logs.RetentionDays.ONE_YEAR,
    });

    // SRMS-1-MASTER-097: Data Cleanup Lambda
    // Daily check: finds schools suspended for 90+ days and deletes their data
    const dataCleanupLambda = new lambda.Function(this, 'DataCleanupLambda', {
      functionName: 'srms-data-cleanup',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../backend/src/functions/billing'),
      handler: 'dataCleanup.handler',
      role: masterLambdaRole,
      timeout: cdk.Duration.minutes(10),
      memorySize: 256,
      environment: masterLambdaEnv,
      description: 'SRMS: Daily cleanup - deletes data for schools suspended 90+ days',
      logRetention: logs.RetentionDays.ONE_YEAR,
    });

    // SRMS-1-MASTER-098: Admin Dashboard Lambda
    // Powers your super admin dashboard with real-time platform data
    const adminDashboardLambda = new lambda.Function(this, 'AdminDashboardLambda', {
      functionName: 'srms-admin-dashboard',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../backend/src/functions/admin'),
      handler: 'getAllSchools.handler',
      role: masterLambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: masterLambdaEnv,
      description: 'SRMS: Powers the super admin dashboard with live platform data',
      logRetention: logs.RetentionDays.ONE_YEAR,
    });

    // SRMS-1-MASTER-099: Audit Logger Lambda
    // Records every action: who, what, where, when, why, how
    const auditLoggerLambda = new lambda.Function(this, 'AuditLoggerLambda', {
      functionName: 'srms-audit-logger',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../backend/src/functions/admin'),
      handler: 'auditLogger.handler',
      role: masterLambdaRole,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: masterLambdaEnv,
      description: 'SRMS: Logs all platform actions for complete audit trail',
      // SRMS-1-MASTER-100: Audit logs kept for 10 years
      logRetention: logs.RetentionDays.TEN_YEARS,
    });

    // ============================================================
    // SRMS-1-MASTER-110: SNS TOPIC — Platform Alerts
    // ============================================================

    // SRMS-1-MASTER-111: Platform-wide alert topic
    // Used for critical system alerts to you (the platform owner)
    this.platformSNSTopic = new sns.Topic(this, 'PlatformSNSTopic', {
      topicName: 'srms-platform-critical-alerts',
      displayName: 'SRMS Platform Critical Alerts - MUFUNG ANGELBELL MBUYEH',
    });

    // ============================================================
    // SRMS-1-MASTER-120: API GATEWAY — Admin API
    // ============================================================

    // SRMS-1-MASTER-121: Admin HTTP API
    // This powers your super admin dashboard
    // The URL is kept secret - only you know the full path
    this.adminHttpApi = new apigateway.HttpApi(this, 'AdminHttpApi', {
      apiName: 'srms-admin-api',
      description: 'SRMS Super Admin API - Owner: MUFUNG ANGELBELL MBUYEH - RESTRICTED ACCESS',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-SRMS-Admin-Token',
          'X-SRMS-Session-ID',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.days(1),
      },
    });

    // SRMS-1-MASTER-122: Admin - Get all schools
    this.adminHttpApi.addRoutes({
      path: '/admin/schools',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'AdminGetSchoolsIntegration', adminDashboardLambda
      ),
    });

    // SRMS-1-MASTER-123: Admin - Register new tenant (also called by Stripe webhook)
    this.adminHttpApi.addRoutes({
      path: '/admin/tenants/register',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'AdminRegisterTenantIntegration', registerTenantLambda
      ),
    });

    // SRMS-1-MASTER-124: Admin - Suspend a tenant manually
    this.adminHttpApi.addRoutes({
      path: '/admin/tenants/{tenantId}/suspend',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'AdminSuspendTenantIntegration', suspendTenantLambda
      ),
    });

    // SRMS-1-MASTER-125: Admin - Reactivate a tenant manually
    this.adminHttpApi.addRoutes({
      path: '/admin/tenants/{tenantId}/reactivate',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'AdminReactivateTenantIntegration', reactivateTenantLambda
      ),
    });

    // SRMS-1-MASTER-126: Admin - Delete a tenant manually
    this.adminHttpApi.addRoutes({
      path: '/admin/tenants/{tenantId}/delete',
      methods: [apigateway.HttpMethod.DELETE],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'AdminDeleteTenantIntegration', deleteTenantLambda
      ),
    });

    // SRMS-1-MASTER-127: Admin - Audit logs viewer
    this.adminHttpApi.addRoutes({
      path: '/admin/audit',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'AdminAuditIntegration', auditLoggerLambda
      ),
    });

    // SRMS-1-MASTER-128: Stripe webhook - PUBLIC endpoint (Stripe needs to call this)
    // This is the ONLY public endpoint in the admin API
    this.adminHttpApi.addRoutes({
      path: '/webhooks/stripe',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'StripeWebhookIntegration', stripeWebhookLambda
      ),
    });

    // ============================================================
    // SRMS-1-MASTER-130: EVENTBRIDGE — Scheduled Automated Jobs
    // ============================================================

    // SRMS-1-MASTER-131: Monthly billing - runs at midnight on 1st of every month
    const monthlyBillingRule = new events.Rule(this, 'MonthlyBillingRule', {
      ruleName: 'srms-monthly-billing-trigger',
      description: 'SRMS: Auto-triggers billing calculation on 1st of each month at midnight UTC',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '0',
        day: '1',
        month: '*',
        year: '*',
      }),
    });
    monthlyBillingRule.addTarget(new targets.LambdaFunction(monthlyBillingLambda));

    // SRMS-1-MASTER-132: Daily data cleanup - runs at 2 AM UTC every day
    const dailyCleanupRule = new events.Rule(this, 'DailyCleanupRule', {
      ruleName: 'srms-daily-cleanup-check',
      description: 'SRMS: Daily check for schools that have exceeded 90 days non-payment',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2',
        day: '*',
        month: '*',
        year: '*',
      }),
    });
    dailyCleanupRule.addTarget(new targets.LambdaFunction(dataCleanupLambda));

    // SRMS-1-MASTER-133: Hourly suspension check - checks for overdue payments every hour
    const hourlySuspensionRule = new events.Rule(this, 'HourlySuspensionRule', {
      ruleName: 'srms-hourly-suspension-check',
      description: 'SRMS: Hourly check for schools with payment failures exceeding grace period',
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
    });
    hourlySuspensionRule.addTarget(new targets.LambdaFunction(suspendTenantLambda));

    // ============================================================
    // SRMS-1-MASTER-140: CLOUDWATCH — Monitoring and Alarms
    // ============================================================

    // SRMS-1-MASTER-141: Alarm for tenant registration failures
    // If a school pays but their stack fails to deploy, you are alerted
    new cloudwatch.Alarm(this, 'RegisterTenantErrorAlarm', {
      alarmName: 'srms-register-tenant-errors',
      alarmDescription: 'ALERT: Tenant registration Lambda failed - a paying school may not have been onboarded',
      metric: registerTenantLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    });

    // SRMS-1-MASTER-142: Alarm for Stripe webhook failures
    // If this fails, payments may not be processed correctly
    new cloudwatch.Alarm(this, 'StripeWebhookErrorAlarm', {
      alarmName: 'srms-stripe-webhook-errors',
      alarmDescription: 'ALERT: Stripe webhook Lambda failed - payment processing may be broken',
      metric: stripeWebhookLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    });

    // SRMS-1-MASTER-143: Alarm for admin dashboard failures
    new cloudwatch.Alarm(this, 'AdminDashboardErrorAlarm', {
      alarmName: 'srms-admin-dashboard-errors',
      alarmDescription: 'ALERT: Admin dashboard Lambda failed - super admin dashboard may be unavailable',
      metric: adminDashboardLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 3,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ============================================================
    // SRMS-1-MASTER-150: WAF — Web Application Firewall
    // ============================================================

    // SRMS-1-MASTER-151: WAF for Admin API
    // No IP blocking (your IP changes) but rate limiting and threat protection applied
    new wafv2.CfnWebACL(this, 'AdminApiWaf', {
      name: 'srms-admin-api-waf',
      description: 'WAF protection for SRMS Admin API - Owner: MUFUNG ANGELBELL MBUYEH',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'srms-admin-api-waf-metrics',
        sampledRequestsEnabled: true,
      },
      rules: [
        // SRMS-1-MASTER-152: Rate limit: max 200 requests per 5 minutes per IP
        // Prevents brute force attacks on admin login
        {
          name: 'AdminRateLimitRule',
          priority: 1,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 200,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'srms-admin-rate-limit',
            sampledRequestsEnabled: true,
          },
        },
        // SRMS-1-MASTER-153: Common threat protection (AWS managed rules)
        {
          name: 'AWSCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'srms-admin-common-rules',
            sampledRequestsEnabled: true,
          },
        },
        // SRMS-1-MASTER-154: Block SQL injection and XSS attacks
        {
          name: 'AWSKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'srms-admin-bad-inputs',
            sampledRequestsEnabled: true,
          },
        },
        // SRMS-1-MASTER-155: Block anonymous proxies and Tor exit nodes
        {
          name: 'AWSAnonymousIPList',
          priority: 4,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAnonymousIpList',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'srms-admin-anonymous-ip',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // ============================================================
    // SRMS-1-MASTER-160: CLOUDFORMATION OUTPUTS
    // These values are saved after deployment
    // Copy these values into your .env file
    // ============================================================

    new cdk.CfnOutput(this, 'Output_TenantsTableName', {
      value: this.masterTenantsTable.tableName,
      description: 'Copy to .env as MASTER_TENANTS_TABLE',
      exportName: 'SRMS-Master-TenantsTable',
    });

    new cdk.CfnOutput(this, 'Output_BillingTableName', {
      value: this.masterBillingTable.tableName,
      description: 'Copy to .env as MASTER_BILLING_TABLE',
      exportName: 'SRMS-Master-BillingTable',
    });

    new cdk.CfnOutput(this, 'Output_AuditTableName', {
      value: this.masterAuditTable.tableName,
      description: 'Copy to .env as MASTER_AUDIT_TABLE',
      exportName: 'SRMS-Master-AuditTable',
    });

    new cdk.CfnOutput(this, 'Output_SessionsTableName', {
      value: this.masterSessionsTable.tableName,
      description: 'Copy to .env as MASTER_SESSIONS_TABLE',
      exportName: 'SRMS-Master-SessionsTable',
    });

    new cdk.CfnOutput(this, 'Output_SuperAdminUserPoolId', {
      value: this.superAdminUserPool.userPoolId,
      description: 'Copy to .env as MASTER_COGNITO_USER_POOL_ID',
      exportName: 'SRMS-Master-SuperAdminPoolId',
    });

    new cdk.CfnOutput(this, 'Output_SuperAdminClientId', {
      value: superAdminClient.userPoolClientId,
      description: 'Copy to .env as MASTER_COGNITO_CLIENT_ID',
      exportName: 'SRMS-Master-SuperAdminClientId',
    });

    new cdk.CfnOutput(this, 'Output_AdminApiEndpoint', {
      value: this.adminHttpApi.apiEndpoint,
      description: 'Copy to .env as ADMIN_API_ENDPOINT',
      exportName: 'SRMS-Master-AdminApiEndpoint',
    });

    new cdk.CfnOutput(this, 'Output_MasterAssetsBucket', {
      value: this.masterAssetsBucket.bucketName,
      description: 'Copy to .env as MASTER_ASSETS_BUCKET',
      exportName: 'SRMS-Master-AssetsBucket',
    });

    new cdk.CfnOutput(this, 'Output_AdminApiUrl_ForStripeWebhook', {
      value: `${this.adminHttpApi.apiEndpoint}/webhooks/stripe`,
      description: 'Paste this URL into your Stripe Dashboard Webhooks section',
      exportName: 'SRMS-Master-StripeWebhookUrl',
    });

    // SRMS-1-MASTER-170: Summary output for easy reference
    new cdk.CfnOutput(this, 'Output_PlatformOwner', {
      value: 'MUFUNG ANGELBELL MBUYEH | AWS Solutions Architect | Yaoundé, Cameroon | mufungangelbellmbuyeh@gmail.com | WhatsApp: +237671534067',
      description: 'SRMS Platform Owner Information',
    });
  }
}