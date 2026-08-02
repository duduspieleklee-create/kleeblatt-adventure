# 16 – Developer Guide

**Version:** 1.0  
**Stand:** 3. August 2026  
**Status:** Einstieg für Entwickler

---

## 1. Start hier

Dieses Dokument ist der **Einstieg**, wenn du die Architektur-Doku zum ersten Mal siehst.

**Was Kleeblattadventure ist (10 Zeilen):**

- 2D-Browser-Adventure (Phaser 3 + React-Shell)
- Gameplay ist **gasfrei**; Blockchain (Immutable zkEVM) nur bei bewussten Aktionen
- Jeder registriert sich (Social / E-Mail / Wallet) → **Embedded Wallet** wird verknüpft
- Danach kurzes Intro: **Neuling** (Gameplay-first) oder **Experte** (Ownership-Infos)
- Seltene Items optional als NFT **sichern** (Mint-Credits aus dem Fiat-Shop, keine Token-Pakete zum Auszahlen)
- Gesicherte Items **zum Spielen aktivieren** (Stake); optional **Claim** auf eigene Wallet
- Persistenz: **PostgreSQL**; Jobs: **Redis/BullMQ**; Map-Präsenz: **Colyseus** (o. Ä.)
- Keys: **MPC-Provider**, nicht Raw-Keys auf dem App-Server

**Was dieses Doc dir gibt:** Lesereihenfolge, Stack, MVP-Build-Order, Non-Goals, offene Lücken.

---

## 2. Empfohlene Lesereihenfolge

Nicht 00→15 linear lesen. Stattdessen:

| Reihenfolge | Doc | Warum |
|-------------|-----|--------|
| 1 | [12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md) | Muster vs. Kleeblatt-spezifisch in 1 Seite |
| 2 | [00-einfuehrung-vorteile-usecases.md](./00-einfuehrung-vorteile-usecases.md) | Motivation & Use-Cases |
| 3 | [16-developer-guide.md](./16-developer-guide.md) | Dieses Doc (Stack, MVP, Grenzen) |
| 4 | [11-onboarding-journey.md](./11-onboarding-journey.md) | Reg → Wallet → Intro → Match + Metriken |
| 5 | [10-player-journeys.md](./10-player-journeys.md) | Shop, Sichern, Stake, Claim UX |
| 6 | [09-waehrungs-und-shop-architektur.md](./09-waehrungs-und-shop-architektur.md) | Mint-Credits, kein Token-Cash-out |
| 7 | [03-item-lifecycle.md](./03-item-lifecycle.md) | Item-States |
| 8 | [15-game-backend-realtime.md](./15-game-backend-realtime.md) | Postgres, Redis, Colyseus |
| 9 | [14-phaser-react-bridge.md](./14-phaser-react-bridge.md) | Client-Kommunikation |
| 10 | [05-wallet-und-mpc.md](./05-wallet-und-mpc.md) + [06-wallet-abstraktionsschicht.md](./06-wallet-abstraktionsschicht.md) | Custodial + MPC + Interface |
| 11 | [13-sdk-api-skizze-v1.md](./13-sdk-api-skizze-v1.md) | API-Vertrag (intern/extrahierbar) |
| Bei Bedarf | [07](./07-mpc-provider-vergleich.md), [08](./08-entscheidungsmatrix.md) | Provider-Wahl |

---

## 3. Tech-Stack (Defaults)

| Schicht | Technologie |
|---------|-------------|
| Game Client | **Phaser 3** (3.8x), TypeScript, Vite |
| Meta-UI | **React** + TypeScript |
| Game API | **Node.js** + TypeScript (Fastify / Hono / Nest – Teamwahl) |
| DB | **PostgreSQL** |
| Cache / Queue | **Redis** + **BullMQ** |
| Realtime Map | **Colyseus** (oder gleichwertiger Room-Server) |
| Chain | **Immutable zkEVM** (L2-only) |
| Keys / Embedded Wallet | **MPC/WaaS** (z. B. Turnkey oder Dfns) hinter Abstraktion |
| Client↔Gameplay | `gameBridge` Events ([14](./14-phaser-react-bridge.md)) |

---

## 4. Systemüberblick (eine Skizze)

```
┌──────────────────────────────────────────┐
│ React Shell = Auth, Shop, Inventar, Claim│
└──────────────┬───────────────────────────┘
               │ gameBridge
┌──────────────▼───────────────────────────┐
│ Phaser = Match / Hub-Movement            │
└──────┬─────────────────────┬─────────────┘
       │ HTTP                │ WebSocket
       ▼                     ▼
┌──────────────┐      ┌────────────────────┐
│ Game API     │      │ Realtime (Colyseus)│
│ + BullMQ     │      │ Presence / Move    │
└──────┬───────┘      └─────────┬──────────┘
       │                        │
       ▼                        ▼
 PostgreSQL                   Redis
       │
       ▼
 Wallet Service → MPC Provider → Immutable zkEVM
```

**Regel:** Movement/Presence ≠ Economy/Web3. Mint/Claim nur über API + Queue.

---

## 5. MVP – Build Order

Ziel: spielbarer Kern + Ownership-Pfad, ohne alles parallele Plattform-Building.

| Phase | Lieferobjekt | Done wenn |
|-------|--------------|-----------|
| **M0** | Monorepo-Gerüst, Lint, lokale Postgres/Redis | `api` + `web` starten |
| **M1** | Auth (Social/E-Mail; Wallet optional) + User in DB | Login → Session |
| **M2** | Embedded Wallet ensure (MPC) + `wallets`-Row | Jeder User hat Adresse |
| **M3** | Onboarding-Pfad + Intro-Flags + Analytics-Events | Funnel messbar |
| **M4** | Phaser Match **ohne** Multiplayer (eine lokale/offline-Session) | Match start/ende über Bridge |
| **M5** | Inventar Web2 + Loot nach Match in DB | Item mit State `web2` |
| **M6** | Shop: Mint-Credits (Payment **mock** ok) | Credit-Balance |
| **M7** | Secure/Mint-Queue → NFT custodial + State `secured` | Happy Path + Idempotenz |
| **M8** | Activate/Deactivate (Stake) + Watcher/Webhook → `active_in_game` | Item im Match nutzbar |
| **M9** | Hub-Room Colyseus: joinen, laufen, andere sehen | 2 Clients eine Zone |
| **M10** | Claim to Self-Custody (Policies minimal) | Asset auf externer Adresse |
| **Später** | Echter Fiat-Provider, Gilden-Token-Käufe, Contract-Härtung, Multi-Zone | — |

Phasen können leicht parallelisiert werden (z. B. M4 parallel zu M1–M3), aber **M7 hängt an M2+M5+M6**.

---

## 6. Non-Goals (MVP bewusst nicht)

| Nicht bauen | Begründung |
|-------------|------------|
| Token direkt gegen Fiat im Shop | Cash-out-/Regulierungsrisiko ([09](./09-waehrungs-und-shop-architektur.md)) |
| Native L1-Bridge | L2-only; Spieler bridgt extern |
| Fiat-Auszahlung | Nicht MVP; Claim ≠ Cash-out |
| Open World / 1000 Spieler eine Map | Erst ein Hub-Room + Instanzen |
| Vollständige SDK als Produkt | Interfaces SDK-tauglich halten, Produkt = Spiel zuerst ([13](./13-sdk-api-skizze-v1.md)) |
| Alle UI in Phaser | Shop/Onboarding/Claim in React |
| Raw Private Keys auf dem API-Server | Nur MPC-Provider |
| Economy über Realtime-Messages | Keine Item-Vergabe im Move-Tick |

---

## 7. Wichtige Domänenregeln (Kurz)

1. **Ein Item logisch an einem Ort** – Web2, custodial secured, staked/active, oder self-custody.  
2. **Mint-Credit** ist Gutschein, kein handelbarer Token.  
3. **Sichern** verbraucht Credit (oder äquivalente Berechtigung), mintet auf custodiale Adresse.  
4. **Aktivieren** = Stake; Unstake → im Spiel sofort unusable.  
5. **Claim** = Ownership-Exit, mit Verifizierung/Policies im Game-Backend.  
6. **Map** zeigt Presence/Cosmetics – keine Token-Balances als Source of Truth.

Details: [03](./03-item-lifecycle.md), [09](./09-waehrungs-und-shop-architektur.md), [10](./10-player-journeys.md).

---

## 8. Repo- / Paket-Schnitt (Vorschlag)

```
apps/
  web/                 # React + Phaser
  api/                 # Game HTTP API + Worker
  realtime/            # Colyseus (oder in api, wenn klein)
packages/
  shared/              # Types, Event-Namen, Item-States
  sdk/                 # optional: interne Client-Lib an API
docs/
  architecture/        # diese Docs
```

Konkrete Tooling-Wahl (Nest vs. Hono, Prisma vs. Drizzle) ist Team-Entscheidung – Defaults in Abschnitt 3.

---

## 9. Was in der Doku noch fehlt (ehrlich)

| Lücke | Impact | Nächstes Artefakt |
|-------|--------|-------------------|
| **MVP-Gameplay-Spec** (Match-Regeln, Progression, Item-Effekte) | Ohne das kein „Spiel“ | `17-mvp-gameplay.md` |
| **DB-Felder + State-Übergangstabelle** | Backend-Start | Schema-Doc / Migration |
| **Smart-Contract-Interfaces + Events** | Mint/Stake on-chain | Contracts-Doc |
| **E2E-Sequenzdiagramme** (Mint, Claim, Hub) | Weniger Fehlannahmen | 1–2 Diagramme |
| **Local run + .env.example** | Clone & start | Root README / ops |
| **Security-Matrix** (wer darf secure/claim) | Produktion | kurzes Security-Doc |

Wenn du nur Architektur umsetzt und auf Gameplay wartest: **M0–M3 + M9** sind trotzdem sinnvoll testbar.

---

## 10. Definition of Done (Orientierung)

**MVP „plattform“** ungefähr erreicht wenn:

- [ ] Reg → Wallet linked → Intro → Match start messbar (Events aus [11](./11-onboarding-journey.md))
- [ ] Loot → Web2-Item → Secure mit Credit → on-chain custodial
- [ ] Activate → im Match nutzbar; Deactivate sperrt
- [ ] Zwei Browser im Hub sehen sich laufen
- [ ] Claim happy path auf externe Testadresse
- [ ] Keine Token-Fiat-Pakete, keine Keys im Klartext auf dem API-Host

**MVP „Spiel“** braucht zusätzlich die Gameplay-Spec (Siegbedingungen, Content-Minimum).

---

## 11. Ansprechpartner-Themen (Decision Log)

| Thema | Status |
|-------|--------|
| Phaser 3 + React Bridge | Entschieden ([14](./14-phaser-react-bridge.md)) |
| Postgres + Redis + Colyseus | Entschieden ([15](./15-game-backend-realtime.md)) |
| Mint-Credits statt Token-Shop | Entschieden ([09](./09-waehrungs-und-shop-architektur.md)) |
| MPC-Provider (Turnkey vs. Dfns) | Tendenz Turnkey zum Start ([08](./08-entscheidungsmatrix.md)) – final TBD |
| Payment-Provider Fiat | TBD (MVP mock) |
| Exact Match-Design | **Offen – Blocker für Content** |

---

## 12. Ein-Satz-Zusammenfassung

**Lies Pattern → Onboarding → Item/Shop → Backend/Client-Docs; baue in der MVP-Reihenfolge Auth→Wallet→Match→Loot→Secure→Stake→Hub→Claim; baue kein Token-Cash-out und warte auf eine Gameplay-Spec für das eigentliche Adventure.**

---

## Verwandte Docs

Alle unter `docs/architecture/` – Index: [00-README.md](./00-README.md).
