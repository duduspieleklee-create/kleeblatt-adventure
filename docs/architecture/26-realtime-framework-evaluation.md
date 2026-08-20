# Realtime Framework Evaluation

**Rivalis · Colyseus · Socket.IO — evaluated against Kleeblatt Adventure's actual architecture**

---

## 1. What the Game Actually Needs

The game is currently **single-player, REST-only**. Realtime is explicitly deferred to **M9 "Hub Colyseus"**. The use-case is a _shared hub world_ — players can see each other move, emote, and chat — but combat, loot, and economy stay server-authoritative via REST.

### Must Have
- WebSocket transport (Node.js)
- TypeScript-first API
- Room/session lifecycle (join, leave, overflow pool)
- Player presence broadcast (position, animation state)
- Auth via existing JWT session cookie (`kleeblatt_session`)
- Coexist with Hono REST server (same or separate port)
- Phaser-compatible browser client

### Nice to Have
- Delta-state sync (send only changes)
- Built-in rate limiting / cheat guards
- Room matchmaking / pooling (hub-1, hub-2…)
- Reconnect support
- Binary encoding (bandwidth)

### Not Needed (explicit non-goals)
- Economy / item minting over WebSocket
- Wallet / MPC keys over WebSocket
- Match result submission over WebSocket
- 1000-player open world
- Distributed cluster (single server for M9)

---

## 2. Framework Profiles

### Rivalis
- Actor-based model, TypeScript
- Custom protocol over WebSocket
- ~50 GitHub stars, no npm publish, no commits in 2+ years → **effectively abandoned**
- No browser/Phaser client library
- No auth integration documented
- Zero production references

### Colyseus ⭐ Recommended
- TypeScript-first, `@Schema` decorator state
- Room lifecycle built-in (`onCreate`, `onJoin`, `onLeave`, `onDispose`)
- Official Phaser 3 example repository
- Automatic delta-state sync (only diffs sent, MessagePack encoded)
- `onAuth()` hook for JWT/cookie validation
- Built-in room pooling / matchmaker (`matchMaker.joinOrCreate()`)
- 6k+ GitHub stars, ~40k npm weekly downloads, active OSS
- **Already named in the project's own architecture docs (M9, docs 15 & 16)**

### Socket.IO
- TypeScript support with typed events
- 60k+ GitHub stars, ~10M npm weekly downloads — battle-tested
- Room primitive (string labels) with auth middleware
- Automatic reconnection with backoff
- **No built-in game state schema or delta sync — must be built manually**
- **No matchmaking — must be built manually**
- Generic transport, not game-specific; significant boilerplate for game patterns

---

## 3. Detailed Comparison

| Criterion | Rivalis | Colyseus | Socket.IO |
|---|---|---|---|
| TypeScript API | Partial | ✅ Full (decorators, inference) | ✅ Good |
| Room lifecycle | Custom/non-standard | ✅ Built-in hooks | ⚠️ Primitive (string labels) |
| State synchronization | ❌ Manual emit | ✅ Auto delta-sync | ❌ Manual |
| Phaser browser client | ❌ None | ✅ Official `colyseus.js` | ✅ Works (generic) |
| Auth (existing JWT) | ❌ None documented | ✅ `onAuth()` hook | ✅ Handshake middleware |
| Works beside Hono REST | Unknown | ✅ Yes | ✅ Yes |
| Room pooling / matchmaking | ❌ None | ✅ Built-in matchmaker | ❌ Build yourself |
| Binary encoding | ❌ No | ✅ MessagePack default | ⚠️ Optional |
| Reconnection support | ❌ No | ✅ `allowReconnection()` | ✅ Built-in |
| Community / maintenance | ❌ Inactive | ✅ Active | ✅ Very active |
| npm weekly downloads | Not published | ~40k | ~10M |
| Already in project plan | ❌ No | ✅ Yes (M9, docs 15 & 16) | ❌ No |
| Integration effort (M9 hub) | ❌ High (unknown API) | ✅ Low (examples exist) | ⚠️ Medium (DIY game patterns) |
| License | MIT | MIT | MIT |

---

## 4. Verdict

### ✅ Recommendation: Colyseus

Colyseus was already selected by the project architects and this evaluation confirms that decision.

- Its **Room abstraction** maps directly onto the `hub-*` pooling design in the architecture docs.
- **Schema delta-sync** handles player position broadcasting without manual diffing.
- **`onAuth()`** slots straight into the existing `verifySession()` JWT cookie middleware — minimal glue code.
- Official **Phaser 3 examples** mean the client integration is well-documented.
- Already named in **M9 and docs/architecture/15 and 16** — using it keeps the codebase consistent.

### ❌ Rivalis — Not suitable

The project appears **abandoned**. No npm publish, no browser client, ~50 stars, no commits in 2+ years, zero production references. Risk is unacceptable for a shipping product.

### ⚠️ Socket.IO — Viable fallback only

Battle-tested and well-known, but it is a _generic transport_, not a game server. Room pooling, state diffing, schema validation, and matchmaking would all need to be built from scratch — work that Colyseus already ships. Only consider Socket.IO if Colyseus licensing or its opinionated schema system becomes a hard blocker.

---

## 5. How Colyseus Fits Into the Existing Stack

| Layer | Technology | Change needed? |
|---|---|---|
| REST API | Hono on port 4000 | No change — stays as-is |
| Realtime Hub | Colyseus on port 2567 | Add: new `apps/realtime` package or attach to API server |
| Auth | Existing JWT cookie `kleeblatt_session` | Add: `onAuth()` hook calls existing `verifySession()` |
| Room state | Colyseus `@Schema` classes | Add: `HubRoomState` with player positions + display names |
| Phaser client | `colyseus.js` in `apps/web` | Add: `ColyseusClient` in `IslandScene`, bridged via `gameBridge` |
| Postgres | Drizzle ORM | No change — Colyseus room holds only ephemeral presence |
| Redis | Redis 7 (already running) | Optional: Colyseus Redis driver for multi-process pub/sub |
