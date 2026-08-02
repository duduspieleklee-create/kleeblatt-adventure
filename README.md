# Kleeblattadventure

2D-Browser-Adventure mit optionaler Blockchain-Ownership (Immutable zkEVM).  
Gameplay-first: Registrieren, Held, Map, Kampf, XP – NFT-Sicherung optional.

## Schnellstart

```bash
npm install
cp .env.example .env   # Variablen ausfüllen (Google OAuth, DB, etc.)
npm run db:up            # Postgres + Redis starten
npm run db:seed          # Item-Templates aus game-config.json laden (beim ersten Mal)
npm run dev:api          # API → http://localhost:4000/health
npm run dev:web          # Web → http://localhost:5173
```

**Voraussetzungen:** Node.js ≥ 20, Docker

## Monorepo-Struktur

| Pfad | Rolle |
|-------|---------|
| `apps/api` | Game API (Hono, TypeScript) |
| `apps/web` | React-Shell + Phaser |
| `packages/shared` | Gemeinsame Types |
| `docs/architecture` | Architektur-Dokumentation (00–25) |
| `game-config.json` | Alle Gameplay-Werte (Helden, Skills, Gegner, XP, Loot, Auth) |

## Wichtige Docs

| Was | Wo |
|-----|-----|
| Erster Einstieg / Lesereihenfolge | [docs/architecture/16-developer-guide.md](./docs/architecture/16-developer-guide.md) |
| Prototyp-Checkliste (P0–P7) | [docs/architecture/20-prototyp-checkliste.md](./docs/architecture/20-prototyp-checkliste.md) |
| Game-Konfiguration | [docs/architecture/21-game-config.md](./docs/architecture/21-game-config.md) + [`game-config.json`](./game-config.json) |
| Asset-Liste (Sprites) | [docs/architecture/22-asset-liste.md](./docs/architecture/22-asset-liste.md) |
| DB-Schema | [docs/architecture/23-db-schema.md](./docs/architecture/23-db-schema.md) |
| REST-API-Vertrag | [docs/architecture/24-api-contract.md](./docs/architecture/24-api-contract.md) |
| Glossar | [docs/architecture/25-glossary.md](./docs/architecture/25-glossary.md) |
| Beitragen / Setup | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Deployment | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Security | [SECURITY.md](./SECURITY.md) |
| Vollständiger Doc-Index | [docs/architecture/00-README.md](./docs/architecture/00-README.md) |

## Legacy

Ältere Experimente unter `game/` (Vite/Phaser/Gala) und `game-api/` (Python FastAPI) bleiben im Repo, sind aber **nicht** der Prototyp-Pfad.

```bash
npm run legacy:game    # alter Client
```

## Lizenz

Siehe Repository-Angaben.
