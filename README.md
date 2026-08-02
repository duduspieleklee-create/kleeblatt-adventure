# Kleeblattadventure

2D-Browser-Adventure mit optionaler Blockchain-Ownership (Immutable zkEVM).  
Gameplay-first: Registrierung, Held, Map, Kampf, XP – NFT-Sicherung optional.

## Prototyp (aktueller Dev-Pfad)

```bash
npm install
cp .env.example .env
npm run db:up      # Postgres + Redis
npm run dev:api    # :4000
npm run dev:web    # :5173
```

Details: **[PROTOTYPE.md](./PROTOTYPE.md)**  
Checkliste: **[docs/architecture/20-prototyp-checkliste.md](./docs/architecture/20-prototyp-checkliste.md)**  
Architektur: **[docs/architecture/16-developer-guide.md](./docs/architecture/16-developer-guide.md)**

### Monorepo

| Pfad | Rolle |
|------|--------|
| `apps/api` | Game API (Hono, TypeScript) |
| `apps/web` | React-Shell + später Phaser |
| `packages/shared` | Gemeinsame Types |
| `docs/architecture` | Design-Docs |

## Legacy

Ältere Experimente unter `game/` (Vite/Phaser/Gala) und `game-api/` (Python FastAPI) bleiben im Repo, sind aber **nicht** der Prototyp-Pfad.

```bash
npm run legacy:game   # alter Client
```

## License

Siehe Repository-Angaben.
