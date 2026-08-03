#!/usr/bin/env bash
# Local production build helper for Kleeblatt Adventure (web + shared).
# Remote publish is done by GitHub Actions → game.kleeblatt.space
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Kleeblatt Adventure – production build"
echo "======================================"

if [[ ! -d node_modules ]]; then
  echo "Dependencies missing. Run: npm install" >&2
  exit 1
fi

npm run build -- --filter=@kleeblatt/shared --filter=@kleeblatt/web

if [[ ! -f apps/web/dist/index.html ]]; then
  echo "Build failed: apps/web/dist/index.html missing" >&2
  exit 1
fi

echo ""
echo "Build OK → apps/web/dist/"
ls -la apps/web/dist/
echo ""
echo "Publish: push to main (or run workflow Deploy game.kleeblatt.space)."
echo "Live URL: https://game.kleeblatt.space/"
