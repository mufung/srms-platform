// ============================================================
// SRMS-1-TENANT-001: SRMS Tenant Stack Template
// ============================================================
// Owner: MUFUNG ANGELBELL MBUYEH
// Description: Blueprint deployed for EACH school that registers
// Every school gets their own COMPLETELY ISOLATED AWS resources
// This template is deployed automatically when a school pays
// ============================================================

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

// ============================================================
// SRMS-1-TENANT-010: TYPE DEFINITIONS
// ============================================================

// SRMS-1-TENANT-011: Available sections/modules schools can purchase
export enum SRMSSection {
  SECTION_1_RESULT_PUBLISHING = 'section1',
  SECTION_2_COMPLAINT_ENGINE = 'section2',
  SECTION_3_GRADE_CALCULATOR = 'section3',
  SECTION_4_AI_ASSISTANT = 'section4',
  SECTION_5_NOTIFICATIONS = 'section5',
  SECTION_6_ANALYTICS = 'section6',
  SECTION_7_PARENT_PORTAL = 'section7',
}

// SRMS-1-TENANT-012: Available subscription plans
export type TenantPlan = 'starter' | 'standard' | 'professional' | 'enterprise';

// SRMS-1-TENANT-013: Full configuration for a school tenant
export interface TenantConfig {
  tenantId: string;              // Unique ID: e.g., "gbhs-bamenda-001"
  schoolName: string;            // Full school name
  plan: TenantPlan;              // Subscription plan
  enabledSections: SRMSSection[]; // Which modules they paid for
  subdomain: string;             // e.g., "gbhs" → gbhs.yourapp.com
  adminEmail: string;            // School admin email
  adminPhone: string;            // School admin phone (for SMS)
  country: string;               // e.g., "Cameroon"
  stripeCustomerId: string;      // Stripe customer ID
  stripeSubscriptionId: string;  // Stripe subscription ID
  maxStudentIds: number;         // Maximum student IDs allowed
  maxTeacherIds: number;         // Maximum teacher IDs allowed
  gradingSystem?: string;        // Custom grading criteria (JSON string)
  schoolLogoUrl?: string;        // School logo URL in S3
  primaryColor?: string;         // School brand color
  [key: string]: any;
}

// SRMS-1-TENANT-014: Props for the Tenant Stack
interface TenantStackProps extends cdk.StackProps {
  tenantConfig: TenantConfig;
}

// ============================================================
// SRMS-1-TENANT-020: TENANT STACK CLASS
// ============================================================
export class TenantStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: TenantStackProps) {
    super(scope, id, props);

    const { tenantConfig } = props;
    const {
      tenantId, schoolName, plan, enabledSections,
      subdomain, adminEmail, adminPhone, country,
      maxStudentIds, maxTeacherIds,
    } = tenantConfig;

    // SRMS-1-TENANT-021: Helper to check if a section is enabled
    const hasSection = (section: SRMSSection): boolean =>
      enabledSections.includes(section);

    // SRMS-1-TENANT-022: All resources for this school are prefixed with their tenantId
    // This ensures no naming conflicts between schools
    const prefix = `srms-${tenantId}`;

    // ============================================================
    // SRMS-1-TENANT-030: DYNAMODB TABLES — Per-School
    // ============================================================

    // SRMS-1-TENANT-031: USERS TABLE — All users of this school
    // Stores: students, teachers, parents, school admins
    // PK: USER#<userId>  SK: PROFILE
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `${prefix}-users`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // SRMS-1-TENANT-032: Query users by role (student, teacher, parent, admin)
    usersTable.addGlobalSecondaryIndex({
      indexName: 'RoleIndex',
      partitionKey: { name: 'role', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-TENANT-033: Query users by class (e.g., all students in Form 5A)
    usersTable.addGlobalSecondaryIndex({
      indexName: 'ClassIndex',
      partitionKey: { name: 'class', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-TENANT-034: Query users by department
    usersTable.addGlobalSecondaryIndex({
      indexName: 'DepartmentIndex',
      partitionKey: { name: 'department', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'role', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-TENANT-035: Query users by SRMS ID (the structured ID like CM-GBHS-2025-STU-0042)
    usersTable.addGlobalSecondaryIndex({
      indexName: 'SrmsIdIndex',
      partitionKey: { name: 'srmsId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SRMS-1-TENANT-040: RESULTS TABLE — Only if Section 1 is purchased
    let resultsTable: dynamodb.Table | undefined;
    if (hasSection(SRMSSection.SECTION_1_RESULT_PUBLISHING)) {
      // PK: RESULT#<classId>#<term>  SK: STUDENT#<studentId>#SUBJECT#<subject>
      resultsTable = new dynamodb.Table(this, 'ResultsTable', {
        tableName: `${prefix}-results`,
        partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });

      // SRMS-1-TENANT-041: Query all results for a specific student
      resultsTable.addGlobalSecondaryIndex({
        indexName: 'StudentResultsIndex',
        partitionKey: { name: 'studentId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'term', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      // SRMS-1-TENANT-042: Query results by status (draft, submitted, approved, published, final)
      resultsTable.addGlobalSecondaryIndex({
        indexName: 'ResultStatusIndex',
        partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'publishedAt', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      // SRMS-1-TENANT-043: Query results by teacher (for teacher's own uploads)
      resultsTable.addGlobalSecondaryIndex({
        indexName: 'TeacherResultsIndex',
        partitionKey: { name: 'teacherId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });
    }

    // SRMS-1-TENANT-050: COMPLAINTS TABLE — Only if Section 2 is purchased
    let complaintsTable: dynamodb.Table | undefined;
    if (hasSection(SRMSSection.SECTION_2_COMPLAINT_ENGINE)) {
      // PK: COMPLAINT#<complaintId>  SK: DETAILS
      complaintsTable = new dynamodb.Table(this, 'ComplaintsTable', {
        tableName: `${prefix}-complaints`,
        partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });

      // SRMS-1-TENANT-051: Teacher's complaint inbox query
      complaintsTable.addGlobalSecondaryIndex({
        indexName: 'TeacherComplaintsIndex',
        partitionKey: { name: 'teacherId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      // SRMS-1-TENANT-052: Student's own complaints query
      complaintsTable.addGlobalSecondaryIndex({
        indexName: 'StudentComplaintsIndex',
        partitionKey: { name: 'studentId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      // SRMS-1-TENANT-053: Query by complaint status (open, reviewing, resolved, rejected)
      complaintsTable.addGlobalSecondaryIndex({
        indexName: 'ComplaintStatusIndex',
        partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });
    }

    // SRMS-1-TENANT-060: NOTIFICATIONS TABLE — Only if Section 5 is purchased
    let notificationsTable: dynamodb.Table | undefined;
    if (hasSection(SRMSSection.SECTION_5_NOTIFICATIONS)) {
      notificationsTable = new dynamodb.Table(this, 'NotificationsTable', {
        tableName: `${prefix}-notifications`,
        partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        // SRMS-1-TENANT-061: Notifications auto-delete after 90 days
        timeToLiveAttribute: 'expiresAt',
      });

      // SRMS-1-TENANT-062: Query notifications by recipient
      notificationsTable.addGlobalSecondaryIndex({
        indexName: 'RecipientIndex',
        partitionKey: { name: 'recipientId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });
    }

    // SRMS-1-TENANT-070: ANALYTICS TABLE — Only if Section 6 is purchased
    let analyticsTable: dynamodb.Table | undefined;
    if (hasSection(SRMSSection.SECTION_6_ANALYTICS)) {
      analyticsTable = new dynamodb.Table(this, 'AnalyticsTable', {
        tableName: `${prefix}-analytics`,
        partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });
    }

    // SRMS-1-TENANT-075: AUDIT TABLE — Every school gets this, always
    // Records every action within this school's system
    const tenantAuditTable = new dynamodb.Table(this, 'TenantAuditTable', {
      tableName: `${prefix}-audit`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // SRMS-1-TENANT-076: SETTINGS TABLE — School configuration and customization
    // Stores: grading criteria, school logo, colors, branding, grade formulas
    const settingsTable = new dynamodb.Table(this, 'SettingsTable', {
      tableName: `${prefix}-settings`,
      partitionKey: { name: 'settingKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ============================================================
    // SRMS-1-TENANT-080: S3 BUCKET — Per-School File Storage
    // ============================================================

    // SRMS-1-TENANT-081: Per-school storage bucket
    // Folder structure:
    //   /results/uploads/     → Teacher-uploaded result files (any format)
    //   /results/exports/     → Generated PDF exports
    //   /proofs/complaints/   → Student complaint proof photos
    //   /proofs/documents/    → Student uploaded documents
    //   /school/logo/         → School logo and branding assets
    //   /school/customization/→ Chatbot-configured school assets
    //   /temp/                → Temporary files (deleted after 7 days)
    const tenantBucket = new s3.Bucket(this, 'TenantBucket', {
      bucketName: `${prefix}-storage-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'MoveProofsToInfrequentAccess',
          // SRMS-1-TENANT-082: Old complaint photos → cheaper storage after 90 days
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          prefix: 'proofs/',
        },
        {
          id: 'DeleteTempFiles',
          // SRMS-1-TENANT-083: Temp files auto-delete after 7 days
          expiration: cdk.Duration.days(7),
          prefix: 'temp/',
        },
        {
          id: 'ArchiveOldResults',
          // SRMS-1-TENANT-084: Old result exports → Glacier after 1 year
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          prefix: 'results/exports/',
        },
      ],
      cors: [
        {
          // SRMS-1-TENANT-085: Allow browser to upload files directly to S3
          // (presigned URLs - no API Gateway needed for large files)
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // ============================================================
    // SRMS-1-TENANT-090: COGNITO — Per-School Authentication
    // ============================================================

    // SRMS-1-TENANT-091: Per-school Cognito User Pool
    // This is completely isolated from every other school's users
    const tenantUserPool = new cognito.UserPool(this, 'TenantUserPool', {
      userPoolName: `${prefix}-users`,
      // SRMS-1-TENANT-092: Only school admin can create user accounts
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
        // SRMS-1-TENANT-093: Allow login with Student/Teacher ID as username
        username: true,
      },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: { sms: true, otp: true },
      // SRMS-1-TENANT-094: Custom attributes stored for each user
      customAttributes: {
        tenantId: new cognito.StringAttribute({ mutable: false }),
        role: new cognito.StringAttribute({ mutable: false }),
        srmsId: new cognito.StringAttribute({ mutable: false }),     // Structured ID
        department: new cognito.StringAttribute({ mutable: true }),
        class: new cognito.StringAttribute({ mutable: true }),
        academicYear: new cognito.StringAttribute({ mutable: true }),
        parentStudentId: new cognito.StringAttribute({ mutable: false }), // Parent's child ID
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // SRMS-1-TENANT-095: School Admin Group (highest access within the school)
    new cognito.CfnUserPoolGroup(this, 'SchoolAdminGroup', {
      userPoolId: tenantUserPool.userPoolId,
      groupName: 'school-admins',
      description: 'School administrators - full school access',
      precedence: 0,
    });

    // SRMS-1-TENANT-096: Teacher Group
    new cognito.CfnUserPoolGroup(this, 'TeacherGroup', {
      userPoolId: tenantUserPool.userPoolId,
      groupName: 'teachers',
      description: 'Teachers - can upload results, manage complaints',
      precedence: 1,
    });

    // SRMS-1-TENANT-097: Student Group
    new cognito.CfnUserPoolGroup(this, 'StudentGroup', {
      userPoolId: tenantUserPool.userPoolId,
      groupName: 'students',
      description: 'Students - can view results, raise complaints',
      precedence: 2,
    });

    // SRMS-1-TENANT-098: Parent Group (only if Section 7 is purchased)
    if (hasSection(SRMSSection.SECTION_7_PARENT_PORTAL)) {
      new cognito.CfnUserPoolGroup(this, 'ParentGroup', {
        userPoolId: tenantUserPool.userPoolId,
        groupName: 'parents',
        description: 'Parents - can view child results, submit feedback',
        precedence: 3,
      });
    }

    // SRMS-1-TENANT-099: Web App Client
    const tenantWebClient = new cognito.UserPoolClient(this, 'TenantWebClient', {
      userPool: tenantUserPool,
      userPoolClientName: `${prefix}-web-client`,
      generateSecret: false,
      authFlows: { userPassword: true, userSrp: true },
      accessTokenValidity: cdk.Duration.hours(8),
      idTokenValidity: cdk.Duration.hours(8),
      refreshTokenValidity: cdk.Duration.days(30),
      enableTokenRevocation: true,
      preventUserExistenceErrors: true,
    });

    // ============================================================
    // SRMS-1-TENANT-100: IAM ROLE — Per-School Lambda Permissions
    // ============================================================

    // SRMS-1-TENANT-101: This role is ONLY for this school's Lambdas
    // It CANNOT access any other school's resources
    const tenantLambdaRole = new iam.Role(this, 'TenantLambdaRole', {
      roleName: `${prefix}-lambda-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // SRMS-1-TENANT-102: Grant access to THIS school's tables only
    usersTable.grantReadWriteData(tenantLambdaRole);
    settingsTable.grantReadWriteData(tenantLambdaRole);
    tenantAuditTable.grantReadWriteData(tenantLambdaRole);
    if (resultsTable) resultsTable.grantReadWriteData(tenantLambdaRole);
    if (complaintsTable) complaintsTable.grantReadWriteData(tenantLambdaRole);
    if (notificationsTable) notificationsTable.grantReadWriteData(tenantLambdaRole);
    if (analyticsTable) analyticsTable.grantReadWriteData(tenantLambdaRole);

    // SRMS-1-TENANT-103: Grant access to THIS school's S3 bucket only
    tenantBucket.grantReadWrite(tenantLambdaRole);

    // SRMS-1-TENANT-104: Cognito user management within this school
    tenantLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminRemoveUserFromGroup',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminDisableUser',
        'cognito-idp:AdminEnableUser',
        'cognito-idp:AdminUpdateUserAttributes',
        'cognito-idp:ListUsers',
        'cognito-idp:ListUsersInGroup',
      ],
      resources: [tenantUserPool.userPoolArn],
    }));

    // SRMS-1-TENANT-105: SMS and Email for notifications (Section 5)
    if (hasSection(SRMSSection.SECTION_5_NOTIFICATIONS)) {
      tenantLambdaRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish', 'ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }));
    }

    // SRMS-1-TENANT-106: Bedrock AI access (Section 4)
    if (hasSection(SRMSSection.SECTION_4_AI_ASSISTANT)) {
      tenantLambdaRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: ['*'],
      }));
    }

    // SRMS-1-TENANT-107: S3 presigned URL generation for direct browser uploads
    tenantLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: [`${tenantBucket.bucketArn}/*`],
    }));

    // SRMS-1-TENANT-108: Common environment variables for all tenant Lambdas
    const tenantLambdaEnv: Record<string, string> = {
      TENANT_ID: tenantId,
      SCHOOL_NAME: schoolName,
      PLAN: plan,
      ENABLED_SECTIONS: JSON.stringify(enabledSections),
      COUNTRY: country,
      USERS_TABLE: usersTable.tableName,
      SETTINGS_TABLE: settingsTable.tableName,
      AUDIT_TABLE: tenantAuditTable.tableName,
      STORAGE_BUCKET: tenantBucket.bucketName,
      USER_POOL_ID: tenantUserPool.userPoolId,
      USER_POOL_CLIENT_ID: tenantWebClient.userPoolClientId,
      DEPLOY_REGION: this.region,
      MAX_STUDENT_IDS: maxStudentIds.toString(),
      MAX_TEACHER_IDS: maxTeacherIds.toString(),
      // Conditional tables
      RESULTS_TABLE: resultsTable?.tableName || 'SECTION_NOT_ENABLED',
      COMPLAINTS_TABLE: complaintsTable?.tableName || 'SECTION_NOT_ENABLED',
      NOTIFICATIONS_TABLE: notificationsTable?.tableName || 'SECTION_NOT_ENABLED',
      ANALYTICS_TABLE: analyticsTable?.tableName || 'SECTION_NOT_ENABLED',
      // Sections enabled flags
      HAS_SECTION_1: hasSection(SRMSSection.SECTION_1_RESULT_PUBLISHING).toString(),
      HAS_SECTION_2: hasSection(SRMSSection.SECTION_2_COMPLAINT_ENGINE).toString(),
      HAS_SECTION_3: hasSection(SRMSSection.SECTION_3_GRADE_CALCULATOR).toString(),
      HAS_SECTION_4: hasSection(SRMSSection.SECTION_4_AI_ASSISTANT).toString(),
      HAS_SECTION_5: hasSection(SRMSSection.SECTION_5_NOTIFICATIONS).toString(),
      HAS_SECTION_6: hasSection(SRMSSection.SECTION_6_ANALYTICS).toString(),
      HAS_SECTION_7: hasSection(SRMSSection.SECTION_7_PARENT_PORTAL).toString(),
      NODE_OPTIONS: '--enable-source-maps',
    };

    // ============================================================
    // SRMS-1-TENANT-110: LAMBDA FUNCTIONS — Per-School
    // Only deploy functions for sections the school paid for
    // ============================================================

    // SRMS-1-TENANT-111: Auth Lambda — ALL schools get this
    const authLambda = new lambda.Function(this, 'AuthLambda', {
      functionName: `${prefix}-auth`,
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../../backend/src/functions/auth'),
      handler: 'index.handler',
      role: tenantLambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: tenantLambdaEnv,
      description: `SRMS Auth for ${schoolName}`,
      logRetention: logs.RetentionDays.ONE_YEAR,
    });

    // SRMS-1-TENANT-112: Customization Lambda — ALL schools get this
    // Powers the school branding chatbot
    const customizationLambda = new lambda.Function(this, 'CustomizationLambda', {
      functionName: `${prefix}-customization`,
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../../backend/src/functions/customization'),
      handler: 'index.handler',
      role: tenantLambdaRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: tenantLambdaEnv,
      description: `SRMS School Customization for ${schoolName}`,
      logRetention: logs.RetentionDays.ONE_YEAR,
    });

    // SRMS-1-TENANT-113: Result Lambda — Only if Section 1
    let resultLambda: lambda.Function | undefined;
    if (hasSection(SRMSSection.SECTION_1_RESULT_PUBLISHING)) {
      resultLambda = new lambda.Function(this, 'ResultLambda', {
        functionName: `${prefix}-results`,
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset('../../backend/src/functions/results'),
        handler: 'index.handler',
        role: tenantLambdaRole,
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: tenantLambdaEnv,
        description: `SRMS Results for ${schoolName}`,
        logRetention: logs.RetentionDays.ONE_YEAR,
      });
    }

    // SRMS-1-TENANT-114: Complaint Lambda — Only if Section 2
    let complaintLambda: lambda.Function | undefined;
    if (hasSection(SRMSSection.SECTION_2_COMPLAINT_ENGINE)) {
      complaintLambda = new lambda.Function(this, 'ComplaintLambda', {
        functionName: `${prefix}-complaints`,
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset('../../backend/src/functions/complaints'),
        handler: 'index.handler',
        role: tenantLambdaRole,
        timeout: cdk.Duration.minutes(3),
        memorySize: 256,
        environment: tenantLambdaEnv,
        description: `SRMS Complaints for ${schoolName}`,
        logRetention: logs.RetentionDays.ONE_YEAR,
      });
    }

    // SRMS-1-TENANT-115: Notification Lambda — Only if Section 5
    let notificationLambda: lambda.Function | undefined;
    if (hasSection(SRMSSection.SECTION_5_NOTIFICATIONS)) {
      notificationLambda = new lambda.Function(this, 'NotificationLambda', {
        functionName: `${prefix}-notifications`,
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset('../../backend/src/functions/notifications'),
        handler: 'index.handler',
        role: tenantLambdaRole,
        timeout: cdk.Duration.minutes(2),
        memorySize: 256,
        environment: tenantLambdaEnv,
        description: `SRMS Notifications for ${schoolName}`,
        logRetention: logs.RetentionDays.ONE_YEAR,
      });
    }

    // SRMS-1-TENANT-116: AI Lambda — Only if Section 4
    let aiLambda: lambda.Function | undefined;
    if (hasSection(SRMSSection.SECTION_4_AI_ASSISTANT)) {
      aiLambda = new lambda.Function(this, 'AILambda', {
        functionName: `${prefix}-ai`,
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset('../../backend/src/functions/ai'),
        handler: 'index.handler',
        role: tenantLambdaRole,
        timeout: cdk.Duration.minutes(3),
        memorySize: 512,
        environment: tenantLambdaEnv,
        description: `SRMS AI Assistant for ${schoolName}`,
        logRetention: logs.RetentionDays.ONE_YEAR,
      });
    }

    // ============================================================
    // SRMS-1-TENANT-120: API GATEWAY — Per-School HTTP API
    // ============================================================

    // SRMS-1-TENANT-121: Create isolated API for this school
    const tenantHttpApi = new apigateway.HttpApi(this, 'TenantHttpApi', {
      apiName: `${prefix}-api`,
      description: `SRMS API for ${schoolName} - TenantId: ${tenantId}`,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: [
          'Content-Type', 'Authorization',
          'X-SRMS-Tenant-ID', 'X-SRMS-User-Role',
          'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.days(1),
      },
    });

    // SRMS-1-TENANT-122: Auth routes — always present
    tenantHttpApi.addRoutes({
      path: '/auth/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('AuthIntegration', authLambda),
    });

    // SRMS-1-TENANT-123: Customization routes — always present
    tenantHttpApi.addRoutes({
      path: '/customize/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('CustomizationIntegration', customizationLambda),
    });

    // SRMS-1-TENANT-124: Result routes — only if Section 1
    if (resultLambda) {
      tenantHttpApi.addRoutes({
        path: '/results/{proxy+}',
        methods: [apigateway.HttpMethod.ANY],
        integration: new apigatewayIntegrations.HttpLambdaIntegration('ResultIntegration', resultLambda),
      });
    }

    // SRMS-1-TENANT-125: Complaint routes — only if Section 2
    if (complaintLambda) {
      tenantHttpApi.addRoutes({
        path: '/complaints/{proxy+}',
        methods: [apigateway.HttpMethod.ANY],
        integration: new apigatewayIntegrations.HttpLambdaIntegration('ComplaintIntegration', complaintLambda),
      });
    }

    // SRMS-1-TENANT-126: Notification routes — only if Section 5
    if (notificationLambda) {
      tenantHttpApi.addRoutes({
        path: '/notifications/{proxy+}',
        methods: [apigateway.HttpMethod.ANY],
        integration: new apigatewayIntegrations.HttpLambdaIntegration('NotificationIntegration', notificationLambda),
      });
    }

    // SRMS-1-TENANT-127: AI routes — only if Section 4
    if (aiLambda) {
      tenantHttpApi.addRoutes({
        path: '/ai/{proxy+}',
        methods: [apigateway.HttpMethod.ANY],
        integration: new apigatewayIntegrations.HttpLambdaIntegration('AIIntegration', aiLambda),
      });
    }

    // ============================================================
    // SRMS-1-TENANT-130: CLOUDWATCH — Per-School Monitoring
    // ============================================================

    // SRMS-1-TENANT-131: Auth Lambda error alarm
    new cloudwatch.Alarm(this, 'AuthLambdaErrorAlarm', {
      alarmName: `${prefix}-auth-errors`,
      alarmDescription: `AUTH ERRORS for ${schoolName} - students/teachers cannot login`,
      metric: authLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ============================================================
    // SRMS-1-TENANT-140: CLOUDFORMATION OUTPUTS
    // ============================================================

    new cdk.CfnOutput(this, 'Output_TenantApiEndpoint', {
      value: tenantHttpApi.apiEndpoint,
      description: `API Endpoint for ${schoolName}`,
      exportName: `SRMS-${tenantId}-ApiEndpoint`,
    });

    new cdk.CfnOutput(this, 'Output_TenantUserPoolId', {
      value: tenantUserPool.userPoolId,
      description: `Cognito User Pool for ${schoolName}`,
      exportName: `SRMS-${tenantId}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'Output_TenantClientId', {
      value: tenantWebClient.userPoolClientId,
      description: `Cognito Client ID for ${schoolName}`,
      exportName: `SRMS-${tenantId}-ClientId`,
    });

    new cdk.CfnOutput(this, 'Output_TenantStorageBucket', {
      value: tenantBucket.bucketName,
      description: `Storage Bucket for ${schoolName}`,
      exportName: `SRMS-${tenantId}-StorageBucket`,
    });

    new cdk.CfnOutput(this, 'Output_TenantSubdomain', {
      value: `${subdomain}.placeholder.com`,
      description: `Subdomain for ${schoolName} (domain setup in later phase)`,
      exportName: `SRMS-${tenantId}-Subdomain`,
    });

    new cdk.CfnOutput(this, 'Output_EnabledSections', {
      value: enabledSections.join(', '),
      description: `Enabled sections for ${schoolName}`,
    });
  }
}