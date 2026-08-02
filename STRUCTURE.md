# Monorepo structure

```
kleeblatt-adventure/
├── apps/
│   ├── api/                      # Game API (Hono + TypeScript)
│   │   └── src/
│   │       ├── index.ts          # Process entry (serve)
│   │       ├── app.ts            # Hono app factory
│   │       ├── config/           # Env & runtime config
│   │       ├── routes/           # HTTP routers by domain
│   │       ├── middleware/       # Auth, rate-limit, …
│   │       ├── services/         # Business logic
│   │       └── lib/              # Small helpers (db client later)
│   └── web/                      # React shell + Phaser
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── pages/            # Route-level screens
│           ├── components/       # UI components
│           ├── hooks/            # React hooks
│           ├── lib/              # API client, utils
│           ├── styles/           # Global CSS
│           └── game/             # Phaser only (scenes, no direct API)
│               └── scenes/
├── packages/
│   ├── shared/                   # Types & constants shared by api + web
│   │   └── src/
│   │       ├── types/
│   │       ├── constants/
│   │       └── index.ts
│   └── tsconfig/                 # Shared TypeScript base config
├── scripts/                      # Seed, deploy helpers
├── docs/
│   ├── architecture/             # Design docs 00–25
│   └── planning/
├── game-config.json              # Gameplay values (SSOT)
├── docker-compose.yml            # Postgres + Redis
└── package.json                  # Workspaces root
```

## Conventions

| Area | Rule |
|------|------|
| Domain routes | `apps/api/src/routes/<domain>.ts` |
| Business logic | `apps/api/src/services/` – not in route handlers |
| Shared contracts | `@kleeblatt/shared` only – no duplicated types |
| Phaser | `apps/web/src/game/` – talk to React via gameBridge |
| Config values | `game-config.json` – never hard-code combat stats |

## Adding a feature (example: inventory)

1. Types in `packages/shared/src/types/`
2. Route `apps/api/src/routes/inventory.ts` + service
3. Mount in `apps/api/src/app.ts`
4. UI page/hook under `apps/web/src/`
5. Tests next to the unit under test (`*.test.ts`)
