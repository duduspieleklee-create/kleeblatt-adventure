# Prototyp – Lokal starten (M0)

Neues Gerüst unter `apps/` und `packages/` (Node/TypeScript).  
Ältere Pfade `game/` und `game-api/` (Python/Gala) bleiben vorerst unangetastet.

## Voraussetzungen

- Node.js ≥ 20
- Docker (für Postgres + Redis)

## Setup

```bash
# Abhängigkeiten (Workspace)
npm install

# Env
cp .env.example .env

# Datenbanken
npm run db:up
```

## Entwickeln

Terminal 1 – API:

```bash
npm run dev:api
```

→ http://localhost:4000/health

Terminal 2 – Web:

```bash
npm run dev:web
```

→ http://localhost:5173  
(Proxy: `/health` und `/api` → API)

## Struktur

```
apps/
  api/          # Hono + TypeScript, GET /health
  web/          # React + Vite (+ Phaser Dependency)
packages/
  shared/       # gemeinsame Types
docs/architecture/
  20-prototyp-checkliste.md
docker-compose.yml
```

## Nächste Checkliste

Siehe [docs/architecture/20-prototyp-checkliste.md](./docs/architecture/20-prototyp-checkliste.md) – P1 Auth.
