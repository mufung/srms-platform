#!/bin/bash
# SRMS-1-SCRIPT-010: Suspend a tenant manually
# Owner: MUFUNG ANGELBELL MBUYEH
set -e
read -p "Enter Tenant ID to suspend: " TENANT_ID
echo "Suspending tenant: $TENANT_ID"
aws lambda invoke \
  --function-name srms-suspend-tenant \
  --payload "{\"body\":\"{\\\"tenantId\\\":\\\"$TENANT_ID\\\",\\\"reason\\\":\\\"Manual suspension by admin\\\"}\"}" \
  --cli-binary-format raw-in-base64-out \
  /tmp/suspend-response.json
cat /tmp/suspend-response.json
echo ""
echo "✅ Suspension request sent for: $TENANT_ID"