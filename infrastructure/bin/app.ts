#!/usr/bin/env node
// ============================================================
// SRMS-1-BIN-001: SRMS Platform CDK Application Entry Point
// ============================================================
// Owner: MUFUNG ANGELBELL MBUYEH
// Email: mufungangelbellmbuyeh@gmail.com
// Location: Yaoundé, Cameroon Northwest
// Title: AWS Solutions Architect
// WhatsApp: +237671534067
// ============================================================
// PURPOSE: This is the first file CDK reads when you run
// any CDK command. It initializes all stacks.
// ============================================================

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MasterStack } from '../lib/master-stack';
import { TenantStack, TenantConfig } from '../lib/tenant-stack';

// SRMS-1-BIN-002: Initialize the CDK application
const app = new cdk.App();

// SRMS-1-BIN-003: Read master configuration from cdk.json context
const masterConfig = app.node.tryGetContext('masterConfig');

// SRMS-1-BIN-004: Define AWS environment
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// SRMS-1-BIN-005: Global tags
const platformTags: Record<string, string> = {
  Platform: 'SRMS',
  Owner: 'MUFUNG-ANGELBELL-MBUYEH',
  Contact: 'mufungangelbellmbuyeh@gmail.com',
  Location: 'Yaounde-Cameroon',
  Version: '1.0.0',
  Year: '2026',
  Project: 'Student-Result-Management-System',
};

// ============================================================
// DEPLOY MASTER STACK
// ============================================================
const masterStack = new MasterStack(app, 'SRMS-Master', {
  env,
  description: 'SRMS Master Stack - Platform owned by MUFUNG ANGELBELL MBUYEH - Yaounde Cameroon - AWS Solutions Architect',
  tags: platformTags,
  terminationProtection: true,
});

// ============================================================
// TENANT STACK (ONLY WHEN PROVIDED)
// ============================================================
const tenantConfigJson = app.node.tryGetContext('tenantConfig');

if (tenantConfigJson) {
  let tenantConfig: TenantConfig;

  try {
    tenantConfig = typeof tenantConfigJson === 'string'
      ? JSON.parse(tenantConfigJson)
      : tenantConfigJson;
  } catch (error) {
    throw new Error(
      '[SRMS-ERROR-BIN-001] Invalid tenantConfig JSON format.\n' +
      'Correct format: cdk deploy -c tenantConfig=\'{"tenantId":"school-001","schoolName":"My School","plan":"standard","enabledSections":["section1","section5"],"subdomain":"myschool","adminEmail":"admin@school.com","adminPhone":"+237600000000","country":"Cameroon","stripeCustomerId":"cus_xxx","stripeSubscriptionId":"sub_xxx"}\''
    );
  }

  const requiredFields: (keyof TenantConfig)[] = [
    'tenantId',
    'schoolName',
    'plan',
    'enabledSections',
    'subdomain',
    'adminEmail',
    'adminPhone',
    'country',
    'stripeCustomerId',
    'stripeSubscriptionId',
  ];

  for (const field of requiredFields) {
    if (!tenantConfig[field]) {
      throw new Error(
        `[SRMS-ERROR-BIN-002] Missing required field: "${field}"\n` +
        `All required fields: ${requiredFields.join(', ')}`
      );
    }
  }

  if (!/^[a-z0-9-]+$/.test(tenantConfig.tenantId)) {
    throw new Error(
      '[SRMS-ERROR-BIN-003] tenantId must contain only lowercase letters, numbers, and hyphens.\n' +
      'Example: "gbhs-bamenda-001"'
    );
  }

  new TenantStack(app, `SRMS-Tenant-${tenantConfig.tenantId}`, {
    env,
    tenantConfig,
    description: `SRMS Tenant Stack for ${tenantConfig.schoolName}`,
    terminationProtection: false,
    tags: {
      ...platformTags,
      TenantId: tenantConfig.tenantId,
      SchoolName: tenantConfig.schoolName.replace(/\s+/g, '-'),
      Plan: tenantConfig.plan,
      Country: tenantConfig.country,
    },
  });
}

// ============================================================
// SYNTHESIZE
// ============================================================
app.synth();