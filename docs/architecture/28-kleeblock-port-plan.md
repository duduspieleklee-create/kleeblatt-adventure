# 28 – Port-Plan: kleeblock-adventure → kleeblatt-adventure

**Version:** 1.0  
**Stand:** 13. August 2026  
**Branch:** `feature/port-kleeblock-game`  
**Status:** In Arbeit

---

## 1. Ziel

Das stabile Phaser-Gameplay aus [kleeblock-adventure](https://github.com/duduspieleklee-create/kleeblock-adventure) in das Monorepo **kleeblatt-adventure** integrieren, ohne die React-Shell, API, Wallet und spätere Blockchain-Features zu zerstören.

**Kein Git-Merge der Histories** – gezielter Code-/Asset-Port.

---

## 2. Festgelegte Entscheidungen

| Thema | Entscheidung |
|-------|----------------|
| Logische Auflösung | **1280 × 720** |
| Scale | `Phaser.Scale.FIT` + `CENTER_BOTH`, skaliert mit Fenster |
| Pixel-Art | `antialias: false`, `roundPixels: true` |
| React-Shell | bleibt (Wallet, Auth, Meta-UI) |
| Phaser | World + In-Game HUD/Dialog/Quest-UI aus kleeblock |
| Blockchain (Deposit/Withdraw/Mint/Stake/Approve/Swap) | **nur React** + API/Chain |
| gameBridge | einzige Client-Kommunikation Phaser ↔ React |
| Persistenz | API + Postgres (keine Bridge-DB) |
| Security | Client untrusted; API autoritativ; siehe §5 + Doc 27 |

---

## 3. Harte Pfad- und Map-Contracts (aus kleeblock)

### 3.1 Asset-URLs (relativ zu `apps/web/public/`)

Pflicht bzw. Pack-Referenzen:

```text
assets/pack.json
assets/tilesets/spr_tileset_sunnysideworld_16px.png
assets/tilemaps/island.json
assets/data/dialogues.json
assets/data/quests.json
assets/characters/sunnyside/base_idle_strip9.png
assets/characters/sunnyside/base_walk_strip8.png
assets/characters/sunnyside/base_run_strip8.png
```

Bestehende kleeblatt-Assets unter `apps/web/public/assets/` weiter nutzen; fehlende Ordner/Dateien aus kleeblock ergänzen. Character-Keys im Pack können auf vorhandene `base_*`-Strips gemappt werden, wenn kein `sunnyside/`-Unterordner gewünscht ist – **Pack und Loader müssen konsistent sein**.

### 3.2 Tiled / MapLoader

| Layer / Key | Pflicht |
|-------------|--------|
| Tilemap-Key `island` | ja |
| Tileset-Name + Image-Key `sunnyside` | ja |
| Layer `sea`, `ground`, `collision` | ja |
| `ground_decoration` / `Objects`, `paths` / `Paths` | optional |
| Object layers `objects`, `NPCSpawns`, `ItemSpawns`, `Triggers` | laut MapLoader-Contract |

Diese Namen nicht willkürlich umbenennen.

---

## 4. Ziel-Struktur unter `apps/web/src/game/`

```text
apps/web/src/game/
  config/          # GameConfig 1280×720
  maps/            # MapLoader, Walkability
  scenes/          # Boot, Preloader, Island, UI (+ legacy parallel)
  input/           # InputManager, Keyboard, Pointer, Joystick…
  managers/        # Quest, Spawn, Interaction, GameState
  objects/         # Player, NPC, Collectible…
  ui/              # QuestHUD, DialogBox, UIConstants (Phaser-UI)
  createGame.ts    # 1280×720, neue Scene-Liste
```

Alte `TownScene` / `MatchScene` können vorerst parallel bleiben und schrittweise abgelöst werden.

---

## 5. gameBridge – Rollen & Security

```text
Phaser  →  Anfragen (spend, query, remove, mint, openPanel)
React   →  Gateway zu API / Wallet (Payment-Gateway-Muster)
API+DB  →  Wahrheit
Chain   →  on-chain Wahrheit nach Verify
```

**Anti-Patterns:** Phaser macht keine API/Chain-Calls. React manipuliert keine Sprites direkt. Bridge-Events sind nie autoritativ für Gold/Items.

### 5.1 Geplante Event-Erweiterungen (Auszug)

**Phaser → React**

- `ui:requestOpen` `{ panel, … }`
- `economy:request` `{ requestId, action, currency, amount, reason }`
- `inventory:query` / `inventory:requestRemove` `{ requestId, … }`
- `mint:request` `{ requestId, itemId }`

**React → Phaser**

- `economy:result` / `inventory:queryResult` / `inventory:removeResult` / `mint:result` `{ requestId, success, … }`
- `react:panelClosed`, `react:txResult`
- bestehend: `inventory:hydrate`, `inventory:updated`, `pause` / `resume`

`requestId` = Idempotency-Key (siehe [27-idempotency-keys.md](./27-idempotency-keys.md)).

### 5.2 Blockchain später

Deposit / Withdraw / Mint / Stake / Approve / Swap = React-Panels. Phaser triggert nur Open/Request und konsumiert Result + `inventory:updated`.

---

## 6. Phasen

### Phase A – Game-Port (dieser Branch)

1. Assets: `pack.json`, `island.json`, data, Character-Pfade angleichen
2. MapLoader + Walkability portieren
3. Boot / Preloader / Island / UI-Scenes (angepasst an Bridge)
4. Input + Managers + Objects
5. `createGame.ts` → 1280×720 + Scene-Registrierung
6. Minimale Bridge-Anbindung (hydrate, pause, scene:ready)

### Phase B – CI / Deploy

- `ci.yml`: typecheck/lint deckt neue `src/game/**` ab; optional Asset-Integrity-Check
- `deploy-game.yml`: Verify um kritische Game-Assets erweitern (`pack.json`, `island.json`, Tileset)

### Phase C – Aufräumen

- Legacy-Scenes ersetzen oder entfernen
- Bridge-Events typisieren (weniger `Loose`)
- Idempotency-Keys in API implementieren (Doc 27)

---

## 7. GitHub-Workflows (nach dem Port anpassen)

| Workflow | Anpassung |
|----------|-----------|
| `ci.yml` | Game-Pfade, ggf. asset check |
| `deploy-game.yml` | Artifact-/Asset-Verify für Map/Pack |
| übrige | weitgehend unverändert |

---

## 8. Done-Kriterien (Phase A Minimum)

- [ ] Game bootet im React-Container mit 1280×720 FIT
- [ ] Island-Map lädt (sea/ground/collision)
- [ ] Player-Movement (Keyboard + optional Pointer)
- [ ] Keine direkten API-Calls aus Phaser
- [ ] Logout/Unmount zerstört Phaser sauber; Re-Login hydrated State über React
- [ ] Docs 27 + 28 committed; Branch `feature/port-kleeblock-game`

---

## 9. Quellen

- kleeblock: `AI_CONTEXT.md`, `public/assets/pack.json`, `src/maps/MapLoader.ts`, Scenes
- kleeblatt: `docs/architecture/14-phaser-react-bridge.md`, `packages/shared/src/gameBridge.ts`, `apps/web/src/game/`
