#!/usr/bin/env bash
#
# Run database migrations against the Supabase Postgres instance.
# Triggered by .github/workflows/deploy.yml when apps/api/drizzle/** changes.
#
# Runs all .sql files in apps/api/drizzle/ in alphabetical order against
# the Supabase Postgres container via docker exec psql. Each statement
# breakpoint is handled by psql's ON_ERROR_STOP.
#
set -euo pipefail

PORT="${DEPLOY_STAGE_PORT:-22}"
HOST="${DEPLOY_STAGE_HOST:?DEPLOY_STAGE_HOST required}"
USER="${DEPLOY_STAGE_USER:-root}"
LOCAL_REPO="${GITHUB_WORKSPACE:-$(pwd)}"
API_PATH="${API_PATH:-/opt/kleeblatt-adventure}"
DB_CONTAINER="supabase-db"
DB_USER="postgres"
DB_NAME="postgres"

SSH_OPTS="-p ${PORT} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
SSH_CMD="ssh ${SSH_OPTS} ${USER}@${HOST}"

echo "==> Syncing migration files to stage"
# Rsync just the drizzle folder (fast, small files)
RSYNC_BASE="rsync -az --delete -e \"ssh ${SSH_OPTS}\""
# shellcheck disable=SC2086
eval ${RSYNC_BASE} \
  "${LOCAL_REPO}/apps/api/drizzle/" "${USER}@${HOST}:${API_PATH}/apps/api/drizzle/"

echo "==> Running migrations against Supabase Postgres (${DB_CONTAINER})"

# List all SQL files in order and pipe each to psql via docker exec
$SSH_CMD "bash -s" <<REMOTE
set -e
cd ${API_PATH}/apps/api/drizzle

# Get the Postgres password from the Supabase .env
PG_PASS=\$(grep "^POSTGRES_PASSWORD=" /opt/supabase/docker/.env | cut -d= -f2)
export PGPASSWORD="\$PG_PASS"

# Get list of SQL files in order
SQL_FILES=\$(ls *.sql 2>/dev/null | sort)

if [ -z "\$SQL_FILES" ]; then
  echo "No migration files found"
  exit 0
fi

FAILED=0
for f in \$SQL_FILES; do
  echo "  Applying \${f}..."

  # Run the migration via docker exec psql
  # ON_ERROR_STOP=1 makes psql exit with non-zero on any error
  if docker exec -e PGPASSWORD="\$PG_PASS" ${DB_CONTAINER} \
    psql -U ${DB_USER} -d ${DB_NAME} \
    -v ON_ERROR_STOP=1 \
    -f "/dev/stdin" \
    < "\${f}" 2>&1; then
    echo "  ✓ \${f} applied"
  else
    echo "  ✗ \${f} FAILED (may already be applied — checking if safe to continue)"

    # Check if the error is a "already exists" type error (safe to continue)
    # Re-run with ON_ERROR_STOP=0 to see the actual errors
    ERRORS=\$(docker exec -e PGPASSWORD="\$PG_PASS" ${DB_CONTAINER} \
      psql -U ${DB_USER} -d ${DB_NAME} \
      -v ON_ERROR_STOP=0 \
      -f "/dev/stdin" \
      < "\${f}" 2>&1 || true)

    if echo "\$ERRORS" | grep -qi "already exists\|duplicate_object\|does not exist.*skip\|NOTICE.*skipping\|NOTICE.*Fresh"; then
      echo "  ⚠ \${f} — already applied or idempotent, continuing"
    else
      echo "  ✗ \${f} — real error, stopping:"
      echo "\$ERRORS" | tail -20
      FAILED=1
      break
    fi
  fi
done

if [ \$FAILED -eq 1 ]; then
  echo "MIGRATION FAILED"
  exit 1
fi

echo ""
echo "==> Verifying tables"
docker exec -e PGPASSWORD="\$PG_PASS" ${DB_CONTAINER} \
  psql -U ${DB_USER} -d ${DB_NAME} -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"

echo "MIGRATION OK"
REMOTE
