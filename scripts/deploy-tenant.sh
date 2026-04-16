#!/bin/bash
# ============================================================
# SRMS-1-SCRIPT-001: Deploy New School Tenant
# Owner: MUFUNG ANGELBELL MBUYEH
# Usage: ./scripts/deploy-tenant.sh
# ============================================================

set -e

echo "=============================================="
echo "SRMS Platform - Deploy New School Tenant"
echo "Owner: MUFUNG ANGELBELL MBUYEH"
echo "=============================================="

# SRMS-1-SCRIPT-002: Prompt for required information
read -p "Enter Tenant ID (e.g., cm-gbhs-001): " TENANT_ID
read -p "Enter School Name: " SCHOOL_NAME
read -p "Enter Plan (starter/standard/professional/enterprise): " PLAN
read -p "Enter Admin Email: " ADMIN_EMAIL
read -p "Enter Admin Phone: " ADMIN_PHONE
read -p "Enter Country: " COUNTRY
read -p "Enter Subdomain (e.g., gbhs): " SUBDOMAIN
read -p "Enter Enabled Sections (e.g., section1,section2,section5): " SECTIONS_RAW

# SRMS-1-SCRIPT-003: Convert comma-separated sections to JSON array
IFS=',' read -ra SECTIONS_ARRAY <<< "$SECTIONS_RAW"
SECTIONS_JSON=$(printf '"%s",' "${SECTIONS_ARRAY[@]}" | sed 's/,$//')
SECTIONS_JSON="[$SECTIONS_JSON]"

# SRMS-1-SCRIPT-004: Build tenant config JSON
TENANT_CONFIG=$(cat << JSONEOF
{
  "tenantId": "$TENANT_ID",
  "schoolName": "$SCHOOL_NAME",
  "plan": "$PLAN",
  "enabledSections": $SECTIONS_JSON,
  "subdomain": "$SUBDOMAIN",
  "adminEmail": "$ADMIN_EMAIL",
  "adminPhone": "$ADMIN_PHONE",
  "country": "$COUNTRY",
  "stripeCustomerId": "manual",
  "stripeSubscriptionId": "manual",
  "maxStudentIds": 1000,
  "maxTeacherIds": 100
}
JSONEOF
)

echo ""
echo "Deploying stack for: $SCHOOL_NAME"
echo "Tenant ID: $TENANT_ID"
echo ""

# SRMS-1-SCRIPT-005: Run CDK deploy
cd infrastructure
npx cdk deploy "SRMS-Tenant-$TENANT_ID" \
  -c "tenantConfig=$TENANT_CONFIG" \
  --require-approval never \
  --outputs-file "./outputs/tenant-$TENANT_ID-outputs.json"

echo ""
echo "✅ Tenant deployed successfully!"
echo "Stack: SRMS-Tenant-$TENANT_ID"
echo "Outputs saved to: infrastructure/outputs/tenant-$TENANT_ID-outputs.json"