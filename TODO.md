# Kleeblatt Adventure — Phase 2 Implementation Todo

Created: 2026-07-26 | Session: 11:02 UTC

---

## Overview

Daily ranking system + on-chain Kleeblatt Coins (KLB) on GalaChain testnet.
Top 10 players each day receive KLB coins → cumulative on-chain Leaderpoints ranking.

---

## Step 1: DB + Daily Leaderboard Endpoint ✅

- [x] Add `total_points` column to `users` table, auto-incremented on score submit
- [x] Add `daily_awards` table: `id, user_id, date, rank, coins_awarded, tx_hash`
- [x] Add `GET /api/game/daily-leaderboard?date=YYYY-MM-DD` endpoint
- [x] Update `POST /api/game/score` to also increment `users.total_points`
- [x] Update `GET /api/game/profile` to include `total_points` field
- [x] Add schemas: `DailyLeaderboardEntry`, `DailyAwardResponse`

---

## Step 2: GalaChain KleeblattCoin Chaincode + Node.js Mint Service ✅

- [x] Create `game-api/chaincode/kleeblattcoin/` directory with template chaincode
- [x] Create `game-api/chaincode/server.mjs` — Express on port 8002 (mint-coins, mint-batch, health)
- [x] Package.json with `@gala-chain/connect`, `express`
- [ ] Deploy chaincode to testnet: `galachain deploy --network=gc-testnet` *(requires testnet access)*

---

## Step 3: Daily Cron Job — Award Top 10 ✅

- [x] Create `game-api/daily_awards.py` — runs at midnight UTC
- [x] Systemd service + timer: `daily-awards.service` + `daily-awards.timer`
- [x] Add `/api/game/leaderpoints` endpoint (DB-based, aggregates daily_awards)
- [ ] Test daily award flow end-to-end on testnet *(requires chaincode deployed)*

---

## Step 4: Frontend — Daily Leaderboard + Total Points ✅

- [x] Update `game/src/api.js` — getDailyLeaderboard, getLeaderpoints, getDailyAwards
- [x] Create `game/src/DailyLeaderboard.js` — tabs: Daily / Leaderpoints
- [x] Update `game/src/game-core.js` — Total/Today points HUD, Leaderboard button in settings
- [x] Build, deploy

---

## Step 5: Deployment & Integration ✅

- [x] Systemd units created and enabled (daily-awards.timer, service)
- [x] GitHub Actions updated to deploy chaincode + restart services
- [x] Systemd timer enabled, runs daily at midnight UTC
- [ ] Caddy route for `/api/chain/*` — not needed yet (leaderpoints uses DB)
- [ ] GALA_PRIVATE_KEY + GALA_CHAINCODE_URL secrets — manual prerequisites

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
