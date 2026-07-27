#!/bin/bash
set -euo pipefail

echo "=== GalaChain Deploy Script ==="
echo "Started at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_NAME="${IMAGE_NAME:-kleeblattcoin}"
GITHUB_SHA="${GITHUB_SHA:-$(git rev-parse HEAD)}"
GC_API_URL="${GC_API_URL:-https://gateway-dev.galachain.com/cli/}"
DEV_PRIVATE_KEY="${DEV_PRIVATE_KEY:-}"

if [ -z "$DEV_PRIVATE_KEY" ]; then
  echo "ERROR: DEV_PRIVATE_KEY is not set"
  exit 1
fi

echo "Registry: $REGISTRY"
echo "Image: $IMAGE_NAME"
echo "SHA: $GITHUB_SHA"
echo "GC_API_URL: $GC_API_URL"

mkdir -p keys
printf '%s\n' "$DEV_PRIVATE_KEY" > keys/gc-dev-key
chmod 600 keys/gc-dev-key

IMAGE_ID="${REGISTRY}/${IMAGE_NAME}"
IMAGE_ID=$(echo "$IMAGE_ID" | tr '[A-Z]' '[a-z]')
VERSION="$GITHUB_SHA"

echo "Building Docker image..."
docker build -t "${IMAGE_NAME}:latest" game-api/chaincode/kleeblattcoin/
docker tag "${IMAGE_NAME}:latest" "${IMAGE_ID}:${VERSION}"
docker tag "${IMAGE_NAME}:latest" "${IMAGE_ID}:latest"

echo "Pushing ${IMAGE_ID}:${VERSION}..."
docker push "${IMAGE_ID}:${VERSION}"
echo "Pushing ${IMAGE_ID}:latest..."
docker push "${IMAGE_ID}:latest"

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
galachain deploy "${IMAGE_ID}:${VERSION}" --no-prompt --json > /tmp/galachain-debug/deploy.json 2>&1
DEPLOY_EXIT=$?
echo "Deploy exit code: ${DEPLOY_EXIT}"
if [ "${DEPLOY_EXIT}" -ne 0 ]; then
  echo "::error::galachain deploy failed with exit code ${DEPLOY_EXIT}"
  exit 1
fi

echo "=== Deployment complete ==="
echo "Finished at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
