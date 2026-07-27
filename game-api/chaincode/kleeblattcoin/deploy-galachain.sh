#!/bin/bash
set -euo pipefail

echo "=== GalaChain Deploy Script ==="
echo "Started at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

IMAGE_TAG="${IMAGE_TAG:-${{ github.repository }}-kleeblattcoin:${{ github.sha }}}"
GC_API_URL="${GC_API_URL:-https://gateway-dev.galachain.com/cli/}"
DEV_PRIVATE_KEY="${DEV_PRIVATE_KEY:-}"

if [ -z "$DEV_PRIVATE_KEY" ]; then
  echo "ERROR: DEV_PRIVATE_KEY is not set"
  exit 1
fi

echo "Image tag: $IMAGE_TAG"
echo "GC_API_URL: $GC_API_URL"

mkdir -p keys
printf '%s\n' "$DEV_PRIVATE_KEY" > keys/gc-dev-key
chmod 600 keys/gc-dev-key

echo "Registering chaincode..."
set +e
galachain info --json > /tmp/galachain-debug/info.json 2>&1 || true
set -e

galachain register --no-prompt --json > /tmp/galachain-debug/register.json 2>&1
REGISTER_EXIT=$?
echo "Register exit code: ${REGISTER_EXIT}"
if [ "${REGISTER_EXIT}" -ne 0 ]; then
  echo "::error::galachain register failed with exit code ${REGISTER_EXIT}"
  exit 1
fi

echo "Deploying chaincode..."
galachain deploy "$IMAGE_TAG" --no-prompt --json > /tmp/galachain-debug/deploy.json 2>&1
DEPLOY_EXIT=$?
echo "Deploy exit code: ${DEPLOY_EXIT}"
if [ "${DEPLOY_EXIT}" -ne 0 ]; then
  echo "::error::galachain deploy failed with exit code ${DEPLOY_EXIT}"
  exit 1
fi

echo "=== Deployment complete ==="
echo "Finished at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
