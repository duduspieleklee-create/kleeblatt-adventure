#!/usr/bin/env bash
#
# Stage deploy for kleeblatt-adventure.
# Triggered by .github/workflows/deploy.yml on every push to main.
# CI produces the builds (turbo build of web+api); this script ships them to
# the stage server (185.47.174.207 / stage.kleeblatt.space) and (re)starts
# the API with PM2. The web build is served statically by Caddy; API paths
# (/api, /auth, /health, /me) are reverse-proxied by Caddy to :4000.
#
set -euo pipefail

PORT="${DEPLOY_STAGE_PORT:-22}"
HOST="${DEPLOY_STAGE_HOST:?DEPLOY_STAGE_HOST required}"
USER="${DEPLOY_STAGE_USER:-root}"
WEB_PATH="${WEB_PATH:-/var/www/stage}"
API_PATH="${API_PATH:-/opt/kleeblatt-adventure}"
LOCAL_REPO="${GITHUB_WORKSPACE:-$(pwd)}"

SSH_OPTS="-p ${PORT} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
SSH_CMD="ssh ${SSH_OPTS} ${USER}@${HOST}"
RSYNC_BASE="rsync -az --delete -e \"ssh ${SSH_OPTS}\""

echo "==> Syncing web build -> ${WEB_PATH}"
# shellcheck disable=SC2086
eval ${RSYNC_BASE} "${LOCAL_REPO}/apps/web/dist/" "${USER}@${HOST}:${WEB_PATH}/"

echo "==> Syncing built repo -> ${API_PATH}"
# ship source + built artifacts; skip node_modules/.git (reinstalled on stage)
# shellcheck disable=SC2086
eval ${RSYNC_BASE} --exclude node_modules --exclude .git --exclude '*.log' \
  "${LOCAL_REPO}/" "${USER}@${HOST}:${API_PATH}/"

echo "==> Installing prod deps, writing env, starting API"
$SSH_CMD "bash -s" <<REMOTE
set -e
cd ${API_PATH}
# install prod deps at workspace root -> creates @kleeblatt/shared symlink
npm install --omit=dev --no-audit --no-fund

# API reads process.env directly; source this file into the shell before PM2 start
cat > apps/api/.env <<ENV
NODE_ENV=production
API_PORT=4000
WEB_URL=${STAGE_WEB_URL:-https://stage.kleeblatt.space}
CORS_ORIGIN=${STAGE_CORS_ORIGIN:-https://stage.kleeblatt.space}
API_URL=http://localhost:4000
DATABASE_URL=${STAGE_DATABASE_URL:-}
REDIS_URL=${STAGE_REDIS_URL:-}
SESSION_SECRET=${STAGE_SESSION_SECRET:-change-me-in-ci}
GOOGLE_CLIENT_ID=${STAGE_GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${STAGE_GOOGLE_CLIENT_SECRET:-}
GOOGLE_CALLBACK_URL=${STAGE_GOOGLE_CALLBACK_URL:-https://stage.kleeblatt.space/auth/google/callback}
SUPABASE_URL=${STAGE_SUPABASE_URL:-}
SUPABASE_ANON_KEY=${STAGE_SUPABASE_ANON_KEY:-}
SUPABASE_SERVICE_ROLE_KEY=${STAGE_SUPABASE_SERVICE_ROLE_KEY:-}
SUPABASE_JWT_SECRET=${STAGE_SUPABASE_JWT_SECRET:-}
SUPABASE_AUTH_URL=${STAGE_SUPABASE_AUTH_URL:-}
ENV

cd ${API_PATH}
# Load env into the current shell so the Node API sees them as process.env
set -a && source apps/api/.env && set +a
pm2 delete kleeblatt-api 2>/dev/null || true
pm2 start apps/api/dist/index.js --name kleeblatt-api
pm2 save
REMOTE

echo "==> Health check"
sleep 5
if curl -fsS "https://stage.kleeblatt.space/health"; then
  echo "STAGE DEPLOY OK"
else
  echo "STAGE HEALTH CHECK FAILED"
  exit 1
fi
