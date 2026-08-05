# Contributing to Kleeblatt Adventure

**Updated:** 3 August 2026  
**Stack:** TypeScript monorepo (Hono + React/Vite + Phaser 4

---

## Prerequisites

- **Node.js ≥ 20** (not v18)
- **Docker** (Postgres + Redis)
- **Git**
- A Google OAuth project (for auth) – see [game-config.json](./game-config.json) → `auth`

## First-time setup

```bash
git clone https://github.com/duduspieleklee-create/kleeblatt-adventure.git
cd kleeblatt-adventure

npm install

cp .env.example .env
# → fill variables (see .env.example comments)

npm run db:up
npm run db:seed

# Terminal 1
npm run dev:api    # → http://localhost:4000/health

# Terminal 2
npm run dev:web    # → http://localhost:5173
```

## Monorepo structure

```
apps/
  api/src/
    routes/ services/ middleware/ config/ lib/
  web/src/
    pages/ components/ hooks/ lib/ styles/ game/scenes/
packages/
  shared/src/types/ constants/
  tsconfig/                 # shared TS base
docs/architecture/          # 00–25
scripts/
```

Details: [STRUCTURE.md](./STRUCTURE.md). Active path: `apps/` + `packages/` only.

## Architecture docs (read before coding)

1. [16-developer-guide.md](./docs/architecture/16-developer-guide.md) – stack, MVP build order
2. [20-prototyp-checkliste.md](./docs/architecture/20-prototyp-checkliste.md) – P0–P7 phases
3. [21-game-config.md](./docs/architecture/21-game-config.md) – game configuration
4. [17-mvp-gameplay.md](./docs/architecture/17-mvp-gameplay.md) – classes, skills, map
5. [19-phaser-rule-engine.md](./docs/architecture/19-phaser-rule-engine.md) – combat types

Full index: [docs/architecture/00-README.md](./docs/architecture/00-README.md)

## Coding standards

### TypeScript

- **Strict mode** in all `tsconfig.json` files
- Explicit types on public functions
- Interfaces for data structures, type for unions
- `import type` for type-only imports
- No `any` – use `unknown` + type guards when needed

### File organisation

- One component/class per file
- `kebab-case` file names (`hero-controller.ts`, `enemy-ai.ts`)
- `PascalCase` for classes/interfaces (`EnemyStats`, `RuleEngine`)
- `camelCase` for functions/variables

### React (`apps/web`)

- Functional components only
- Custom hooks for reusable logic (`useGameBridge`, `useInventory`)
- CSS Modules or Tailwind – pick one style and stay consistent

### API (`apps/api`)

- Hono routers grouped by domain (`/auth`, `/hero`, `/inventory`, `/match`)
- Thin handlers → business logic in services
- Input validation with Zod or Valibot
- Errors as structured JSON (`{ error: { code, message, retryable } }`)

### Phaser (in `apps/web`)

- One scene per game state (`BootScene`, `MatchScene`)
- `gameBridge` for React communication (see [14-phaser-react-bridge.md](./docs/architecture/14-phaser-react-bridge.md))
- No direct API calls from Phaser – go through React/proxy
- Stats from `game-config.json`, never hard-coded

## Git workflow

### Branch strategy

```bash
git checkout -b feat/hero-creation
# Prefixes: feat/, fix/, chore/, docs/, refactor/, test/
```

### Commit messages

Conventional Commits:

```
feat: add hero creation API endpoint
fix: resolve enemy leash not resetting HP
chore: bump dependencies
docs: update API contract for inventory
refactor: extract loot-roll logic to service
test: add unit tests for rule engine
```

### Pull request

1. Push branch
2. Open PR with what / why / how to test
3. Fill PR template
4. At least one review before merge
5. Squash-merge into `main`

## Testing & quality

| Layer       | Tool                      | Scope                                                                                       |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| Unit        | Vitest                    | RuleEngine (no Phaser), services, helpers                                                   |
| Integration | Vitest + API client       | Endpoints with test DB                                                                      |
| E2E         | Manual (later Playwright) | Demo script from [20-prototyp-checkliste.md](./docs/architecture/20-prototyp-checkliste.md) |
| Lint        | ESLint                    | All TS/JS                                                                                   |
| Format      | Prettier                  | All supported files                                                                         |

```bash
npm test                 # all tests
npm run lint             # ESLint
npm run format:check     # Prettier check
npm run typecheck        # TypeScript build
npm run build            # full monorepo build
```

## PR checklist

- [ ] Code follows coding standards
- [ ] Tests written/updated
- [ ] `npm run build` succeeds
- [ ] `npm run lint` clean
- [ ] No secrets in code/commits
- [ ] Docs updated if needed
- [ ] PR description explains what + why

## Environment variables

All variables are documented in [`.env.example`](./.env.example).  
**Never** commit real secrets. `.env` is in `.gitignore`.

## Questions?

- GitHub Issues for bugs and feature requests
- Architecture docs under `docs/architecture/` for design decisions
- [12-pattern-zusammenfassung.md](./docs/architecture/12-pattern-zusammenfassung.md) for the big picture
