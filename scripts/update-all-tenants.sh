#!/bin/bash
# SRMS-1-SCRIPT-020: Push CDK updates to all tenant stacks
# Owner: MUFUNG ANGELBELL MBUYEH
set -e
echo "Deploying updates to ALL tenant stacks..."
cd infrastructure
npx cdk deploy --all --require-approval never
echo "✅ All tenant stacks updated"