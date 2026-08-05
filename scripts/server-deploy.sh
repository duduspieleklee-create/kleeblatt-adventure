#!/usr/bin/env bash
# Remote deploy helper for game.kleeblatt.space
# Expected env: WEB_PATH, API_PATH, REMOTE_TAR, SHORT, WEB_CHANGED, API_CHANGED, DEPLOY_USER
set -euo pipefail

WEB_PATH="${WEB_PATH:?}"
API_PATH="${API_PATH:?}"
REMOTE_TAR="${REMOTE_TAR:?}"
SHORT="${SHORT:?}"
WEB_CHANGED="${WEB_CHANGED:-true}"
API_CHANGED="${API_CHANGED:-true}"
DEPLOY_USER="${DEPLOY_USER:-debian}"
OVERLAY="${OVERLAY:-/tmp/kleeblatt.env.overlay}"
STAGING="/tmp/kleeblatt-release-${SHORT}"

log() { echo "[deploy $(date -u +%H:%M:%S)] $*"; }

log "Extracting $REMOTE_TAR → $STAGING"
rm -rf "$STAGING"
mkdir -p "$STAGING"
tar -xzf "$REMOTE_TAR" -C "$STAGING"
# shellcheck disable=SC1091
source "$STAGING/meta/release.env"
log "release GIT_SHA=${GIT_SHA:-?} LOCK=${LOCK_HASH:-?} web=$WEB_CHANGED api=$API_CHANGED"

# --- Web: rsync into document root ---
if [ "$WEB_CHANGED" = "true" ]; then
  log "Deploying web → $WEB_PATH"
  mkdir -p "$WEB_PATH"
  WEB_STAGE="${WEB_PATH}.staging-${SHORT}"
  rm -rf "$WEB_STAGE"
  mkdir -p "$WEB_STAGE"
  cp -a "$STAGING/web/." "$WEB_STAGE/"
  rsync -a --delete "$WEB_STAGE/" "$WEB_PATH/"
  rm -rf "$WEB_STAGE"
  chown -R "${DEPLOY_USER}:www-data" "$WEB_PATH" 2>/dev/null || chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$WEB_PATH" || true
  log "Web deploy done"
else
  log "Skip web (unchanged)"
fi

# --- API: sync tree, merge env, conditional npm install + restart ---
if [ "$API_CHANGED" = "true" ]; then
  log "Deploying API → $API_PATH"
  mkdir -p "$API_PATH/apps/api/dist" "$API_PATH/packages/shared/dist"
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$API_PATH" || true

  rsync -a \
    --exclude node_modules \
    --exclude .env \
    --exclude releases \
    "$STAGING/api/" "$API_PATH/"

  ENV_FILE="${API_PATH}/.env"
  MERGED="/tmp/kleeblatt.env.merged.$$"
  touch "$ENV_FILE"
  cat "$ENV_FILE" > "$MERGED" 2>/dev/null || true
  if [ -f "$OVERLAY" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      case "$line" in
        ''|\#*) continue ;;
      esac
      key="${line%%=*}"
      [ -n "$key" ] || continue
      if grep -q "^${key}=" "$MERGED" 2>/dev/null; then
        grep -v "^${key}=" "$MERGED" > "${MERGED}.tmp" || true
        mv "${MERGED}.tmp" "$MERGED"
      fi
      printf '%s\n' "$line" >> "$MERGED"
    done < "$OVERLAY"
    mv "$MERGED" "$ENV_FILE"
    chmod 640 "$ENV_FILE"
    chown "${DEPLOY_USER}:${DEPLOY_USER}" "$ENV_FILE" || true
    rm -f "$OVERLAY"
  fi
  rm -f "$MERGED" "${MERGED}.tmp" 2>/dev/null || true

  LOCK_STATE="${API_PATH}/.deploy-lock-hash"
  NEED_INSTALL=1
  if [ -f "$LOCK_STATE" ] && [ -d "${API_PATH}/node_modules" ]; then
    OLD=$(cat "$LOCK_STATE" || true)
    if [ "$OLD" = "${LOCK_HASH:-}" ]; then
      NEED_INSTALL=0
      log "package-lock unchanged — skip npm install"
    fi
  fi

  cd "$API_PATH"
  if [ "$NEED_INSTALL" = 1 ]; then
    log "npm install --omit=dev"
    npm install --omit=dev --no-audit --no-fund
    echo "${LOCK_HASH:-unknown}" > "$LOCK_STATE"
  fi

  log "systemctl restart kleeblatt-api"
  systemctl restart kleeblatt-api

  ok=0
  for i in $(seq 1 12); do
    if curl -sf http://127.0.0.1:4000/health >/dev/null; then
      log "API health OK (attempt $i)"
      ok=1
      break
    fi
    log "API health wait $i/12..."
    sleep 2
  done
  if [ "$ok" != 1 ]; then
    log "API health FAILED"
    systemctl status kleeblatt-api --no-pager || true
    journalctl -u kleeblatt-api -n 50 --no-pager || true
    exit 1
  fi
  curl -s http://127.0.0.1:4000/health || true
else
  log "Skip API (unchanged)"
fi

rm -rf "$STAGING"
rm -f "$REMOTE_TAR"
log "Deploy complete short=$SHORT"
