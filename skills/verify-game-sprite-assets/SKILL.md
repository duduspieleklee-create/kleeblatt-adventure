---
name: "verify-game-sprite-assets"
description: "Verify sprite/asset references against asset-manifest and on-disk files before commit; per-sprite frame counts differ."
---

# Verify game sprite assets before referencing

## When to use
- Adding sprite/asset references (bar frames, icons, cursor, expressions) to Phaser scenes or React HUD components in the kleeblatt game monorepo.
- Ticket requires assets from `apps/web/public/assets/asset-manifest.json` ("all referenced from asset-manifest").

## Procedure
1. Inspect manifest structure:
   `node -e 'const m=require("./apps/web/public/assets/asset-manifest.json"); console.log(Object.keys(m))'`
   Keys: tilesets, characters, ui, elements, vfx. `ui` is a dict of filename → entry.
2. List actual files of the series:
   `ls apps/web/public/assets/ui/ | grep "^<series>"`.
   A flat list also exists: `asset-manifest.txt` with one `assets/ui/<file>.png` line per file.
3. Frame-indexed series have DIFFERENT frame counts per series — never assume one constant (evidence: redbar 7 frames 00..06, bluebar 6 frames 00..05, greenbar 7 usable 00..06). Map value→frame with per-sprite counts:
   `frame = min(frames-1, round(pct/100 * (frames-1)))`, pad to 2 digits.
4. Before commit, verify every referenced path exists:
   `for a in <names>; do grep -q "assets/ui/$a.png" apps/web/public/assets/asset-manifest.txt && echo "OK  $a" || echo "MISSING $a"; done`
   Any MISSING line = fix the mapping now, not after commit (this caught a nonexistent bluebar_06).
5. Pixel-art rendering: `image-rendering: pixelated;` + `object-fit: contain` on `<img>`; custom cursor via `url(/assets/ui/cursor_01.png) 1 1, auto`.

## Pitfalls
- Edit tool exact-text failure: on "Could not find the exact text", READ the file region first, then re-edit with verbatim text. Guessed oldText fails (evidence: `useState(Date.now())` vs actual `useState(() => Date.now())`); re-guessing wastes round trips.
- Variant/duplicate files exist (e.g. `greenbar_06-1.png`); pick the canonical frame.
- After edits: `npx tsc --noEmit -p apps/web/tsconfig.json`, eslint, `npx prettier --write`, then `npx turbo run build --filter=@kleeblatt/web`.

## Verification
- grep loop prints OK for every referenced asset, no MISSING lines.
- tsc/eslint/prettier clean; web build succeeds.
