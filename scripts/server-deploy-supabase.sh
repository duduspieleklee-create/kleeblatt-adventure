#!/usr/bin/env bash
#
# Deploy self-hosted Supabase stack to the VPS.
# Triggered by .github/workflows/deploy.yml when infra/supabase/** changes.
#
# Syncs the version-controlled Supabase Docker config from the repo to
# /opt/supabase/docker/ on the stage server, writes the .env from secrets,
# and runs docker compose up -d.
#
set -euo pipefail

PORT="${DEPLOY_STAGE_PORT:-22}"
HOST="${DEPLOY_STAGE_HOST:?DEPLOY_STAGE_HOST required}"
USER="${DEPLOY_STAGE_USER:-root}"
LOCAL_REPO="${GITHUB_WORKSPACE:-$(pwd)}"
SUPABASE_DST="/opt/supabase/docker"

SSH_OPTS="-p ${PORT} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
SSH_CMD="ssh ${SSH_OPTS} ${USER}@${HOST}"
RSYNC_BASE="rsync -az --delete -e \"ssh ${SSH_OPTS}\""

echo "==> Ensuring /opt/supabase/docker exists on stage"
$SSH_CMD "mkdir -p ${SUPABASE_DST}/volumes/api/envoy ${SUPABASE_DST}/volumes/pooler ${SUPABASE_DST}/volumes/logs ${SUPABASE_DST}/volumes/functions/main ${SUPABASE_DST}/volumes/functions/hello ${SUPABASE_DST}/volumes/snippets"

echo "==> Syncing Supabase config -> ${SUPABASE_DST}"
# Sync docker-compose.yml and volumes (exclude .env, data dirs, storage)
# shellcheck disable=SC2086
eval ${RSYNC_BASE} \
  --exclude '.env' \
  --exclude 'volumes/db/data' \
  --exclude 'volumes/storage' \
  --exclude '.git' \
  --exclude 'backups' \
  "${LOCAL_REPO}/infra/supabase/" "${USER}@${HOST}:${SUPABASE_DST}/"

echo "==> Writing .env from secrets"
$SSH_CMD "bash -s" <<REMOTE
set -e
# Ensure standard bin dirs are on PATH (non-login SSH shells can drop them)
export PATH="/usr/local/bin:/usr/bin:/bin:\$PATH"
# Ensure Docker Engine is installed on the stage host (self-heal fresh VPSes)
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Docker Engine not found on stage host — installing"
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  rm -f /tmp/get-docker.sh
  command -v systemctl >/dev/null 2>&1 && systemctl enable --now docker >/dev/null 2>&1 || \
    command -v service >/dev/null 2>&1 && service docker start >/dev/null 2>&1 || true
  # wait for the docker daemon to be ready
  for n in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do docker info >/dev/null 2>&1 && break; sleep 2; done
  export PATH="/usr/local/bin:/usr/bin:/bin:\$PATH"
fi
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker Engine still not available after install attempt"; exit 1; }
cat > ${SUPABASE_DST}/.env <<ENV
COMPOSE_FILE=docker-compose.yml
POSTGRES_PASSWORD=${SUPABASE_POSTGRES_PASSWORD}
JWT_SECRET=${SUPABASE_JWT_SECRET}
ANON_KEY=${SUPABASE_ANON_KEY}
SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
JWT_JWKS=
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=${SUPABASE_DASHBOARD_PASSWORD:-this_password_was_generated}
SECRET_KEY_BASE=UpNVnt3whd5jp9ot2F8P3FwxhqHwJqCr5alV8R5h2oq
REALTIME_DB_ENC_KEY=supabaserealtime
VAULT_ENC_KEY=your-32-character-encryption-key
PG_META_CRYPTO_KEY=your-encryption-key-32-chars-min
LOGFLARE_PUBLIC_ACCESS_TOKEN=your-s...blic
LOGFLARE_PRIVATE_ACCESS_TOKEN=your-s...vate
S3_PROTOCOL_ACCESS_KEY_ID=625729a08b95bf1b7ff351a663f3a23c
S3_PROTOCOL_ACCESS_KEY_SECRET=8501815907
SUPABASE_PUBLIC_URL=${SUPABASE_PUBLIC_URL}
API_EXTERNAL_URL=${SUPABASE_API_EXTERNAL_URL}
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
POOLER_PROXY_PORT_TRANSACTION=6543
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
POOLER_TENANT_ID=your-tenant-id
POOLER_DB_POOL_SIZE=5
STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project
OPENAI_API_KEY=
SITE_URL=${SUPABASE_SITE_URL}
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
MAILER_URLPATHS_CONFIRMATION="/auth/v1/verify"
MAILER_URLPATHS_INVITE="/auth/v1/verify"
MAILER_URLPATHS_RECOVERY="/auth/v1/verify"
MAILER_URLPATHS_EMAIL_CHANGE="/auth/v1/verify"
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_ANONYMOUS_USERS=false
ENABLE_PHONE_SIGNUP=false
ENABLE_PHONE_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=
SMTP_HOST=
SMTP_PORT=2500
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=
ENV

# Load env vars into shell for the heredoc substitution
export SUPABASE_POSTGRES_PASSWORD="${SUPABASE_POSTGRES_PASSWORD}"
export SUPABASE_JWT_SECRET="${SUPABASE_JWT_SECRET}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
export SUPABASE_PUBLIC_URL="${SUPABASE_PUBLIC_URL}"
export SUPABASE_API_EXTERNAL_URL="${SUPABASE_API_EXTERNAL_URL}"
export SUPABASE_SITE_URL="${SUPABASE_SITE_URL}"

cd ${SUPABASE_DST}
echo "==> Pulling updated images if needed"
docker compose pull 2>&1 | tail -5

echo "==> Starting Supabase stack"
docker compose up -d 2>&1 | tail -15

echo "==> Waiting for db to be healthy..."
sleep 5
DB_OK=0
for i in \$(seq 1 10); do
  STATUS=\$(docker compose ps db --format '{{.Status}}' 2>/dev/null || echo "")
  echo "  Attempt \$i: db \${STATUS}"
  if echo "\${STATUS}" | grep -qi "healthy"; then
    DB_OK=1
    break
  fi
  sleep 5
done

if [ \$DB_OK -eq 0 ]; then
  echo "ERROR: db container did not become healthy"
  docker compose logs --tail 30 db 2>&1 || true
  exit 1
fi

echo "==> Syncing supabase_auth_admin password..."
docker compose exec -T db psql -U postgres -c "ALTER USER supabase_auth_admin WITH PASSWORD '${SUPABASE_POSTGRES_PASSWORD}';" 2>&1 || true

echo "==> Fixing auth schema ownership..."
cat > /tmp/fix-auth.sql <<'EOSQL'
DO \$\$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth' AND proname = 'uid'
      AND pg_get_userbyid(p.proowner) != 'supabase_auth_admin'
  ) THEN
    RAISE NOTICE 'auth schema has wrong ownership — recreating';
    DROP SCHEMA auth CASCADE;
    CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;
  ELSE
    RAISE NOTICE 'auth schema ownership OK';
  END IF;
END \$\$;
EOSQL
docker compose exec -T db psql -U postgres -f /tmp/fix-auth.sql 2>&1 || true
rm -f /tmp/fix-auth.sql

echo "==> Restarting auth to pick up fixed credentials..."
docker compose restart auth 2>&1 | tail -3

echo "==> Waiting for auth container to become healthy..."
sleep 10
AUTH_OK=0
for i in \$(seq 1 10); do
  STATUS=\$(docker compose ps auth --format '{{.Status}}' 2>/dev/null || echo "")
  echo "  Attempt \$i: auth \${STATUS}"
  if echo "\${STATUS}" | grep -qi "healthy"; then
    echo "SUPABASE AUTH SERVICE HEALTHY"
    AUTH_OK=1
    break
  fi
  sleep 10
done

if [ \$AUTH_OK -eq 0 ]; then
  echo "ERROR: auth container did not become healthy after 100s"
  docker compose logs --tail 30 auth 2>&1 || true
  echo "=== db container logs ==="
  docker compose logs --tail 30 db 2>&1 || true
  exit 1
fi

echo "==> HTTP health check via gateway..."
HEALTH="000"
for i in 1 2 3; do
  HEALTH=\$(curl -s -o /dev/null -w '%{http_code}' -H "apikey: ${SUPABASE_ANON_KEY}" http://localhost:8000/auth/v1/health 2>/dev/null || echo "000")
  if [ "\$HEALTH" = "200" ]; then
    echo "SUPABASE HTTP HEALTHY (200)"
    break
  fi
  echo "  HTTP attempt \$i: \${HEALTH}"
  sleep 3
done

if [ "\$HEALTH" = "200" ]; then
  echo "SUPABASE DEPLOY OK"
else
  echo "SUPABASE HEALTH CHECK FAILED — HTTP=\${HEALTH}"
  docker compose logs --tail 15 api-gw 2>&1 || true
  docker compose logs --tail 15 auth 2>&1 || true
  exit 1
fi
REMOTE
