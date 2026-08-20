# Kleeblatt-Adventure: Colyseus Multiplayer Integration Brief

**Status:** Ready for Development  
**Priority:** P1 (Blocks Multiplayer Foundation)  
**Estimated Effort:** 3–4 weeks (Phases 1–1.5)

---

## Executive Summary

Integrate Colyseus v0.17 as the authoritative multiplayer server layer into the existing `kleeblatt-adventure` monorepo. The integration attaches WebSocket server to the current Hono API process on port 4000, implements a single `IslandRoom` type with server-authoritative chat state, provides schema-backed message synchronization, and validates the entire stack through a two-tab acceptance test. The first milestone proves real-time room instancing and server authority without database persistence, movement synchronization, or additional features. Player character names appear next to messages. The chat window is polished but scope-locked to the proof.

---

## Requirements

### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-001 | Two clients join the same `IslandRoom` instance | Must | Both tabs show the same room ID or session marker; messages sent by one appear in the other |
| FR-002 | Server validates and accepts chat messages | Must | Messages are trimmed, empty messages rejected, max 200 chars enforced, control chars stripped server-side |
| FR-003 | Chat message displays sender name and timestamp | Must | Each message rendered as `[HH:MM] Name: text`; name derived server-side from client.userData |
| FR-004 | Server-authoritative schema state synchronizes to clients | Must | Colyseus uses `Callbacks.get(room)` or v0.17 equivalent; client receives full state on join and deltas on mutation |
| FR-005 | Chat history persists within room lifetime (50 message cap) | Must | Reloading one tab shows last 50 messages; messages older than 50 are removed server-side |
| FR-006 | Keyboard input does not leak from chat to gameplay | Must | Typing `E`, `I`, `Escape` in focused chat input does not trigger interact, questbook, or menu actions |
| FR-007 | Player can send message with Enter key | Must | Focus chat input, type text, press Enter → message sent and cleared from input |
| FR-008 | Caddy proxies Colyseus matchmaking endpoint | Must | Browser can reach `/matchmake*` through Caddy; WebSocket upgrade preserved |
| FR-009 | UI integrates with existing `ScaleManager` | Must | Chat widget bounds respect game viewport, scale on resize, no direct `game.scale` access |
| FR-010 | Multiple separate room instances do not share state | Must | If two different island/world identities are supported, messages in one do not appear in the other |

### Non-Functional Requirements

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-001 | Message synchronization latency | <300ms local/stage | Measure time from send button click to receive in second tab |
| NFR-002 | TypeScript strict mode | Pass with no `any` fallback for bridge events | `chat:message` and `chat:send` fully typed in `GameBridgeEvents` |
| NFR-003 | Rate-limit protection per client | 300ms cooldown enforced server-side | Attempt two messages within 300ms; second is silently rejected |
| NFR-004 | Room crash resistance | No room crash on invalid payload | Send `{"text": null}` → room remains operational, next valid message works |
| NFR-005 | No extra processes or ports | Single API process, port 4000 only | `netstat` or `lsof` shows one listen on 4000; no 2567, 8787, or second server |
| NFR-006 | Existing REST routes functional | All existing endpoints work unchanged | `POST /match/start` and other API routes remain reachable |
| NFR-007 | Build and type checking pass | Zero compilation errors | `npm run build` in `apps/api`, `apps/web`, `packages/shared` all green |

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Tab A/B)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  GamePage.tsx / ChatWidget                       │  │
│  │  ├─ Phaser Scene (IslandScene)                   │  │
│  │  ├─ Keyboard: E/I/Esc guards via isTypingInput()│  │
│  │  └─ Phaser update() movement guard               │  │
│  └─────────────────┬──────────────────────────────┘  │
│                    │ gameBridge events                   │
│  ┌─────────────────▼──────────────────────────────┐  │
│  │  MultiplayerManager (Single Network Boundary)  │  │
│  │  ├─ room.send("chat", {text})                  │  │
│  │  ├─ Callbacks.get(room).onAdd("messages", ...) │  │
│  │  └─ Lifecycle: connect/disconnect/cleanup      │  │
│  └─────────────────┬──────────────────────────────┘  │
│                    │ WebSocket                         │
│                    │ /matchmake*                       │
│                    │ (via Caddy proxy)                 │
└────────────────────┼─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│          apps/api (Single HTTP Server, Port 4000)        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Existing Hono Routes                            │   │
│  │  ├─ POST /match/start                            │   │
│  │  ├─ GET /api/*                                   │   │
│  │  └─ Other REST endpoints (unchanged)             │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Colyseus Server (@hono/node-server shared)      │   │
│  │  ├─ WebSocketTransport({server: httpServer})     │   │
│  │  └─ defineServer / defineRoom API (v0.17)        │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                   │
│  ┌────────────────────▼─────────────────────────────┐   │
│  │  IslandRoom (Authoritative Game World)           │   │
│  │  ├─ onJoin: derive name from client.userData    │   │
│  │  ├─ messages handler: validate(Zod) + sanitize  │   │
│  │  ├─ onUncaughtException: log and isolate        │   │
│  │  └─ onLeave/onDispose: cleanup state            │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                   │
│  ┌────────────────────▼─────────────────────────────┐   │
│  │  IslandRoomState (Schema)                         │   │
│  │  └─ messages: ArraySchema<ChatMessage> (cap 50)  │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

### Technology Stack

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Server Runtime | Node.js + Hono | (existing) | Preserve existing HTTP foundation |
| API Framework | @hono/node-server | (existing) | Share Node http.Server with Colyseus |
| Multiplayer Server | Colyseus | v0.17 | Current stable; server-authoritative state sync |
| Transport | @colyseus/ws-transport | v0.17-compatible | WebSocket over shared server |
| Schema | @colyseus/schema | v0.17-compatible | Runtime type-safe state definitions |
| Client | @colyseus/sdk **or** colyseus.js | (TBD in T0) | Verify compatibility during spike |
| Validation | Zod | (existing in apps/api) | Reuse project's validation pattern |
| Web Framework | React | (existing) | Mount ChatWidget in GamePage |
| Game Engine | Phaser 4.2 | (existing) | Phaser scene integration, keyboard guards |
| Event Bus | gameBridge (from @kleeblatt/shared) | (existing) | Typed communication layer |
| UI Scaling | ScaleManager (from apps/web) | (existing) | Viewport-aware layout |
| Proxy | Caddy | (existing) | WebSocket upgrade routing |
| Package Manager | npm | (existing) | Build and dependency management |

---

### Key Design Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| **Server Process Model** | Single API process, Colyseus attached to Hono server | Separate Colyseus service, Docker, second port | Single process = simpler deployment, no port conflicts, shared auth context, easier debugging |
| **Room Type for Chat** | One `IslandRoom` containing chat state | Separate `ChatRoom` + `IslandRoom` | Chat belongs in the world, not a silo; simpler to later add player presence and world state to the same room |
| **State Authority** | Server mutates schema state; client sends requests | Client-side state, server broadcast | Server authority = correct multiplayer model, prevents desync, enables later prediction/reconciliation |
| **Chat Persistence** | In-memory 50-message backlog during room lifetime | Database persistence | Proof focus: test synchronization, not storage; persistence is Phase 2+ decision |
| **Keyboard Guard Placement** | Both Phaser `update()` loop and global `keyboard.on(DOWN)` handlers | Guard only `update()` | Global handlers fire outside update loop; must guard both paths independently |
| **Message Validation** | Zod + `validate()` on server | Client-only validation or manual checks | Server authority requires server validation; Zod aligns with project patterns |
| **Typing Decorators Config** | Only in `packages/shared/tsconfig.json` | Global tsconfig or per-file | Prevents schema decorator breakage; avoids unintended side effects on unrelated packages |
| **Client Networking Boundary** | `MultiplayerManager` (only code allowed to call Colyseus) | React/Phaser call Colyseus directly | Single boundary = maintainability, testability, easy to swap transport layer later |
| **Communication Bridge** | Extend typed `gameBridge` with `chat:message` and `chat:send` events | Direct Colyseus references in UI | Preserves existing event-bus pattern, keeps transport details internal |
| **Chat UI Mount** | `GamePage.tsx` only | Multiple mounts, `MatchPage`, loose instances | Single mount = no duplicate listeners, clean lifecycle, clear ownership |
| **Scale-Aware Layout** | Use existing `ScaleManager` subscription model | Direct `game.scale` access or hardcoded vmin | Respects project's viewport conventions, reuses proven scale handling |
| **Caddy Routing** | Add `/matchmake*` handler, preserve existing routes | Move REST routes, change reverse_proxy, introduce second upstream | Minimal change, backwards compatible, no disruption to existing API |
| **Acceptance Test** | Binary two-tab smoke test (T8 conditions) | "Subjective look and feel" or "more features prove it works" | Binary, repeatable, automated; scope-locked; separates proof from feature expansion |

---

## Implementation Specification

### Phase 1: Compatibility and Server Spike (T0)

**Goal:** Verify that Colyseus WebSocket server can attach to the existing `@hono/node-server` without breaking the API or introducing a second process/port.

**Tasks:**

- [ ] **T0.1:** Inspect `package.json` in `apps/api` and identify the installed `colyseus` and `@colyseus/ws-transport` versions (or note that they are not yet installed).
- [ ] **T0.2:** Cross-reference the installed server version with the official Colyseus documentation to determine the compatible client package: `@colyseus/sdk` or `colyseus.js`. Document the decision with the exact version.
- [ ] **T0.3:** Review `apps/api/src/index.ts` to understand the current Hono/`@hono/node-server` setup and where the Node `http.Server` is created or passed.
- [ ] **T0.4:** Create a minimal spike branch that:
  - Imports `defineServer` and `defineRoom` from the installed Colyseus version.
  - Imports `WebSocketTransport` from `@colyseus/ws-transport`.
  - Attaches `WebSocketTransport({server: httpServer})` to the existing HTTP server.
  - Defines a minimal test room (can be empty `IslandRoom` for now).
  - Logs "Colyseus attached" without creating a second `listen()` call or changing the API port.
- [ ] **T0.5:** Build `apps/api` and verify:
  - Zero compilation errors.
  - Server starts with one listening port (4000).
  - Existing Hono routes remain functional (test `GET /health` or an existing REST endpoint).
  - No second process or port is opened.
- [ ] **T0.6:** Test WebSocket transport connectivity:
  - Use a browser console, `wscat`, or a simple Colyseus client test to attempt a connection to `ws://localhost:4000/matchmake/island`.
  - Confirm the connection reaches the server without routing errors.
- [ ] **T0.7:** Document:
  - The exact Node `http.Server` variable name and how it's created.
  - The Colyseus server version and client package name.
  - The import paths used for `defineServer`, `defineRoom`, and `WebSocketTransport`.
  - The callback/state-sync API used by the installed client version.
  - Any version mismatches or compatibility concerns.

**Deliverable:** Spike branch with Colyseus attached and minimal connectivity verified. One `listen()`, one port, existing API working.

**Validation:**
```bash
npm run build  # apps/api compiles
# Server starts on port 4000 only
# GET /health or existing endpoint works
# wscat -c ws://localhost:4000/matchmake/island reaches the server
```

---

### Phase 1: Shared Schema (T1)

**Goal:** Define the runtime-safe chat schema in the shared package so both server and client can compile, import, and use the same types.

**Tasks:**

- [ ] **T1.1:** Create `packages/shared/src/multiplayer/` directory if it does not exist.
- [ ] **T1.2:** Create `packages/shared/src/multiplayer/ChatMessage.ts`:

```typescript
import { Schema, type } from "@colyseus/schema";

export class ChatMessage extends Schema {
  @type("string") sessionId: string = "";
  @type("string") name: string = "";
  @type("string") text: string = "";
  @type("number") ts: number = 0;
}
```

- [ ] **T1.3:** Create `packages/shared/src/multiplayer/IslandRoomState.ts`:

```typescript
import { Schema, type, ArraySchema } from "@colyseus/schema";
import { ChatMessage } from "./ChatMessage.js";

export class IslandRoomState extends Schema {
  @type([ChatMessage]) messages = new ArraySchema<ChatMessage>();
}
```

- [ ] **T1.4:** Update `packages/shared/src/index.ts` to export the schema classes (not as type-only imports):

```typescript
// ... existing exports ...
export { ChatMessage, IslandRoomState } from "./multiplayer/IslandRoomState.js";
```

- [ ] **T1.5:** Verify `packages/shared/tsconfig.json` includes:

```json
{
  "extends": "../tsconfig/base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "composite": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  },
  "include": ["src/**/*"]
}
```

**Do NOT add these options to any other `tsconfig.json` file.**

- [ ] **T1.6:** Build the shared package:

```bash
cd packages/shared
npm run build  # or equivalent
npx tsc --noEmit
```

Verify zero errors.

- [ ] **T1.7:** Verify that `apps/api` can import and use `IslandRoomState`:

```bash
cd apps/api
npx tsc --noEmit
# Should resolve @kleeblatt/shared imports without errors
```

**Deliverable:** Schema classes defined, exported, and type-checkable in both `apps/api` and `apps/web`.

**Validation:**
```bash
# packages/shared builds
cd packages/shared && npm run build

# apps/api can import IslandRoomState
# apps/web can import ChatMessage
# No "decorator" or "@type is undefined" errors
```

---

### Phase 1: Server IslandRoom (T2)

**Goal:** Implement the authoritative room that validates, mutates, and broadcasts chat state.

**Tasks:**

- [ ] **T2.1:** Create `apps/api/src/rooms/IslandRoom.ts`:

```typescript
import { Room, Client, validate } from "colyseus";
import { z } from "zod";
import { ChatMessage, IslandRoomState } from "@kleeblatt/shared";

type IslandClient = Client<{ userData: { name: string } }>;

const MAX_MESSAGES = 50;
const RATE_LIMIT_MS = 300;

function stripControlChars(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x1F\x7F]/g, "");
}

export class IslandRoom extends Room {
  state = new IslandRoomState();

  private lastMessageAt = new Map<string, number>();

  messages = {
    chat: validate(
      z.object({
        text: z.string().trim().min(1, "empty").max(200, "too long"),
      }),
      function (this: IslandRoom, client: IslandClient, message) {
        // Rate limit
        const last = this.lastMessageAt.get(client.sessionId) ?? 0;
        if (Date.now() - last < RATE_LIMIT_MS) return;
        this.lastMessageAt.set(client.sessionId, Date.now());

        const text = stripControlChars(message.text);
        if (!text) return;

        const chatMessage = new ChatMessage();
        chatMessage.sessionId = client.sessionId;
        chatMessage.name =
          client.userData?.name ?? `Guest-${client.sessionId.slice(0, 4)}`;
        chatMessage.text = text;
        chatMessage.ts = Date.now();

        this.state.messages.push(chatMessage);

        // Cap at MAX_MESSAGES
        while (this.state.messages.length > MAX_MESSAGES) {
          this.state.messages.shift();
        }
      }
    ),
  };

  onJoin(client: IslandClient, options: { name?: string }) {
    const raw =
      typeof options.name === "string" ? options.name.trim() : "";
    client.userData = {
      name: raw.slice(0, 20) || `Guest-${client.sessionId.slice(0, 4)}`,
    };
    console.log(
      `[IslandRoom] Client ${client.sessionId} joined as "${client.userData.name}"`
    );
  }

  onLeave(client: IslandClient) {
    this.lastMessageAt.delete(client.sessionId);
    console.log(`[IslandRoom] Client ${client.sessionId} left`);
  }

  onDispose() {
    this.lastMessageAt.clear();
    console.log("[IslandRoom] Disposed");
  }

  onUncaughtException(err: Error, methodName: string) {
    console.error(`[IslandRoom] ${methodName}:`, err.message);
    // Do NOT rethrow; allow room to continue
  }
}
```

- [ ] **T2.2:** Update `apps/api/src/index.ts` to register `IslandRoom`:

The existing Hono setup should look something like:

```typescript
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
const httpServer = serve({ fetch: app.fetch, port: env.port });

// AFTER this point, attach Colyseus:
import { defineServer, defineRoom } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { IslandRoom } from "./rooms/IslandRoom.js";

defineServer({
  rooms: {
    island: defineRoom(IslandRoom),
  },
  transport: new WebSocketTransport({ server: httpServer }),
});

console.info(`API + Colyseus listening on http://localhost:${env.port}`);
```

**Important:** The `httpServer` returned by `serve()` must be captured and passed to `WebSocketTransport`. Do not call `listen()` a second time.

- [ ] **T2.3:** Add `.env.example` entry (or update existing):

```
VITE_COLYSEUS_URL=http://localhost:4000
```

- [ ] **T2.4:** Build and test the room:

```bash
cd apps/api
npm run build
npm run dev  # or start

# In another terminal:
npx ts-node -e "
const Colyseus = require('colyseus.js');
(async () => {
  const client = new Colyseus.Client('ws://localhost:4000');
  const room = await client.joinOrCreate('island', {name: 'TestPlayer'});
  console.log('Joined room:', room.id);
  room.send('chat', {text: 'Hello'});
  setTimeout(() => {
    console.log('Messages:', room.state.messages.length);
    room.leave();
    process.exit(0);
  }, 500);
})();
"
```

Expected output: "Joined room: [id]" and "Messages: 1"

**Deliverable:** `IslandRoom` implemented, registered, and validated with a single-client test.

**Validation:**
```bash
# Build succeeds
npm run build

# Room accepts a join with a name
# Room validates chat message payload
# Room rejects empty or oversized text
# Room caps at 50 messages
# Room handles invalid payload without crashing
# Server logs onJoin, onLeave, onUncaughtException events
```

---

### Phase 1: Client MultiplayerManager (T3)

**Goal:** Create the single network boundary so React and Phaser never call Colyseus directly.

**Tasks:**

- [ ] **T3.1:** Create `apps/web/src/game/multiplayer/MultiplayerManager.ts`:

```typescript
import { Client, Callbacks } from "@colyseus/sdk";
// NOTE: If the spike determined @colyseus/sdk is wrong, use the verified package name
import { gameBridge } from "@kleeblatt/shared";
import type { IslandRoomState } from "@kleeblatt/shared";

export class MultiplayerManager {
  private room?: Awaited<ReturnType<Client["joinOrCreate"]>>;
  private client?: Client;
  private callbacks?: ReturnType<typeof Callbacks.get>;

  async connect(colyseusUrl: string, playerName: string): Promise<void> {
    if (this.room) {
      console.warn("[MultiplayerManager] Already connected");
      return;
    }

    this.client = new Client(colyseusUrl);
    this.room = await this.client.joinOrCreate<IslandRoomState>("island", {
      name: playerName,
    });

    this.callbacks = Callbacks.get(this.room);

    // Listen for new messages
    this.callbacks.onAdd("messages", (msg) => {
      gameBridge.emit("chat:message", {
        name: msg.name,
        text: msg.text,
        ts: msg.ts,
      });
    });

    console.log("[MultiplayerManager] Connected to island room");
  }

  sendChat(text: string): void {
    if (!this.room) {
      console.error("[MultiplayerManager] Not connected");
      return;
    }
    this.room.send("chat", { text });
  }

  disconnect(): void {
    if (this.callbacks) {
      // Clean up listeners if needed
      this.callbacks = undefined;
    }
    if (this.room) {
      this.room.leave();
      this.room = undefined;
    }
    if (this.client) {
      this.client = undefined;
    }
    console.log("[MultiplayerManager] Disconnected");
  }

  isConnected(): boolean {
    return !!this.room && this.room.connection?.isOpen;
  }
}

export const multiplayerManager = new MultiplayerManager();
```

- [ ] **T3.2:** Extend `packages/shared/src/gameBridge.ts` with new event types:

```typescript
export type GameBridgeEvents = {
  // ... existing events ...

  // Multiplayer chat
  "chat:message": { name: string; text: string; ts: number };
  "chat:send": { text: string };
};
```

Verify that the existing `gameBridge.ts` file has this interface and that you are extending it, not replacing it.

- [ ] **T3.3:** Create `apps/web/src/game/multiplayer/index.ts` to export:

```typescript
export { MultiplayerManager, multiplayerManager } from "./MultiplayerManager.js";
```

- [ ] **T3.4:** Verify `apps/web` can import the manager and types:

```bash
cd apps/web
npx tsc --noEmit
# Should resolve ChatMessage and IslandRoomState without errors
```

**Deliverable:** `MultiplayerManager` as the single network boundary. React and Phaser can now safely emit/listen to `gameBridge` events without touching Colyseus.

**Validation:**
```bash
# apps/web builds without errors
# MultiplayerManager.connect() can be called in isolation
# gameBridge events are typed and do not use `any`
# No Colyseus imports outside MultiplayerManager
```

---

### Phase 1: gameBridge Extension (Part of T3)

**Subtask:** Ensure `chat:message` and `chat:send` are fully typed in `GameBridgeEvents`.

- [ ] Verify the current `packages/shared/src/gameBridge.ts` file.
- [ ] Add or update the interface:

```typescript
export type GameBridgeEvents = {
  // ... existing events ...

  /**
   * Emitted when a chat message is received from the server.
   * Server-authoritative; do not emit from client except through MultiplayerManager.
   */
  "chat:message": { name: string; text: string; ts: number };

  /**
   * Emitted when the client wishes to send a chat message.
   * Caught by MultiplayerManager, sent to IslandRoom, validated server-side.
   */
  "chat:send": { text: string };
};
```

- [ ] Verify that all bridge types are re-exported from `packages/shared/src/index.ts`.

---

### Phase 1: Chat UI and Mounting (T4 + T5)

**Goal:** Mount a polished, scale-aware chat widget on `GamePage.tsx` that communicates only through `gameBridge`.

**Tasks:**

- [ ] **T4.1:** Create `apps/web/src/components/ChatWidget.tsx`:

```typescript
import React, { useEffect, useRef, useState } from "react";
import { gameBridge } from "@kleeblatt/shared";
import "./ChatWidget.css";

interface Message {
  name: string;
  text: string;
  ts: number;
}

export const ChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Listen for incoming messages
    const unsubMessage = gameBridge.on("chat:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      unsubMessage();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    gameBridge.emit("chat:send", { text });
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="chat-container">
      <button
        className="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle chat"
      >
        💬
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>Island Chat</h3>
            <button
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className="chat-message">
                <span className="chat-time">[{formatTime(msg.ts)}]</span>
                <span className="chat-name">{msg.name}:</span>
                <span className="chat-text">{msg.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
              disabled={!isConnected}
            />
            <button
              className="chat-send"
              onClick={handleSend}
              disabled={!inputValue.trim() || !isConnected}
              aria-label="Send message"
            >
              Send
            </button>
          </div>

          {!isConnected && (
            <div className="chat-status">Connecting...</div>
          )}
        </div>
      )}
    </div>
  );
};
```

- [ ] **T4.2:** Create `apps/web/src/components/ChatWidget.css`:

```css
.chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  font-family: Arial, sans-serif;
  z-index: 1000;
  /* Will be overridden by scale-aware variables if available */
  --chat-width: 320px;
  --chat-height: 400px;
}

.chat-toggle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #4a9eff;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}

.chat-toggle:hover {
  background: rgba(0, 0, 0, 0.9);
}

.chat-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: clamp(260px, var(--chat-width), 380px);
  height: clamp(220px, var(--chat-height), 480px);
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #4a9eff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #4a9eff;
}

.chat-header h3 {
  margin: 0;
  color: #4a9eff;
  font-size: 14px;
}

.chat-close {
  background: none;
  border: none;
  color: #4a9eff;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-message {
  font-size: 12px;
  color: #e0e0e0;
  line-height: 1.4;
  word-wrap: break-word;
}

.chat-time {
  color: #888;
  margin-right: 4px;
}

.chat-name {
  color: #4a9eff;
  font-weight: bold;
  margin-right: 4px;
}

.chat-text {
  color: #e0e0e0;
}

.chat-input-container {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-top: 1px solid #4a9eff;
}

.chat-input {
  flex: 1;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #4a9eff;
  color: #e0e0e0;
  border-radius: 4px;
  font-size: 12px;
}

.chat-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-send {
  padding: 6px 12px;
  background: #4a9eff;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: background 0.2s;
}

.chat-send:hover:not(:disabled) {
  background: #2e8dd8;
}

.chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-status {
  padding: 8px;
  font-size: 12px;
  color: #ffa500;
  text-align: center;
  border-top: 1px solid #ffa500;
}
```

- [ ] **T4.3:** Mount `ChatWidget` in `apps/web/src/pages/GamePage.tsx`:

Add this import at the top:

```typescript
import { ChatWidget } from "../components/ChatWidget.js";
```

Add this component to the JSX (before or after the Phaser container, but in the same return):

```typescript
<ChatWidget />
```

Example structure:

```typescript
export const GamePage: React.FC = () => {
  return (
    <>
      <div id="phaser-container" />
      <ChatWidget />
    </>
  );
};
```

- [ ] **T5.1:** Integrate with `ScaleManager` for scale-aware sizing.

In `apps/web/src/game/managers/ScaleManager.ts` (or wherever scale events are managed), add:

```typescript
// In ScaleManager or the existing scale event subscription:
onResize(displayWidth: number, displayHeight: number) {
  document.documentElement.style.setProperty(
    "--chat-width",
    `${Math.round(displayWidth * 0.3)}px`
  );
  document.documentElement.style.setProperty(
    "--chat-height",
    `${Math.round(displayHeight * 0.45)}px`
  );
}
```

Or, if the project uses a different scale event pattern, subscribe to the scale manager's resize events and update the CSS variables.

The chat widget CSS already includes:

```css
width: clamp(260px, var(--chat-width), 380px);
height: clamp(220px, var(--chat-height), 480px);
```

This ensures the panel remains responsive to the game viewport.

- [ ] **T5.2:** Verify the chat widget builds and types:

```bash
cd apps/web
npx tsc --noEmit
npm run build
```

**Deliverable:** Chat widget mounted on `GamePage.tsx`, scale-aware, styled, and communicates only through `gameBridge`.

**Validation:**
```bash
# apps/web builds
# ChatWidget renders without errors
# gameBridge.emit("chat:message", ...) updates the message list
# gameBridge.emit("chat:send", ...) can be triggered
# CSS variables --chat-width and --chat-height are respected
# Widget is responsive to viewport resize
```

---

### Phase 1: Input Guard (T6)

**Goal:** Prevent chat typing from leaking into gameplay, protecting both the Phaser `update()` loop and global keyboard handlers.

**Tasks:**

- [ ] **T6.1:** Create the `isTypingInInput()` helper. Add it to `apps/web/src/game/input/DesktopKeyboardController.ts`:

```typescript
/**
 * Returns true if the currently focused element is a text input.
 * Used to suppress gameplay input while the user is typing in chat or other dialogs.
 */
function isTypingInInput(): boolean {
  const active = document.activeElement;
  return !!active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
}
```

- [ ] **T6.2:** Apply the guard to the `update()` method of `DesktopKeyboardController`:

```typescript
update(): void {
  if (!this.cursors) return;

  // Guard: suppress movement if typing
  if (isTypingInInput()) {
    this.inputController.setMoveVector(0, 0);
    return;
  }

  // Existing movement logic
  const left = this.cursors.left.isDown || this.wasd.left.isDown;
  const right = this.cursors.right.isDown || this.wasd.right.isDown;
  const up = this.cursors.up.isDown || this.wasd.up.isDown;
  const down = this.cursors.down.isDown || this.wasd.down.isDown;

  const x = (left ? -1 : 0) + (right ? 1 : 0);
  const y = (up ? -1 : 0) + (down ? 1 : 0);

  this.inputController.setMoveVector(x, y);
}
```

- [ ] **T6.3:** Apply the guard to the global `E` (interact) handler:

```typescript
private onInteract(): void {
  if (isTypingInInput()) return;  // Guard before action
  this.eventTarget.emit(InputEvents.INTERACT);
}
```

- [ ] **T6.4:** Apply the guard to the global `I` (questbook) handler:

```typescript
private onQuestbook(): void {
  if (isTypingInInput()) return;  // Guard before action
  this.eventTarget.emit(InputEvents.OPEN_QUESTBOOK);
}
```

- [ ] **T6.5:** Apply the guard to the global `Esc` (cancel) handler:

```typescript
private onCancel(): void {
  if (isTypingInInput()) return;  // Guard before action
  this.inputController.cancelMovement();
  this.eventTarget.emit(InputEvents.CANCEL);
}
```

- [ ] **T6.6:** Build and verify:

```bash
cd apps/web
npm run build
npx tsc --noEmit
```

**Deliverable:** `isTypingInInput()` guard applied to both `update()` and global handlers.

**Validation:**
```bash
# apps/web builds
# Focus ChatWidget input
# Type movement keys (W, A, S, D, arrows) → no movement occurs
# Type E → no interaction fires
# Type I → no questbook opens
# Type Esc → no cancel fires
# Blur input
# Same keys now work normally
```

---

### Phase 1: Caddy Routing (T7)

**Goal:** Add the `/matchmake*` proxy route to Caddy so WebSocket connections can reach Colyseus.

**Tasks:**

- [ ] **T7.1:** Locate the staging/deployment Caddy configuration file, typically at:

```
infra/caddy/Caddyfile
```

or similar.

- [ ] **T7.2:** Find the existing block for the game domain (e.g., `stage.kleeblatt.space` or a local equivalent).

- [ ] **T7.3:** Add this route inside the domain block, near the existing `/api/*` routes:

```caddyfile
handle /matchmake* {
    reverse_proxy 127.0.0.1:4000
}
```

Example full context (do not replace the entire file, only add the `/matchmake*` block):

```caddyfile
(kleeblatt_logs) {
  # existing logging config
}

stage.kleeblatt.space {
  # existing routes
  handle /api/* {
    reverse_proxy 127.0.0.1:4000
  }
  handle /auth/* {
    reverse_proxy 127.0.0.1:4000
  }
  handle /health {
    reverse_proxy 127.0.0.1:4000
  }
  handle /me {
    reverse_proxy 127.0.0.1:4000
  }

  # NEW: Colyseus WebSocket endpoint
  handle /matchmake* {
    reverse_proxy 127.0.0.1:4000
  }

  # Other existing routes (static files, etc.)
  handle {
    reverse_proxy 127.0.0.1:3000  # or wherever the web frontend is
  }
}
```

- [ ] **T7.4:** Verify the Caddy config (if Caddy provides a validation command):

```bash
caddy validate --config infra/caddy/Caddyfile
```

Or reload Caddy to test:

```bash
caddy reload --config infra/caddy/Caddyfile
```

- [ ] **T7.5:** Test WebSocket connectivity through Caddy:

From localhost or the stage URL:

```bash
wscat -c ws://stage.kleeblatt.space/matchmake/island
# Or if testing locally:
wscat -c ws://localhost:4000/matchmake/island
```

Should connect without a 404 or timeout.

**Deliverable:** Caddy routes `/matchmake*` to the API process; WebSocket upgrade is preserved.

**Validation:**
```bash
# Caddy config is valid
# /matchmake endpoint is reachable through Caddy
# WebSocket upgrade works (wscat connects)
# Existing /api/*, /health, etc., routes still work
# No 404 or 502 errors for /matchmake*
```

---

### Phase 1: Two-Tab Acceptance Test (T8)

**Goal:** Verify end-to-end that the multiplayer chat proof works correctly.

**Tasks:**

Run this test manually or create an automated test script. The test is binary: all conditions must pass.

- [ ] **T8.1:** Start the API server:

```bash
cd apps/api
npm run dev
```

Wait for logs showing:
```
API + Colyseus listening on http://localhost:4000
```

- [ ] **T8.2:** Start the web dev server in another terminal:

```bash
cd apps/web
npm run dev
```

Wait for the game to be reachable (e.g., `http://localhost:5173` or the configured port).

- [ ] **T8.3:** Open **Tab A** to the game.

- [ ] **T8.4:** Open **Tab B** to the same game (same URL, separate tab).

- [ ] **T8.5:** Verify both tabs are connected:

Check the browser console for no errors. If `ChatWidget` has a "Connecting..." status, wait for it to clear.

- [ ] **T8.6:** Send a message from **Tab A**:

- Click the chat toggle (💬).
- Type "Hello from Tab A" in the input.
- Press Enter or click Send.
- Verify the message appears in **Tab A**'s message list immediately.

- [ ] **T8.7:** Verify **Tab B** receives the message:

- Within **300 ms**, the same message should appear in **Tab B**'s message list.
- Sender name and timestamp should be visible.
- Example format: `[14:05] TestPlayer: Hello from Tab A`

- [ ] **T8.8:** Send a message from **Tab B**:

- Click the chat toggle.
- Type "Reply from Tab B".
- Press Enter.
- Verify it appears in both **Tab A** and **Tab B**.

- [ ] **T8.9:** Test message history after reload:

- In **Tab B**, send 5 more messages so the history has ~7 messages total.
- Refresh **Tab B** (F5 or Cmd+R).
- Wait for the page to reload and reconnect.
- Verify all ~7 messages are restored in the message list.

- [ ] **T8.10:** Verify room isolation (if multi-room is supported):

If the application supports joining different islands/worlds:

- Have Tab A stay on "Island A".
- Have Tab B join "Island B" (if UI supports it).
- Send a message in Tab A.
- Verify the message does **not** appear in Tab B.

If only one room is supported, skip this test and mark as N/A.

- [ ] **T8.11:** Test keyboard input isolation:

- In Tab A or B, focus the chat input.
- Type the letter `E`.
- Verify that no interaction/NPC dialog opens.
- Type `I`.
- Verify that the questbook/inventory does not open.
- Type `Escape`.
- Verify that the chat panel closes (from React, not from a game cancel action).
- Click somewhere outside the input to blur it.
- Type `E` again.
- Verify that the interaction/NPC dialog **does** open (confirming the guard works bidirectionally).

- [ ] **T8.12:** Test rate limiting:

- In Tab A, send two messages within 100 milliseconds (very fast).
- Expected behavior: the first message appears, the second is silently rejected by the server.
- Wait 300 ms.
- Send a third message.
- Expected behavior: it appears normally.

- [ ] **T8.13:** Test invalid payloads:

In the browser console, manually call:

```javascript
// Assuming multiplayerManager is exported
multiplayerManager.room.send("chat", {text: null});
multiplayerManager.room.send("chat", {text: ""});
multiplayerManager.room.send("chat", {text: "a".repeat(300)});
```

Expected behavior: all are silently rejected by the server. The room should remain operational and accept the next valid message.

- [ ] **T8.14:** Verify existing REST API still works:

Open a terminal and test an existing endpoint:

```bash
curl http://localhost:4000/health
```

Expected: 200 OK and valid response.

Or test the existing match endpoint:

```bash
curl -X POST http://localhost:4000/match/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"test"}'
```

Expected: valid response or auth error, not a Colyseus conflict.

- [ ] **T8.15:** Check server logs for expected events:

The server should log:

```
[IslandRoom] Client [sessionId] joined as "[name]"
[IslandRoom] Client [sessionId] left
```

Verify these appear for both tabs' join/leave cycle.

- [ ] **T8.16:** Verify no second process or port is listening:

```bash
lsof -i -P -n | grep LISTEN
# or
netstat -tulpn | grep LISTEN
```

Expected: one process listening on port 4000 (the API server). No port 2567, 8787, or other multiplayer-related port.

- [ ] **T8.17:** Build all packages and run type checking:

```bash
cd packages/shared && npm run build && npx tsc --noEmit
cd apps/api && npm run build && npx tsc --noEmit
cd apps/web && npm run build && npx tsc --noEmit
```

Expected: zero errors in all three builds.

**Deliverable:** All 17 checks pass. The two-tab chat proof is complete.

**Validation Checklist:**
- [ ] Both tabs join the same `IslandRoom` instance
- [ ] Message sent from Tab A appears in Tab B within 300 ms
- [ ] Message sent from Tab B appears in Tab A
- [ ] Sender name and timestamp are visible and correct
- [ ] Reload Tab B → message history is restored (last 50 messages)
- [ ] Separate room instances do not share messages (if applicable)
- [ ] Typing `E` in chat input does not trigger interaction
- [ ] Typing `I` in chat input does not trigger questbook
- [ ] Typing `Esc` in chat input closes the chat (React-level, not game)
- [ ] Blurring input → `E`, `I`, `Esc` work normally again
- [ ] Sending two messages within 300 ms → second is rate-limited
- [ ] Sending invalid payloads (`{text: null}`, oversized, empty) → no crash, room operational
- [ ] Existing REST endpoints (`/health`, `/match/start`) still work
- [ ] Server logs show `onJoin` and `onLeave` events
- [ ] No second process or port is open
- [ ] All three packages build and type-check without errors
- [ ] Chat UI is responsive, styled, and accessible

---

## Phased Implementation

### Phase 1: MVP Chat Proof (Weeks 1–3)

**Goal:** Complete a working, two-tab chat proof that demonstrates server-authoritative room instancing, schema sync, keyboard isolation, and end-to-end integration.

**Tasks:**
- [ ] T0: Server spike and compatibility verification
- [ ] T1: Shared schema definition
- [ ] T2: `IslandRoom` implementation
- [ ] T3: `MultiplayerManager` client boundary
- [ ] T4: `ChatWidget` and mounting
- [ ] T5: Scale-aware sizing
- [ ] T6: Input guard (keyboard isolation)
- [ ] T7: Caddy routing
- [ ] T8: Two-tab acceptance test

**Deliverable:** A fully working, deployed chat on the starter island that proves Colyseus room instancing. Player names visible, messages synchronized, history restored after reload, input protected.

**Validation:** All T8 checks pass. Build and type checking green.

---

### Phase 1.5: Optional UI Polish (Days 3–5 after Phase 1 passes)

**Goal:** Refine the chat UI styling, animations, and basic usability without changing networking or architecture.

**Changes (discretionary, non-blocking):**
- Better visual contrast and design tokens.
- Smooth fade-in/out for the chat panel.
- Keyboard shortcuts for toggle (e.g., Shift+C).
- Sound effects for new messages (optional).
- Display "2 players in this room" or room instance ID for credibility.

**Non-changes:**
- Do not refactor the networking boundary.
- Do not add persistence or database.
- Do not add new message types (emotes, typing indicators).
- Do not change the mount point or lifecycle.
- Do not add movement synchronization.

**Validation:** T8 checks still pass. Build and type checking still green.

---

### Phase 2: Movement Synchronization (Weeks 4–7, after Phase 1 passes)

**Goal:** Add player position/movement synchronization using message-based input, server validation, and client-side prediction/reconciliation.

**Scope (deferred):**
- Player presence in `IslandRoomState`.
- Movement input messages (`room.send("move", ...)`).
- Server-side movement validation.
- Client-side prediction and interpolation.
- Collision detection and world bounds.
- Lobby or multi-room support.

**Blocking condition:** Phase 2 does **not** start until Phase 1 is complete and merged.

---

### Phase 3+: Advanced Features (Weeks 8+, after Phase 2)

**Scope (deferred):**
- Persistence (database history).
- User authentication refinements.
- Emotes, typing indicators, user status.
- Inventory and item synchronization.
- NPC interactions and world state.
- Scaling and Redis for multiple API instances.

---

## Integration Points

### External Dependencies

| Dependency | Purpose | Documentation | Risk Level |
|------------|---------|---------------|------------|
| Colyseus Server v0.17 | Authoritative room-based multiplayer layer | https://docs.colyseus.io/ | Low (stable API) |
| @colyseus/schema v0.17 | Runtime-safe state definitions | https://docs.colyseus.io/state/ | Low (proven pattern) |
| @colyseus/ws-transport v0.17 | WebSocket transport for Colyseus | https://docs.colyseus.io/deployment/ | Low (standard transport) |
| @colyseus/sdk or colyseus.js | Browser client (TBD in T0) | https://docs.colyseus.io/client/ | Medium (version must match server) |
| Zod | Schema validation (already in project) | https://zod.dev/ | Low (existing dependency) |
| @hono/node-server | HTTP server (already in project) | https://hono.dev/ | Low (existing infrastructure) |
| Caddy | Reverse proxy with WebSocket support (already in project) | https://caddyserver.com/ | Low (existing infrastructure) |

### Internal Dependencies

| System | Dependency | Critical? | Notes |
|--------|-----------|-----------|-------|
| T0 Spike | Hono HTTP server startup, node `http.Server` availability | Yes | Must verify WebSocketTransport can attach to existing server |
| T1 Schema | `packages/shared` build process, TypeScript config | Yes | Decorator settings must be in shared/tsconfig.json only |
| T2 IslandRoom | `apps/api` build, Colyseus server registration | Yes | Room must be registered in `defineServer()` config |
| T3 MultiplayerManager | `apps/web` client build, Colyseus client package version | Yes | Package name verified in T0 |
| T4 ChatWidget | React component system, CSS module system | Yes | Must mount correctly in GamePage.tsx |
| T5 Scale-aware sizing | Existing `ScaleManager` in apps/web | Yes | Cannot use direct `game.scale` access |
| T6 Keyboard guard | Existing `DesktopKeyboardController.ts`, keyboard event system | Yes | Must guard both update() and global handlers |
| T7 Caddy routing | Existing Caddy configuration file | Yes | Must not break existing routes |
| T8 Two-tab test | All of the above working together | Yes | Gate for Phase 2 start |

---

## Testing Strategy

### Unit Tests

Not required for the proof milestone. Each server handler (chat validation, rate limit) can be unit-tested after Phase 1, but the proof itself is end-to-end.

### Integration Tests

Create or document:

```typescript
// apps/api/src/rooms/IslandRoom.test.ts (pseudo-code)

describe("IslandRoom", () => {
  it("validates chat message payload", async () => {
    const msg = { text: "" };
    // Should reject
  });

  it("strips control characters", async () => {
    const msg = { text: "hello\x00world" };
    // Should strip \x00 and store "helloworld"
  });

  it("enforces 50-message cap", async () => {
    // Add 51 messages, verify only 50 remain
  });

  it("rate-limits per client", async () => {
    // Send two messages within 300ms from same client
    // Verify second is rejected
  });

  it("handles invalid payload without crash", async () => {
    // Send {text: null}, {text: undefined}, etc.
    // Verify room remains operational
  });
});
```

### Validation Checklist

**Build & Type Checking:**
- [ ] `packages/shared` builds without errors
- [ ] `apps/api` builds without errors
- [ ] `apps/web` builds without errors
- [ ] No TypeScript `any` types in `GameBridgeEvents` or `MultiplayerManager`
- [ ] Schema classes are runtime exports, not type-only

**Server:**
- [ ] `IslandRoom` registers in `defineServer()` config
- [ ] Room accepts join with `{name}` option
- [ ] Chat message validation rejects empty, oversized, control-char-filled text
- [ ] Rate limit enforces 300ms per client
- [ ] Invalid payloads do not crash room
- [ ] `onJoin`, `onLeave`, `onDispose` are implemented
- [ ] No second port is opened

**Client:**
- [ ] `MultiplayerManager` is the only Colyseus caller
- [ ] `chat:message` and `chat:send` are typed in `GameBridgeEvents`
- [ ] React and Phaser do not import Colyseus directly
- [ ] `ChatWidget` mounts in `GamePage.tsx`
- [ ] `ScaleManager` is used for sizing, not direct `game.scale`

**UI:**
- [ ] Chat widget renders messages with name and timestamp
- [ ] Enter key sends message
- [ ] Esc key closes panel
- [ ] Input is disabled while disconnected
- [ ] Styling respects project conventions

**Input Isolation:**
- [ ] `isTypingInInput()` blocks movement in `update()`
- [ ] `isTypingInInput()` blocks `E`, `I`, `Esc` handlers
- [ ] Blurring input restores normal controls
- [ ] Existing gameplay is not regressed

**Routing:**
- [ ] Caddy `/matchmake*` route is present
- [ ] WebSocket connections reach Colyseus
- [ ] Existing `/api/*` routes still work

**Two-Tab Test:**
- [ ] Tab A sends → Tab B receives within 300ms
- [ ] Tab B sends → Tab A receives
- [ ] Reload → history is restored
- [ ] Separate rooms don't share messages
- [ ] Invalid payloads don't crash

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Colyseus server and client package mismatch** | Medium | High (Project cannot start) | T0 spike explicitly verifies package names and versions before proceeding |
| **WebSocketTransport cannot attach to existing Hono server** | Medium | High (Architecture broken) | T0 spike tests attachment before feature work; fallback: create server separately if needed |
| **TypeScript decorator compilation fails** | Low | High (Schema types break) | tsconfig.json settings are isolated to shared package; verified in T1 build |
| **Keyboard guards incomplete (only `update()`, miss global handlers)** | Medium | Medium (Gameplay actions leak from chat) | T6 explicitly applies guard in both paths; T8 tests all three keys |
| **Chat widget does not mount or remounts on every render** | Low | Medium (Duplicate listeners, messages doubled) | Clear lifecycle in `MultiplayerManager`; dependency on `gameBridge` subscriptions, not React state |
| **Caddy routing breaks existing REST API** | Low | Medium (API offline) | Change is additive (new `/matchmake*` block); existing routes are not moved or removed |
| **Rate limit or validation is weak and allows abuse** | Low | Low (Chat proof still works, just less safe) | Zod validation is strict; 300ms cooldown is enforced server-side; not a proof blocker |
| **Build artifacts or dev dependencies conflict** | Low | Low (Build takes longer to debug) | Monorepo is existing; shared package is existing; isolation is clean |
| **Reload/reconnect creates duplicate message listeners** | Low | Medium (Messages appear twice) | `MultiplayerManager` cleans up callbacks on disconnect; test reconnects in T8 |

---

## Open Questions

Must be resolved before or during implementation. If discovered, halt and document the blocker.

- [ ] **T0.1:** Which Colyseus client package is compatible with v0.17 in this repository: `@colyseus/sdk` or `colyseus.js`?
- [ ] **T0.2:** Is the Node `http.Server` created by `@hono/node-server` available to be passed to `WebSocketTransport`, or does Colyseus require a separate server?
- [ ] **T1.1:** Does the repository's shared package build tool expect a specific directory structure or export pattern for multiplayer types?
- [ ] **T2.1:** What is the exact import path for `validate()` in Colyseus v0.17? (E.g., `colyseus/validate` vs `colyseus` directly.)
- [ ] **T3.1:** Does the project use a specific pattern for singletons like `multiplayerManager`, or should it be exported as a factory?
- [ ] **T4.1:** Does `GamePage.tsx` exist and is it the correct component for mounting chat? (Earlier audits note `MatchPage` does not exist.)
- [ ] **T5.1:** What is the exact method or event name in the existing `ScaleManager` for listening to resize events? (E.g., `onResize()`, `on('resize')`, etc.)
- [ ] **T6.1:** Are there any additional global keyboard handlers besides `E`, `I`, and `Esc` that need guarding?
- [ ] **T7.1:** What is the exact file path and syntax of the staging Caddy configuration?
- [ ] **T8.1:** Is there an automated test harness or does T8 require manual browser testing?

---

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Message latency (local)** | <300 ms | Send button click → receive in second tab, measure with timer or network throttling tool |
| **Message latency (stage)** | <500 ms | Same, via deployed instance |
| **Backlog restoration time** | <1 s | Reload tab → measure time for all 50 messages to render |
| **Room instance isolation** | 100% | Send in room A, verify message does NOT appear in room B |
| **Keyboard guard effectiveness** | 100% | Type all three keys (E, I, Esc) in focused input → zero game actions fire |
| **Build success rate** | 100% | All three packages (`packages/shared`, `apps/api`, `apps/web`) build without errors |
| **Type safety** | 100% | Zero `any` types in `GameBridgeEvents`; all chat events are fully typed |
| **Existing API functionality** | 100% | All existing REST routes (`/health`, `/match/start`, etc.) remain operational |
| **Two-tab test pass rate** | 100% | All 17 checks in T8 pass on the first attempt after Phase 1 is complete |
| **Code coverage (chat logic)** | N/A for proof | Not required for MVP; can be added in Phase 2 |

---

## Document Control

**Author:** Senior Multiplayer Game Architect (Multi-AI Consensus)  
**Date:** 2026  
**Version:** 2.0 (Amended, Repository-Specific)  
**Status:** Ready for Development  
**Next Review:** After T0 spike completion (week 1)  
**Applicable Specification:** `colyseus-chat-proof-amandment.md` v2  

**Approved Implementation Path:** Draft 2 / `colyseus-chat-proof-amandment.md`  
**Rejected Paths:** Initial concept (outdated API), generic blueprints (not repo-aligned)  
**Scope Lock:** Chat proof only; no movement, persistence, or lobbies in Phase 1  
**Definition of Done:** All T0–T8 tasks complete; all T8 checks green; deployable chat proof  

---

## Implementation Notes

### Unresolved Technical Detail

The correct Colyseus client package for this repository's server version must be verified in **T0 before T1 is started**. Do not assume `@colyseus/sdk` or `colyseus.js`; inspect the installed server version and confirm compatibility.

### Architecture Enforcement

The following rules are non-negotiable and must not be deviated from without explicit consensus:

1. **One server process, one port (4000):** Colyseus attaches to the existing Hono server; no second process or port.
2. **One room type (IslandRoom):** Chat belongs in the world, not a separate room.
3. **Server-authoritative state:** Clients send requests; the server validates and mutates.
4. **Single network boundary (MultiplayerManager):** React and Phaser do not call Colyseus directly.
5. **Keyboard guard in both paths:** Phaser `update()` and global keyboard handlers.
6. **Phase 1 scope is final:** No movement, persistence, or feature expansion until the two-tab proof passes.

### Styling Discretion

The chat UI styling (colors, spacing, animations) can be adjusted to fit the project's design language, within the provided CSS framework. Do not change the layout system, networking, or component structure.

### Test Repeatability

The two-tab test (T8) should be repeatable. Consider automating it with a browser testing framework (Playwright, Cypress) or document manual steps clearly so they can be run consistently.

---

## Document Finalization

This brief is deployment-ready. A developer with access to the repository can begin implementation immediately at **T0** without clarifying questions, provided they resolve the open questions in the "Open Questions" section before proceeding.

If a question arises during implementation that is not answered here, **stop and document the blocker**. Do not infer behavior from older examples, personal preference, or assumptions about what the architecture "probably" intended.
