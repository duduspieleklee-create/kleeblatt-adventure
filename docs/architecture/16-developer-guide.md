# 16 – Developer Guide

**Version:** 1.1  
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

**Was dieses Doc dir gibt:** Lesereihenfolge, Stack, detaillierte MVP-Build-Order, Non-Goals, offene Lücken.

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

## 5. MVP – Build Order (Detail)

Ziel: spielbarer Kern + Ownership-Pfad, ohne Open-World und ohne Token-Cash-out.

### 5.1 Abhängigkeitsgraph

```
M0 ──► M1 ──► M2 ──► M3
              │
              ├──────────────► M7 (braucht auch M5, M6)
M0 ──► M4 ──► M5 ──► M6 ──► M7 ──► M8
M2 ──► M9 (kann parallel zu M4–M6)
M2 + M7 ──► M10
```

**Kritischer Pfad „NFT im Inventar“:** M0→M1→M2 und M4→M5→M6→**M7**.  
**Kritischer Pfad „Spielgefühl“:** M4 (ohne Gameplay-Spec unsicher).  
**Kritischer Pfad „Map“:** M9 (entkoppelt von Mint).

### 5.2 Übersichtstabelle

| Phase | Lieferobjekt | Done wenn |
|-------|--------------|-----------|
| **M0** | Monorepo, Lint, Postgres/Redis lokal | `api` + `web` starten |
| **M1** | Auth + User in DB | Login → Session |
| **M2** | Embedded Wallet ensure | Jeder User hat Adresse |
| **M3** | Onboarding-Pfad + Events | Funnel messbar |
| **M4** | Phaser Match ohne Multiplayer | Match start/ende über Bridge |
| **M5** | Inventar Web2 + Loot | Item State `web2` |
| **M6** | Mint-Credits (Payment mock) | Credit-Balance |
| **M7** | Secure/Mint-Queue | `secured` + Idempotenz |
| **M8** | Activate/Deactivate | `active_in_game` im Match |
| **M9** | Hub Colyseus | 2 Clients eine Zone |
| **M10** | Claim | Asset auf externer Adresse |

### 5.3 M0 – Gerüst & Local Dev

| | |
|--|--|
| **Ziel** | Team kann API + Web lokal starten |
| **Lieferobjekte** | Monorepo (`apps/web`, `apps/api`, optional `apps/realtime`), TypeScript, Lint/Format, Docker Compose für Postgres + Redis, `.env.example`, `GET /health` |
| **Abhängigkeiten** | — |
| **Done wenn** | `docker compose up` + api + web ohne manuelle DB-Installation |
| **Nicht in M0** | Auth, Phaser-Content, Chain |
| **Richtaufwand** | 1–3 Tage |

### 5.4 M1 – Auth & User

| | |
|--|--|
| **Ziel** | Stabiler Account als Anker |
| **Lieferobjekte** | Mind. ein Social-Provider und/oder E-Mail; Session (JWT/Cookie); `users` + `auth_identities`; `GET /me`; Logout |
| **Abhängigkeiten** | M0 |
| **Done wenn** | Login → Session → `/me` mit `userId`; geschützte Routen ohne Session → 401 |
| **Nicht in M1** | Wallet-Connect muss nicht primär sein |
| **Tests** | Happy path, ungültige Session, Logout |
| **Richtaufwand** | 3–7 Tage |

### 5.5 M2 – Embedded Wallet

| | |
|--|--|
| **Ziel** | Jeder User hat custodiale Adresse (MPC) |
| **Lieferobjekte** | Wallet-Service (`ensure`, `getAddress`); MPC-Adapter oder **MockAdapter**; Tabelle `wallets`; `ensure` nach Login |
| **Abhängigkeiten** | M1 |
| **Done wenn** | Genau eine Wallet-Row pro User; zweiter `ensure` idempotent |
| **Nicht in M2** | On-Chain-Mint, Funding |
| **Risiko** | Provider-Secrets nur Server-Env, nie Client |
| **Richtaufwand** | 3–8 Tage (Mock schneller) |

### 5.6 M3 – Onboarding-Pfad & Metriken

| | |
|--|--|
| **Ziel** | Funnel messbar; Neuling vs. Experte |
| **Lieferobjekte** | Choice-UI oder Ableitung; `user_onboarding`; Events `reg_completed`, `wallet_provisioned`, `path_chosen`, `intro_completed`; kurze Intro-Screens |
| **Abhängigkeiten** | M1, ideal M2 |
| **Done wenn** | Events persistiert/analytics; User erreicht Hub/Match-UI ohne Crash |
| **Nicht in M3** | Langes Tutorial, Claim-Adresse Pflicht |
| **Richtaufwand** | 2–4 Tage |

### 5.7 M4 – Phaser Match (Single / offline)

| | |
|--|--|
| **Ziel** | Kern-Gameplay ohne Multiplayer und ohne Chain |
| **Lieferobjekte** | Phaser in React-Shell; `gameBridge`; Boot + Match; `match:start` / `match:ended` |
| **Abhängigkeiten** | M0 (parallel zu M1–M3 möglich) |
| **Done wenn** | Match starten → Phaser → Ende-Event → React-Ergebnis |
| **Nicht in M4** | Colyseus, finale Balance |
| **Hinweis** | **Größter Unsicherheitsfaktor ohne Gameplay-Spec** |
| **Richtaufwand** | 1–3+ Wochen (Content) |

### 5.8 M5 – Inventar Web2 + Loot

| | |
|--|--|
| **Ziel** | Match belohnt persistent, noch ohne NFT |
| **Lieferobjekte** | Tabelle `items` (`state=web2`); Inventar-API; server-authoritatives Loot nach Match; React-Liste |
| **Abhängigkeiten** | M1, M4 |
| **Done wenn** | Nach Match Item im Inventar mit `web2` |
| **Wichtig** | Client vergibt Loot nicht final (Cheat-Schutz auch im MVP) |
| **Richtaufwand** | 3–6 Tage |

### 5.9 M6 – Mint-Credits (Payment mock)

| | |
|--|--|
| **Ziel** | Sichern hat interne Währung ohne echten PSP |
| **Lieferobjekte** | `mint_credits.balance`; Mock-Shop „+1 Credit“; UI Balance; **kein** Token-Kauf |
| **Abhängigkeiten** | M1 |
| **Done wenn** | Credit-Stand sichtbar und im Dev-Modus aufladbar |
| **Nicht in M6** | Stripe/Transak |
| **Richtaufwand** | 1–3 Tage |

### 5.10 M7 – Secure / Mint-Pipeline

| | |
|--|--|
| **Ziel** | Web2-Item → NFT auf custodialer Adresse |
| **Lieferobjekte** | `POST secure` + `clientRequestId`; atomarer Credit-Verbrauch; BullMQ-Worker; States `pending_secure` → `secured`; Retry/Credit-Rückgabe bei Fail |
| **Abhängigkeiten** | **M2 + M5 + M6** |
| **Done wenn** | Happy Path + kein Doppel-Mint bei Doppelklick |
| **Tests** | Idempotenz, Provider-Fail, parallele Requests |
| **Richtaufwand** | 1–2 Wochen (mit Contract) |

Mit **Mock Mint** kann UI/State parallel laufen, bevor Testnet steht.

### 5.11 M8 – Activate / Deactivate (Stake)

| | |
|--|--|
| **Ziel** | Gesichertes Item nur nutzbar wenn aktiv |
| **Lieferobjekte** | activate/deactivate API + Chain/Watcher; State `active_in_game`; Match prüft Active; Unstake → sofort unusable |
| **Abhängigkeiten** | M7 |
| **Done wenn** | Activate → ausrüstbar; Deactivate → gesperrt |
| **Richtaufwand** | 4–8 Tage |

### 5.12 M9 – Hub Realtime (Colyseus)

| | |
|--|--|
| **Ziel** | „Andere Spieler auf der Map“ technisch beweisen |
| **Lieferobjekte** | Room `hub-*`; WS-Auth mit Session; Join/Leave; Move rate-limited; Phaser remote sprites; Kapazität → neue Instanz |
| **Abhängigkeiten** | M1 (Token); **unabhängig von M7** |
| **Done wenn** | Zwei Browser, gleiche Zone, sichtbare Bewegung |
| **Nicht in M9** | Kampf/Loot/Handel auf der Map, Open World |
| **Richtaufwand** | 1–2 Wochen |

### 5.13 M10 – Claim to Self-Custody

| | |
|--|--|
| **Ziel** | Ownership-Exit |
| **Lieferobjekte** | Claim-UI + minimale Verifizierung (E-Mail/2FA); Transfer auf `toAddress`; State `self_custody`; Status-Polling |
| **Abhängigkeiten** | M2, M7 |
| **Done wenn** | Asset auf Test-Wallet (Explorer); custodialer In-Game-Besitz beendet |
| **Nicht in M10** | Fiat-Off-Ramp |
| **Richtaufwand** | 4–8 Tage |

### 5.14 Parallelisierung (Team)

| Track A – Platform | Track B – Game | Track C – Realtime |
|--------------------|----------------|--------------------|
| M0 → M1 → M2 → M3 | M0 → M4 → M5 | M0 → M1 → M9 |
| M6 → M7 → M8 → M10 | andocken an M7 | |

### 5.15 Meilenstein-Pakete

| Meilenstein | Phases | Demo |
|-------------|--------|------|
| **Alpha Platform** | M0–M3 | Login, Wallet intern, Intro |
| **Alpha Game** | + M4–M5 | Match + Item im Inventar |
| **Beta Ownership** | + M6–M8 | Credit → Secure → Activate |
| **Beta Social Map** | + M9 | 2 Spieler im Hub |
| **RC Ownership Exit** | + M10 | Claim auf Testwallet |

### 5.16 Ein-Satz pro Phase

| Phase | Fokus |
|-------|--------|
| M0 | Lokal startbar |
| M1 | User existiert |
| M2 | User hat Wallet |
| M3 | Funnel messbar |
| M4 | Man kann „spielen“ |
| M5 | Spielen belohnt |
| M6 | Sichern hat Preis (Credit) |
| M7 | Sichern schreibt Chain |
| M8 | Chain-Item steuert Nutzbarkeit |
| M9 | Andere sind sichtbar |
| M10 | User kann Ownership übernehmen |

### 5.17 Externe Blocker

| Blocker | Betrifft |
|---------|----------|
| MVP-Gameplay-Spec fehlt | M4 Scope/Dauer |
| MPC-Provider-Account | M2/M7 ohne Mock |
| NFT-Contract Testnet | M7/M8/M10 echte Chain |
| Fiat-PSP | erst nach stabilem M7 |

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
3. **Sichern** verbraucht Credit, mintet auf custodiale Adresse.  
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

---

## 9. Was in der Doku noch fehlt (ehrlich)

| Lücke | Impact | Nächstes Artefakt |
|-------|--------|-------------------|
| **MVP-Gameplay-Spec** | Ohne das kein „Spiel“ | `17-mvp-gameplay.md` |
| **DB-Felder + State-Übergänge** | Backend-Start | Schema-Doc / Migration |
| **Smart-Contract-Interfaces + Events** | Mint/Stake on-chain | Contracts-Doc |
| **E2E-Sequenzdiagramme** | Weniger Fehlannahmen | 1–2 Diagramme |
| **Local run + .env.example** | Clone & start | Root README / ops |
| **Security-Matrix** | Produktion | kurzes Security-Doc |

Ohne Gameplay-Spec sind **M0–M3 + M9** trotzdem sinnvoll testbar.

---

## 10. Definition of Done (Orientierung)

**MVP „plattform“** ungefähr erreicht wenn:

- [ ] Reg → Wallet linked → Intro → Match start messbar
- [ ] Loot → Web2-Item → Secure mit Credit → on-chain custodial
- [ ] Activate → im Match nutzbar; Deactivate sperrt
- [ ] Zwei Browser im Hub sehen sich laufen
- [ ] Claim happy path auf externe Testadresse
- [ ] Keine Token-Fiat-Pakete, keine Keys im Klartext auf dem API-Host

**MVP „Spiel“** braucht zusätzlich die Gameplay-Spec.

---

## 11. Decision Log

| Thema | Status |
|-------|--------|
| Phaser 3 + React Bridge | Entschieden ([14](./14-phaser-react-bridge.md)) |
| Postgres + Redis + Colyseus | Entschieden ([15](./15-game-backend-realtime.md)) |
| Mint-Credits statt Token-Shop | Entschieden ([09](./09-waehrungs-und-shop-architektur.md)) |
| MPC-Provider (Turnkey vs. Dfns) | Tendenz Turnkey – final TBD ([08](./08-entscheidungsmatrix.md)) |
| Payment-Provider Fiat | TBD (MVP mock) |
| Exact Match-Design | **Offen – Blocker für Content** |

---

## 12. Ein-Satz-Zusammenfassung

**Lies Pattern → Onboarding → Item/Shop → Backend/Client-Docs; baue M0–M10 in der dokumentierten Reihenfolge (M9 parallel möglich); baue kein Token-Cash-out; Gameplay-Spec ist der Blocker für M4-Content.**

---

## Verwandte Docs

Alle unter `docs/architecture/` – Index: [00-README.md](./00-README.md).
