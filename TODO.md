# Kleeblatt Adventure — Phase 2 Implementation Todo

Created: 2026-07-26 | Session: 11:02 UTC

---

## Overview

Daily ranking system + on-chain Kleeblatt Coins (KLB) on GalaChain testnet.
Top 10 players each day receive KLB coins → cumulative on-chain Leaderpoints ranking.

---

## Step 1: DB + Daily Leaderboard Endpoint

- [ ] Add `total_points` column to `users` table, auto-incremented on score submit
- [ ] Add `daily_awards` table: `id, user_id, date, rank, coins_awarded, tx_hash`
- [ ] Add `GET /api/game/daily-leaderboard?date=YYYY-MM-DD` endpoint
  - Groups `game_scores` by user for given date, returns top 50
  - Each entry: `{ rank, username, points_today }`
- [ ] Update `POST /api/game/score` to also increment `users.total_points`
- [ ] Update `GET /api/game/profile` to include `total_points` field
- [ ] Add schemas: `DailyLeaderboardEntry`, `DailyAwardResponse`

**Files:** `game-api/models.py`, `game-api/schemas.py`, `game-api/routers/game.py`

---

## Step 2: GalaChain KleeblattCoin Chaincode + Node.js Mint Service

- [ ] Create `game-api/chaincode/kleeblattcoin/` directory with template chaincode
  - Token class: `KleeblattCoin` (KLB), fungible, infinite supply
- [ ] Create `game-api/chaincode/server.mjs` — Express on port 8002
  - `POST /mint-coins` — mints KLB to winner's wallet via `TokenApi.MintToken`
  - `GET /leaderpoints` — queries chain for KLB balances, returns ranked list
- [ ] Package.json with `@gala-chain/connect`, `@gala-chain/chaincode`, `express`
- [ ] Tests: mint coins locally, verify balances
- [ ] Deploy chaincode to testnet: `galachain deploy --network=gc-testnet`

**Files:** `game-api/chaincode/kleeblattcoin/`, `game-api/chaincode/server.mjs`, `game-api/chaincode/package.json`

---

## Step 3: Daily Cron Job — Award Top 10

- [ ] Create `game-api/daily_awards.py` — runs at midnight UTC
  - Queries top 10 users by `SUM(score)` for past 24 hours from `game_scores`
  - Award amounts: 1st=100 KLB, 2nd=80, 3rd=60, 4th=50, 5th=40, 6th=30, 7th=20, 8th=15, 9th=10, 10th=5
  - Calls `POST http://127.0.0.1:8002/mint-coins` for each winner
  - Inserts into `daily_awards` table with `tx_hash`
- [ ] Systemd timer: `game-api-daily-awards.timer` → runs `daily_awards.py` at 00:00 UTC
- [ ] Systemd service: `game-api-daily-awards.service`
- [ ] Add `POST /api/game/award-daily` as manual trigger (admin only for testing)
- [ ] Add `/api/game/leaderpoints` endpoint — proxies to Node.js service → chain

**Files:** `game-api/daily_awards.py`, `game-api-daily-awards.service`, `game-api-daily-awards.timer`

---

## Step 4: Frontend — Daily Leaderboard + Total Points

- [ ] Update `game/src/api.js`
  - `getDailyLeaderboard(date)` — calls `/api/game/daily-leaderboard`
  - `getLeaderpoints()` — calls `/api/game/leaderpoints`
- [ ] Create `game/src/DailyLeaderboard.js` — Phaser scene overlay
  - Tabs: "Today" / "Leaderpoints"
  - Today: rank, username, points today, KLB coin icon for top 10
  - Leaderpoints: all-time KLB coin ranking from chain
  - Highlights current player
- [ ] Update `game/src/game-core.js`
  - HUD: add "Today: N" points counter below score
  - HUD: show `total_points` next to username
  - Settings: add "Leaderboard" button → opens DailyLeaderboard overlay
- [ ] Build, deploy

**Files:** `game/src/api.js`, `game/src/DailyLeaderboard.js`, `game/src/game-core.js`

---

## Step 5: Deployment & Integration

- [ ] Systemd units: `chaincode.service` on :8002
- [ ] Caddy: route `/api/chain/*` to `127.0.0.1:8002`
- [ ] GitHub Actions: deploy chaincode directory + restart chaincode service
- [ ] Environment: `GALA_PRIVATE_KEY`, `GALA_CHAINCODE_URL` in GitHub secrets
- [ ] Test daily award flow end-to-end on testnet
- [ ] Verify `https://game.kleeblatt.space/` shows new features

**Files:** `.github/workflows/deploy.yml`, `/etc/caddy/Caddyfile`, `.env`

---

## Prerequisites (Manual)

- [ ] Obtain GalaChain testnet access via [GalaChain Discord](https://discord.gg/galachain)
- [ ] Generate publisher wallet: `WalletUtils.createRandom()` → store private key
- [ ] Deploy chaincode to testnet via `galachain deploy`
- [ ] Add `GALA_PRIVATE_KEY` GitHub secret

---

## Architecture

```
[Game Browser]
     │
     ▼
[Caddy]
  ├── /api/*          → Python FastAPI :8001 (daily ranking, scores)
  ├── /api/chain/*    → Node.js :8002 (mint coins, leaderpoints query)
  └── /*              → Static files
    
[Python :8001]
  ├── PostgreSQL game_db (users, scores, daily_awards)
  ├── daily_awards.py (cron at midnight)
  └── chaincode_client.py → Node.js service

[Node.js :8002]
  ├── SigningClient(privateKey) + TokenApi
  └── → GalaChain testnet gateway
```
