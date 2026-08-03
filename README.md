# Kleeblatt Adventure

2D browser adventure with optional blockchain ownership (Immutable zkEVM).
Gameplay-first: register, hero, map, combat, XP – NFT securing is optional.

## Quick start

```bash
npm install
cp .env.example .env   # fill in variables (Google OAuth, DB, etc.)
npm run db:up          # start Postgres + Redis
npm run db:seed        # load item templates from game-config.json (first run)
npm run dev:api        # API → http://localhost:4000/health
npm run dev:web        # Web → http://localhost:5173
```

**Requirements:** Node.js ≥ 20, Docker  
**Task runner:** [Turborepo](https://turbo.build) (local build cache + parallel tasks)

## Scripts

| Command                                 | Description                              |
| --------------------------------------- | ---------------------------------------- |
| `npm run dev` / `dev:api` / `dev:web`   | Dev servers (Turbo, parallel)            |
| `npm run build`                         | Build all packages (cached, topological) |
| `npm run typecheck`                     | TypeScript check via Turbo               |
| `npm run lint` / `lint:fix`             | ESLint (per package)                     |
| `npm run format` / `format:check`       | Prettier                                 |
| `npm test`                              | Vitest via Turbo                         |
| `npm run db:up` / `db:down` / `db:seed` | Docker DB + seed                         |

## Monorepo layout

| Path                | Role                                                          |
| ------------------- | ------------------------------------------------------------- |
| `apps/api`          | Game API (Hono) – routes / services / config                  |
| `apps/web`          | React shell + Phaser (`src/game`)                             |
| `packages/shared`   | Shared types & constants (`@kleeblatt/shared`)                |
| `packages/tsconfig` | Shared TypeScript base config                                 |
| `scripts/`          | Seed & deploy helpers                                         |
| `docs/architecture` | Architecture docs (00–25)                                     |
| `game-config.json`  | All gameplay values (heroes, skills, enemies, XP, loot, auth) |

Full tree: [STRUCTURE.md](./STRUCTURE.md)

## Important docs

| What                        | Where                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| First steps / reading order | [docs/architecture/16-developer-guide.md](./docs/architecture/16-developer-guide.md)                                    |
| Prototype checklist (P0–P7) | [docs/architecture/20-prototyp-checkliste.md](./docs/architecture/20-prototyp-checkliste.md)                            |
| Game configuration          | [docs/architecture/21-game-config.md](./docs/architecture/21-game-config.md) + [`game-config.json`](./game-config.json) |
| Asset list (sprites)        | [docs/architecture/22-asset-liste.md](./docs/architecture/22-asset-liste.md)                                            |
| DB schema                   | [docs/architecture/23-db-schema.md](./docs/architecture/23-db-schema.md)                                                |
| REST API contract           | [docs/architecture/24-api-contract.md](./docs/architecture/24-api-contract.md)                                          |
| Glossary                    | [docs/architecture/25-glossary.md](./docs/architecture/25-glossary.md)                                                  |
| Contributing / setup        | [CONTRIBUTING.md](./CONTRIBUTING.md)                                                                                    |
| Deployment                  | [DEPLOYMENT.md](./DEPLOYMENT.md)                                                                                        |
| Security                    | [SECURITY.md](./SECURITY.md)                                                                                            |
| Full doc index              | [docs/architecture/00-README.md](./docs/architecture/00-README.md)                                                      |

## License

See repository metadata.
