# Deployment Guide – Kleeblatt Adventure

**Stand:** 20. August 2026  
**Stack:** TypeScript Monorepo (Hono API + React/Vite Web + Phaser 3)

---

## Übersicht

| Komponente    | Technologie                         | Port                   |
| ------------- | ----------------------------------- | ---------------------- |
| Game API      | Hono (Node.js, TypeScript)          | 4000                   |
| Web Client    | React + Vite (+ Phaser)             | 5173 (dev) / 80 (prod) |
| Datenbank     | PostgreSQL                          | 5432                   |
| Cache / Queue | Redis                               | 6379                   |
| Blockchain    | Immutable zkEVM (Testnet → Mainnet) | —                      |
| MPC / Wallet  | Turnkey (Prod) / Mock (Dev)         | —                      |

---

## Lokale Entwicklung

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:seed
npm run dev:api    # → localhost:4000
npm run dev:web    # → localhost:5173
```

---

## Stage: https://stage.kleeblatt.space/

Static **web client** + API are deployed by GitHub Actions on every push to `main`  
(workflow: [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)).

Flow: **push `main` → Actions → live at stage.kleeblatt.space**.

### 1. GitHub Secrets

Repo → Settings → Secrets and variables → Actions → Repository secrets:

| Secret                   | Example                          | Purpose                           |
| ------------------------ | -------------------------------- | --------------------------------- |
| `DEPLOY_STAGE_HOST`      | `185.47.174.207`                 | SSH host                          |
| `DEPLOY_STAGE_USER`      | `root`                           | SSH user                          |
| `DEPLOY_STAGE_PORT`      | `22`                             | SSH port                          |
| `DEPLOY_STAGE_SSH_KEY`   | _(private key PEM)_              | Deploy key (prefer no passphrase) |
| `STAGE_SESSION_SECRET`   | _(strong random string)_         | Session signing                   |
| `STAGE_DATABASE_URL`     | _(Postgres URL)_                 | Database                          |
| `STAGE_REDIS_URL`        | _(Redis URL)_                    | Cache/queue                       |
| `STAGE_GOOGLE_CLIENT_ID`     | _(OAuth client ID)_          | Google OAuth                      |
| `STAGE_GOOGLE_CLIENT_SECRET` | _(OAuth client secret)_      | Google OAuth                      |

The deploy script (`scripts/server-deploy-stage.sh`) receives these as env
vars and writes them to `apps/api/.env` on the stage server.

### 2. Server (Caddy)

The stage server uses Caddy as reverse proxy + static file server (auto TLS).
Web build is served from `/var/www/stage`; API paths (`/api`, `/auth`,
`/health`, `/me`) are reverse-proxied to `:4000`.

```bash
# Web root (rsync target)
mkdir -p /var/www/stage
```

### 3. Deploy

- **Automatic:** push/merge to `main` → workflow `Deploy Stage (kleeblatt-adventure)`
- **Manual:** Actions → **Deploy Stage (kleeblatt-adventure)** → Run workflow

---

## Full stack (Docker, optional)

When the API runs on the same host, use Docker Compose + managed Postgres/Redis as needed.

### Build

```bash
npm run build
```

### Env (Stage)

| Variable              | Wert                            |
| --------------------- | ------------------------------- |
| `NODE_ENV`            | `production`                    |
| `DATABASE_URL`        | Managed Postgres URL            |
| `REDIS_URL`           | Managed Redis URL               |
| `SESSION_SECRET`      | Strong random string            |
| `CORS_ORIGIN`         | `https://stage.kleeblatt.space` |
| `SECURE_COOKIES`      | `true`                          |

### Sicherheit

- Never commit `.env` or private keys
- TLS everywhere
- Secrets only via GitHub secrets / server env

Siehe: [SECURITY.md](./SECURITY.md)
