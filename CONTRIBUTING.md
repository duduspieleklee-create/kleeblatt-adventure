# Contributing to Kleeblattadventure

**Stand:** 3. August 2026  
**Stack:** TypeScript Monorepo (Hono + React/Vite + Phaser 3)

---

## Voraussetzungen

- **Node.js ≥ 20** (nicht v18)
- **Docker** (für Postgres + Redis)
- **Git**
- Ein Google OAuth-Projekt (für Auth) – siehe [game-config.json](./game-config.json) → `auth`

## Erster Setup

```bash
# Repo klonen
git clone https://github.com/duduspieleklee-create/kleeblatt-adventure.git
cd kleeblatt-adventure

# Abhängigkeiten installieren (Workspace)
npm install

# Env-Datei erstellen
cp .env.example .env
# → Variablen ausfüllen (siehe .env.example Kommentare)

# Datenbanken starten (Postgres + Redis)
npm run db:up

# API starten (Terminal 1)
npm run dev:api    # → http://localhost:4000/health

# Web starten (Terminal 2)
npm run dev:web    # → http://localhost:5173
```

## Monorepo-Struktur

```
apps/
  api/          # Game API (Hono, TypeScript, Port 4000)
  web/          # React-Shell + Phaser (Vite, Port 5173)
packages/
  shared/       # Gemeinsame Types (Item-States, RuleEngine-Interfaces)
docs/
  architecture/ # Architektur-Dokumentation (00–25)
game/           # Legacy (Vite/Phaser/Gala) – nicht aktiv verwenden
game-api/       # Legacy (Python FastAPI) – nicht aktiv verwenden
```

**Wichtig:** `game/` und `game-api/` sind veraltete Experimente. Der aktive Entwicklungspfad ist `apps/` und `packages/`.

## Architektur-Docs lesen

Bevor du Code schreibst, lies mindestens:

1. [16-developer-guide.md](./docs/architecture/16-developer-guide.md) – Stack, MVP-Build-Order
2. [20-prototyp-checkliste.md](./docs/architecture/20-prototyp-checkliste.md) – P0–P7 Phasen
3. [21-game-config.md](./docs/architecture/21-game-config.md) – Game-Konfiguration
4. [17-mvp-gameplay.md](./docs/architecture/17-mvp-gameplay.md) – Klassen, Skills, Map
5. [19-phaser-rule-engine.md](./docs/architecture/19-phaser-rule-engine.md) – Combat-Types

Vollständiger Index: [docs/architecture/00-README.md](./docs/architecture/00-README.md)

## Coding Standards

### TypeScript

- **Strict Mode** in allen `tsconfig.json` Dateien
- Explizite Typen für alle öffentlichen Funktionen
- Interfaces für Datenstrukturen, Type für Unions
- `import type` für reine Typ-Importe
- Kein `any` – wenn nötig `unknown` + Type Guard

### Datei-Organisation

- Eine Komponente/Klasse pro Datei
- `kebab-case` für Dateinamen (`hero-controller.ts`, `enemy-ai.ts`)
- `PascalCase` für Klassen/Interfaces (`EnemyStats`, `RuleEngine`)
- `camelCase` für Funktionen/Variablen

### React (apps/web)

- Funktionale Komponenten, keine Class-Components
- Custom Hooks für wiederverwendbare Logik (`useGameBridge`, `useInventory`)
- CSS Modules oder Tailwind (Team-Wahl, aber einheitlich)

### API (apps/api)

- Hono-Router gruppieren nach Domain (`/auth`, `/hero`, `/inventory`, `/match`)
- Controller/Handler dünne Schicht → Business-Logik in Services
- Input-Validierung mit Zod oder Valibot
- Fehler als strukturiertes JSON (`{ error: { code, message, retryable } }`)

### Phaser (in apps/web)

- Eine Scene pro Spiel-Zustand (`BootScene`, `MatchScene`)
- `gameBridge` für Kommunikation mit React (siehe [14-phaser-react-bridge.md](./docs/architecture/14-phaser-react-bridge.md))
- Keine direkten API-Calls aus Phaser – über React/Proxy
- Stats aus `game-config.json`, nicht hardcodiert

## Git-Workflow

### Branch-Strategie

```bash
# Feature-Branch von main
git checkout -b feat/hero-creation

# Prefixe: feat:, fix:, chore:, docs:, refactor:, test:
```

### Commit-Messages

Conventional Commits:

```
feat: add hero creation API endpoint
fix: resolve enemy leash not resetting HP
chore: bump dependencies
docs: update API contract for inventory
refactor: extract loot-roll logic to service
test: add unit tests for rule engine
```

### Pull Request

1. Branch pushen
2. PR mit Beschreibung: Was, Warum, Wie testen
3. PR-Template ausfüllen (falls vorhanden)
4. Mindestens ein Review vor Merge
5. Squash-Merge in `main`

## Testing

| Ebene | Tool | Was |
|-------|------|-----|
| Unit | Vitest oder Jest | RuleEngine (ohne Phaser), Services, Helper |
| Integration | Vitest + Supertest | API-Endpunkte mit Test-DB |
| E2E | Manual (später Playwright) | Demo-Skript aus [20-prototyp-checkliste.md](./docs/architecture/20-prototyp-checkliste.md) |

```bash
# Tests ausführen
npm test              # alle
npm test -w @kleeblatt/api    # nur API
npm test -w @kleeblatt/web    # nur Web
```

## PR-Checkliste

- [ ] Code folgt Coding Standards
- [ ] Tests geschrieben/aktualisiert
- [ ] `npm run build` erfolgreich
- [ ] Keine Secrets in Code/Commits
- [ ] Docs aktualisiert falls nötig
- [ ] PR-Beschreibung erklärt Was + Warum

## Env-Variablen

Alle Variablen sind in [`.env.example`](./.env.example) dokumentiert.  
**Nie** echte Secrets committen. `.env` ist in `.gitignore`.

## Fragen?

- GitHub Issues für Bugs und Feature-Requests
- Architektur-Docs unter `docs/architecture/` für Design-Entscheidungen
- [12-pattern-zusammenfassung.md](./docs/architecture/12-pattern-zusammenfassung.md) für das große Bild
