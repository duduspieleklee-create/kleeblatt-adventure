# Deployment Guide – Kleeblattadventure

**Stand:** 3. August 2026  
**Stack:** TypeScript Monorepo (Hono API + React/Vite Web + Phaser 3)

---

## Übersicht

| Komponente | Technologie | Port |
|------------|-------------|------|
| Game API | Hono (Node.js, TypeScript) | 4000 |
| Web Client | React + Vite (+ Phaser) | 5173 (dev) / 80 (prod) |
| Datenbank | PostgreSQL | 5432 |
| Cache / Queue | Redis | 6379 |
| Blockchain | Immutable zkEVM (Testnet → Mainnet) | — |
| MPC / Wallet | Turnkey (Prod) / Mock (Dev) | — |

---

## Lokale Entwicklung

```bash
# 1. Dependencies
npm install

# 2. Env
cp .env.example .env
# → Variablen ausfüllen

# 3. DB + Redis starten
npm run db:up

# 4. Seed (Item-Templates aus game-config.json)
npm run db:seed

# 5. API + Web starten
npm run dev:api    # → localhost:4000
npm run dev:web    # → localhost:5173
```

---

## Production Deployment

### Voraussetzungen

- Docker & Docker Compose
- Domain + TLS (z. B. via Caddy, Nginx oder Cloudflare)
- Managed PostgreSQL (z. B. Neon, Supabase, RDS)
- Managed Redis (z. B. Upstash, Redis Cloud, ElastiCache)
- Google OAuth Credentials (Production Redirect-URI)
- Turnkey Account (für echte Wallets, ab M2 ohne Mock)

### 1. Build

```bash
# Alle Pakete bauen
npm run build

# Web (statische Dateien nach apps/web/dist/)
npm run build:web

# API (nach apps/api/dist/)
npm run build:api
```

### 2. Docker Images

```dockerfile
# apps/api/Dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --production
COPY . .
RUN npm run build -w @kleeblatt/shared && npm run build -w @kleeblatt/api
EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
```

```dockerfile
# apps/web/Dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci
COPY . .
RUN npm run build -w @kleeblatt/shared && npm run build -w @kleeblatt/web

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
```

### 3. Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: "3.9"
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "4000:4000"
    env_file: .env
    depends_on:
      - db
      - redis
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "80:80"
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  pgdata:
```

### 4. Deploy

```bash
# Production env setzen
export NODE_ENV=production

# Build + Start
docker compose -f docker-compose.prod.yml up -d --build

# Migrations laufen lassen
docker compose exec api npm run db:migrate

# Seed (nur beim ersten Mal)
docker compose exec api npm run db:seed
```

### 5. Health Check

```bash
curl https://api.yourdomain.com/health
# → { "status": "ok" }
```

---

## Environment (Production)

| Variable | Wert |
|----------|------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Managed Postgres URL |
| `REDIS_URL` | Managed Redis URL |
| `GOOGLE_CLIENT_ID` | Production OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Production OAuth Secret |
| `GOOGLE_CALLBACK_URL` | `https://api.yourdomain.com/auth/google/callback` |
| `SESSION_SECRET` | Starker zufälliger String |
| `CORS_ORIGIN` | `https://yourdomain.com` |
| `WALLET_PROVIDER` | `turnkey` (nicht `mock`) |
| `SECURE_COOKIES` | `true` (Cookie Secure-Flag) |

---

## CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml (Skizze)
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Build Docker images
        run: docker compose -f docker-compose.prod.yml build
      - name: Deploy
        run: |
          # Push images to registry
          # SSH to server and pull + restart
          # Or use Fly.io / Railway / AWS deploy
```

Secrets in GitHub: `DB_PASSWORD`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, etc.

---

## Rollback

```bash
# Zur vorherigen Version zurückkehren
docker compose -f docker-compose.prod.yml down
docker tag kleeblatt-api:previous kleeblatt-api:latest
docker compose -f docker-compose.prod.yml up -d
```

Bei DB-Migration-Rollback: ORM-spezifisch (`drizzle-kit drop` / `prisma migrate resolve --rolled-back`).

---

## Plattform-Optionen

| Plattform | Vorteil | Kosten |
|-----------|---------|--------|
| **Fly.io** | Einfach, Docker-native, Edge | Günstig |
| **Railway** | Sehr einfach, Auto-Deploy | Mittel |
| **AWS ECS/Fargate** | Vollkontrolle, Skalierung | Mittel-Hoch |
| **Hetzner + Docker** | Günstig, selbst verwaltet | Günstig |

Empfehlung Prototyp: **Fly.io** oder **Railway** für API + Web, **Neon** für Postgres, **Upstash** für Redis.

---

## Sicherheitshinweise

- Nie `.env` committen
- Production-Cookies: `Secure=true`, `SameSite=Strict` oder `Lax`
- TLS/HTTPS überall
- Rate-Limiting auf Auth-Endpunkten
- Secrets über Platform-Secret-Manager, nicht in Image
- DB-Backups regelmäßig

Siehe: [SECURITY.md](./SECURITY.md)
