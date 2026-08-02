# 20 – Prototyp-Checkliste

**Version:** 1.0  
**Stand:** 3. August 2026  
**Ziel:** Erster spielbarer Vertical Slice – ohne echten MPC/Mint/Hub

---

## Definition of Done (Prototyp)

- [ ] Login (eine Auth-Methode)
- [ ] Heldenname + Klasse wählen → Starter-Gear im Inventar
- [ ] Abenteuer: Map, WASD, Mauszielen, angreifen
- [ ] Mind. 1 Gegner-Typ (Bruiser), Tod → Respawn an Spawn
- [ ] XP + Level sichtbar
- [ ] ≥1 Lootkiste → Item ins Inventar → anlegbar
- [ ] Optional: Mock-„Sichern“ setzt nur DB-State `secured`

**Nicht nötig für diesen Prototyp:** Colyseus, Immutable-Mint, Fiat, Claim, Stake, alle Skills/Enemies.

---

## Festlegungen (vor/während Slice)

| Thema | Prototyp-Entscheidung |
|-------|------------------------|
| Input | **WASD + Mauszielen** |
| Tod | **HP ≤ 0 → 3 s Delay → Respawn am Map-Spawn, XP behalten** |
| Session | Sandbox (kein Mission-Win) |
| Wallet | **Mock** (eine Adresse pro User, kein MPC) |
| Credits/Mint | Dev-Button / Mock-State optional |

---

## Checkliste nach Phasen

### P0 – Gerüst

- [ ] Monorepo: `apps/web`, `apps/api`
- [ ] TypeScript + Lint in beiden Apps
- [ ] Docker Compose: Postgres + Redis
- [ ] `.env.example` (DATABASE_URL, REDIS_URL, SESSION_SECRET)
- [ ] API `GET /health` → 200
- [ ] Web startet (Vite) und kann API erreichen (Proxy oder CORS)

**Done:** `compose up` + api + web lokal ohne Handarbeit an der DB.

---

### P1 – Auth (minimal)

- [ ] Eine Login-Methode (E-Mail-Magic **oder** Google – eine reicht)
- [ ] Tabelle `users` (id, created_at, …)
- [ ] Session (Cookie oder Bearer JWT)
- [ ] `GET /me` geschützt
- [ ] Logout
- [ ] Unauth → 401 auf geschützten Routen

**Done:** Login → `/me` liefert `userId`.

---

### P2 – Held + Starter-Gear

- [ ] UI: Heldenname eingeben (Validierung: Länge/Zeichen)
- [ ] UI: Klasse wählen `mage` | `ranged` | `melee`
- [ ] API: Held anlegen/speichern (einmalig pro User im Prototyp)
- [ ] Felder: `hero_name`, `class`, `level`, `xp`
- [ ] Beim Anlegen: Starter-Items in `items` (State `web2`)
- [ ] `GET /inventory` listet Starter-Gear
- [ ] Verhindert zweiten Helden (oder „bereits erstellt“)

**Done:** Nach Reg Name/Klasse → Inventar zeigt Starter-Rüstung.

---

### P3 – Mock-Wallet (optional parallel)

- [ ] Tabelle `wallets` (user_id, address, status)
- [ ] `ensure`: pro User eine stabile Mock-Adresse
- [ ] `/me` oder `/wallet` liefert Adresse
- [ ] Idempotent

**Done:** Jeder User hat eine Adresse (auch wenn noch niemand mintet).

---

### P4 – Phaser Match-Shell

- [ ] React-Page mit Phaser-Container
- [ ] `gameBridge` anbinden ([14](./14-phaser-react-bridge.md))
- [ ] BootScene: Platzhalter-Assets laden
- [ ] MatchScene: Map (Farbe/Tilemap) + Spawn-Punkt
- [ ] Spieler-Sprite, **WASD**-Bewegung, Blickrichtung zur Maus
- [ ] Button/React: „Abenteuer starten“ → `match:start`
- [ ] Pause optional

**Done:** Held läuft auf der Map, steuerbar.

---

### P5 – Combat minimal

- [ ] Basisangriff (LMB): Cone oder kurzes Projektil je Klasse-Platzhalter
- [ ] RuleEngine stub: `basic_attack` + `enemy_melee` ([19](./19-phaser-rule-engine.md))
- [ ] Spieler-HP (Zahl/Bar in Phaser oder React)
- [ ] 1 Enemy-Typ **Bruiser** spawnen ([18](./18-enemy-ai.md))
- [ ] Enemy: idle → chase → attack
- [ ] Spieler kann Enemy töten
- [ ] Spieler HP ≤ 0 → 3 s → Respawn Spawn, HP voll, XP behalten

**Done:** Kampf fühlt sich an (töten / sterben / wiederkommen).

---

### P6 – XP & Level

- [ ] Enemy-Tod → XP (lokal in Session + API-Persistenz)
- [ ] Level-Up bei Schwelle (feste einfache Tabelle, z. B. 100 XP → Level 2)
- [ ] Anzeige Level/XP im HUD
- [ ] Level speichern in DB (`heroes` / user profile)

**Done:** Nach mehreren Kills steigt Level und bleibt nach Reload.

---

### P7 – Lootkiste & Inventar

- [ ] ≥1 Kiste auf der Map (Interaktion: Nähe + Taste oder Klick)
- [ ] Öffnen → API oder lokaler Grant → Item in DB
- [ ] Inventar-UI aktualisiert sich
- [ ] Item anlegbar (Slot: z. B. `chest` / `weapon`)
- [ ] Loadout wirkt wenigstens auf **eine** Zahl (z. B. `atk` oder maxHp) im nächsten Kampf

**Done:** Kiste → Item → anlegen → spürbarer Effekt.

---

### P8 – Feinschliff Prototyp (optional)

- [ ] Zweiter Enemy-Spawn
- [ ] Skill Q nur für gewählte Klasse (eine Fähigkeit)
- [ ] Mock-Secure: Button setzt `state = secured` (keine Chain)
- [ ] Analytics-Events minimal: `reg_completed`, `match_started`, `first_kill`
- [ ] README: „How to run the prototype“

---

## Explizit später (nicht abhaken für Prototyp)

- [ ] Echter MPC / Immutable Mint
- [ ] BullMQ Mint-Worker
- [ ] Activate/Stake
- [ ] Claim
- [ ] Colyseus Hub
- [ ] Fiat-Payments
- [ ] Alle Skills + alle 3 Enemy-Typen poliert
- [ ] Tiled-Endcontent / Art-Pass

---

## Reihenfolge (empfohlen)

```
P0 Gerüst
 → P1 Auth
 → P2 Held + Starter
 → P3 Mock-Wallet (parallel ok)
 → P4 Phaser Map + Move
 → P5 Combat + Bruiser + Respawn
 → P6 XP/Level
 → P7 Kiste + Equip
 → P8 Optional
```

---

## Ticket-Schnitt (Copy-Paste)

1. `chore: M0 monorepo + compose + health`
2. `feat: auth login + session + /me`
3. `feat: hero create name/class + starter items`
4. `feat: mock wallet ensure`
5. `feat: phaser match scene WASD + mouse aim`
6. `feat: combat basic attack + bruiser AI`
7. `feat: player death respawn + hp`
8. `feat: xp level persist`
9. `feat: loot chest + inventory equip`
10. `docs: prototype how to run`

---

## Abnahme (Demo-Skript)

1. App starten, registrieren/einloggen  
2. Held „Testheld“ + Klasse Nahkämpfer  
3. Inventar zeigt Starter-Gear  
4. Abenteuer → laufen → Bruiser aggro  
5. Töten → XP steigt  
6. Sterben → Respawn  
7. Kiste öffnen → neues Item → anlegen  
8. Reload: Level + Inventar noch da  

Wenn 1–8 klappen → **Prototyp erreicht**.

---

## Verwandte Docs

- [16-developer-guide.md](./16-developer-guide.md) – volle M0–M10 Order
- [17-mvp-gameplay.md](./17-mvp-gameplay.md) – Klassen
- [18-enemy-ai.md](./18-enemy-ai.md) – Bruiser
- [19-phaser-rule-engine.md](./19-phaser-rule-engine.md) – Combat-Types
