# 15 – Game Backend & Realtime Map

**Version:** 1.0  
**Stand:** 3. August 2026  
**Status:** Design Decision

---

## 1. Ziel

Zwei getrennte Backend-Schichten festlegen:

1. **Persistenz** – Account, Inventar, Mint/Claim, Shop (dauerhaft)
2. **Realtime-Präsenz** – Spieler auf einer Map sehen und bewegen (flüssig, oft flüchtig)

Das konkrete Map-Design (Hub, Stadt, offene Zone) bleibt offen. Die **Technologie** soll Presence + Movement von Anfang an tragen.

---

## 2. Gesamtarchitektur

```
React + Phaser Client
        │
        ├──────── HTTP/REST (oder tRPC) ────────────┐
        │                                           ▼
        │                                Game API (Node/TS)
        │                                • Auth / Session
        │                                • Inventar, Items
        │                                • Shop, Mint-Queue
        │                                • Claim
        │                                     │
        │                              PostgreSQL (+ Redis)
        │
        └──────── WebSocket ────────────────────┐
                                                ▼
                                     Realtime / Zone Server
                                     • Position, Richtung, Anim
                                     • Zone/Room Membership
                                     • Interest Management
                                              │
                                         Redis (Pub/Sub, Presence-Cache)
```

| System | Speichert | Latenz-Erwartung |
|--------|-----------|------------------|
| **PostgreSQL** | User, Items, Wallets, Credits, Matches | Sekunden ok |
| **Redis** | Sessions, BullMQ, optional Presence | ms |
| **Realtime-Server** | Live-Positionen (meist nicht dauerhaft in PG) | Tick / 50–100 ms |

**Regel:** Positionen laufender Spieler nicht bei jedem Move in Postgres schreiben.

---

## 3. Persistenz – PostgreSQL

### Empfehlung

- **PostgreSQL** als System of Record
- **Redis** für Queue (BullMQ), Cache, Rate-Limits, optional Presence
- ORM/Migrations: z. B. Drizzle, Prisma oder Knex

### Schema-Skizze (Auszug)

| Bereich | Tabellen (Beispiele) | Inhalt |
|---------|----------------------|--------|
| Auth | `users`, `auth_identities` | Login-Methoden, Profil |
| Wallet | `wallets` | user_id, address, provider_ref, status |
| Items | `items` | item_id, user_id, state, token_id, collection |
| Credits | `mint_credits` | user_id, balance |
| Economy | `orders`, `guild_ledger` | Shop, Gilden-Bewegungen |
| Onboarding | `user_onboarding` | path, intro_completed_at |
| Match | `matches`, `match_players` | Ergebnis, Loot-Refs |
| Cosmetics | `user_cosmetics` | ausgerüstete Skin-Id für Map-Display |

Item-`state` orientiert sich an [03-item-lifecycle.md](./03-item-lifecycle.md)  
(`web2` → `pending_secure` → `secured` → `active_in_game` → `self_custody`).

### Was **nicht** in Postgres gehört (als Hot Path)

- 20 Hz Positions-Updates
- Jeder Animations-Frame
- Ephemere Room-Membership ohne Bedarf an Historie

Optional später: periodischer Snapshot „last_hub_position“ für Spawn – nicht der Live-Stream.

---

## 4. Game API (HTTP)

| Verantwortung | Beispiele |
|---------------|-----------|
| Auth / Session | Social, E-Mail, Wallet-Login → Session-Token |
| Inventar & Items | Lesen, State nach Webhooks aktualisieren |
| Shop / Mint-Credits | Fiat-Anbindung hostseitig; Credits verbuchen |
| Secure / Activate / Claim | Queue + Wallet-Service (siehe SDK-Skizze) |
| Match-Ergebnis | Server-authoritative Rewards, Loot in DB |

**Stack-Vorschlag:** Node.js + TypeScript (Fastify, Hono oder Nest).  
**Auth für Realtime:** kurzlebiges Token (JWT oder opaque session), **keine** MPC-Keys im WebSocket.

---

## 5. Realtime Map – Presence & Movement

### 5.1 Anforderung

Spieler sollen auf einer Map **andere Spieler sehen und laufen sehen**.  
Genaues Design offen – Tech muss Zones/Rooms, Join/Leave und Movement tragen.

### 5.2 Bausteine

| Baustein | Aufgabe |
|----------|---------|
| WebSocket | Dauerkanal Client ↔ Zone-Server |
| Zone / Room | Logische Gebiete (z. B. `hub-1`, `town-square`) |
| Presence | Join/Leave sichtbar machen |
| State Sync | x, y, Richtung, kurze Anim (idle/walk) |
| Interest Management | Nur nahe / gleiche Zone – nicht die ganze Welt broadcasten |
| Validation | Max-Speed, Map-Bounds (Anti-Cheat grob) |

### 5.3 Stack-Empfehlung v1

| Option | Rolle |
|--------|--------|
| **Colyseus** (empfohlen) | Rooms, Schema-State, Phaser-nah, Node |
| Alternative | Socket.io + eigene Room-Logik (mehr Eigenbau) |
| Später / Scale | Instanzen, Edge (PartyKit/CF DO), oder Nakama wenn Vollplattform gewünscht |

**Colyseus (oder Äquivalent)** kennt: `userId`, Display-Name, `skinId`, Position – **nicht** Token-Balances oder Mint-Recht.

### 5.4 Message-Vertrag (Minimum)

```ts
// Client → Server (rate-limited, z. B. 10–20 Hz)
{ type: "move", x: number, y: number, dir: number }

// Server → Client
{ type: "player_join", player: PlayerPublic }
{ type: "player_leave", userId: string }
{ type: "player_move", userId: string, x: number, y: number, dir: number }
// optional initial snapshot
{ type: "players_snapshot", players: PlayerPublic[] }
```

```ts
type PlayerPublic = {
  userId: string;
  displayName: string;
  skinId: string;
  x: number;
  y: number;
  dir: number;
};
```

Erweiterungen (Emotes, Trade-Request, NPC-Flags) später – ohne DB-Umbau der Economy.

### 5.5 Client (Phaser)

- Lokaler Spieler: Prediction / direkter Input
- Remote-Spieler: Sprites, Interpolation zwischen Server-Updates
- Bridge zu React: z. B. nur „Match starten“ / UI – nicht jeder Move ([14-phaser-react-bridge.md](./14-phaser-react-bridge.md))

---

## 6. Abgrenzung: Realtime vs. Economy / Web3

| Aktion | System |
|--------|--------|
| Laufen, sehen, emotes | Realtime-Server |
| Item sichern, staken, claimen | HTTP API + Queue + MPC |
| Shop / Mint-Credits | HTTP API + Payment |
| Match-Loot vergeben | API nach Match (authoritativ) |
| Skin auf Map anzeigen | API liefert `skinId` → Realtime nur broadcasten |

**Wichtig:** Keine Item-Vergabe und keine Token-Transfers über den Movement-Tick.  
Sonst wird der Zone-Server zum Exploit-Vektor.

---

## 7. Sicherheit (kurz)

- WebSocket nur mit gültiger Session authentifizieren
- Move rate-limiten und serverseitig Speed/Bounds prüfen
- Room-Kapazität begrenzen → Overflow in `hub-2`, `hub-3`, …
- Service-Rollen: Realtime-Prozess darf **nicht** beliebig Mint/Credit-APIs ohne Auth aufrufen
- Secrets (MPC, DB) nur in API-Workern, nicht in öffentlich erreichbarer Zone-Logik

---

## 8. MVP: „Leute auf der Map“ ohne Open-World-Scope

1. **Ein Hub-Room** (eine Map-Instanz)
2. Spawn, Laufen, andere in derselben Instanz sehen
3. Max. N Spieler pro Room, dann neue Instanz
4. Kein Kampf, kein Loot auf der Map
5. „Match starten“ über React/API – Spieler verlässt Room oder matched separat

Später: weitere Zonen, Instanzen, Interaktionen, Persistenz letzter Hub-Position.

---

## 9. Festlegungen v1

| Schicht | Technologie |
|---------|-------------|
| Game API | Node.js + TypeScript |
| Datenbank | **PostgreSQL** |
| Cache / Queue | **Redis** + BullMQ |
| Realtime Map | **Colyseus** (oder gleichwertiger Room-Server) |
| Client Gameplay | Phaser 3 (remote players) |
| Client Meta-UI | React |
| Item/Web3 Source of Truth | PostgreSQL + HTTP API + Wallet-Service |

---

## 10. Offene Design-Punkte (kein Blocker für Tech)

- Eine persistente Welt vs. nur Matchmaking-Hub
- Klick-to-move vs. WASD
- Ziel-Spielerzahl pro Zone
- Ob und welche Sozial-Features auf der Map (Handel, Party, Chat)

Die gewählte Architektur unterstützt diese Entscheidungen nachträglich.

---

## 11. Ein-Satz-Zusammenfassung

**Postgres speichert das Spiel, Redis die Jobs, ein Room-Server die laufenden Körper auf der Map – und Web3/Inventar bleibt auf der HTTP-API, nicht im Movement-Stream.**

---

## Verwandte Docs

- [02-architektur.md](./02-architektur.md) – High-Level
- [03-item-lifecycle.md](./03-item-lifecycle.md) – Item-States in DB
- [06-wallet-abstraktionsschicht.md](./06-wallet-abstraktionsschicht.md) – Wallet-Service
- [14-phaser-react-bridge.md](./14-phaser-react-bridge.md) – Client-Trennung Gameplay/UI
- [13-sdk-api-skizze-v1.md](./13-sdk-api-skizze-v1.md) – Secure/Claim-APIs
