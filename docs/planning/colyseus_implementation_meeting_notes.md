# ACTIONABLE TASK LIST
Colyseus Multiplayer Integration for Kleeblatt Adventure
Date: August 20, 2026
Status: First-round synthesis with multi-model consensus on implementation path; user purpose statement added for final validation phase.

---

## EXECUTION SUMMARY

Integrate Colyseus v0.17 as an authoritative multiplayer layer into the existing kleeblatt-adventure monorepo by implementing a single `IslandRoom` with real-time chat synchronization. This integration proves the multiplayer foundation (WebSocket routing, schema synchronization, server authority, client-side prediction readiness) through a visibly polished chat feature that works smoothly across two browser tabs. Upon successful completion, the architecture supports scaling to movement synchronization, multi-room lobbies, and persistent multiplayer features without redesign. The implementation preserves the existing Hono server, React/Phaser bridge, and ScaleManager; introduces one new `MultiplayerManager` as the sole network boundary; and uses the repository's Caddy infrastructure for WebSocket proxying.

---

## DECISIONS NEEDED BEFORE EXECUTION

**1. Colyseus Client Package Name (T0 blocker)**  
The Colyseus v0.17 documentation currently shows `@colyseus/sdk` as the TypeScript client import. Older tutorials reference `colyseus.js`. Before any npm install in `apps/web`, verify which package name the repository's target Colyseus server version (`0.17.x` as assumed in v2) actually requires. Reference the [Colyseus v0.17 Getting Started page](https://docs.colyseus.io/) directly to confirm.  
**Recommendation:** Add this as a T0 spike task (10 minutes verification) before proceeding to package installation.

**2. Hono/Node-Server + WebSocketTransport Coexistence (T0 spike)**  
The v2 amendment assumes `WebSocketTransport({server})` can accept the already-listening `http.Server` created by `@hono/node-server`'s `serve()` function without timing or initialization conflicts. The Colyseus documentation shows this pattern with `createServer()` (not yet listening), but the repository uses `@hono/node-server` which calls `.listen()` immediately. Confirm via local spike that the two can coexist cleanly on the same `http.Server` object and port.  
**Recommendation:** T0 includes a small prototype confirming this before building the full room.

**3. Existing Questbook UI Mount Status (T4 planning)**  
The v2 amendment notes that the Questbook (`QuestPanel`) exists but is not currently mounted in the UI. The chat shortcut rail expects to mount both the Questbook toggle (Item 1) and Chat toggle (Item 2) side by side. Clarify whether the Questbook toggle should be implemented as part of this integration or whether T4 assumes it is already mounted elsewhere.  
**Recommendation:** If the Questbook is not mounted, T4 focuses on the Chat shortcut rail alone; the Questbook mount becomes a separate, lower-priority task deferred post-chat-proof.

---

## PRIORITY TIER 1 — NEXT 2 WEEKS (IMPLEMENTATION PHASE)

### TASK 1: Verify Colyseus v0.17 Client Package and Server Compatibility

**WHY:** Installing the wrong client package or confirming the server version mismatch will break imports and require rework. This 10-minute spike prevents that.

**OWNER PROFILE:** Backend/DevOps engineer or senior fullstack developer with access to the Colyseus documentation and npm registry.

**STEPS:**
1. Open https://docs.colyseus.io/ and navigate to the "Getting Started" section for the version matching your server (v0.17.x or the version currently in `apps/api/package.json`).
2. Note the exact client package import statement shown in the TypeScript quickstart (e.g., `import { Client } from "@colyseus/sdk"` or `import Colyseus from "colyseus.js"`).
3. Cross-reference the npm registry ([npmjs.com/package/colyseus](https://npmjs.com/package/colyseus) and [npmjs.com/package/@colyseus/sdk](https://npmjs.com/package/@colyseus/sdk)) to confirm the package name and which versions support the server version you are installing.
4. Check the current `apps/api/package.json` to confirm the exact Colyseus server version range.
5. Document the correct client package name and version constraint as a comment in the task tracking system before proceeding to T2.

**INPUTS NEEDED:**
- Access to https://docs.colyseus.io/
- Current `apps/api/package.json` from the repository

**DELIVERABLE:**
- A brief note (one sentence) confirming the correct client package name and version for the repository's Colyseus version.

**SUCCESS CRITERIA:**
- Documentation source (url + page title) is cited.
- Client package name matches the server version.
- No ambiguity remains about which import to use in `apps/web`.

**ESTIMATED EFFORT:**  
10–15 minutes (documentation review + cross-reference).

**DEPENDENCIES:** None.

**SOURCE:** My validation of T0 blocker identified across all models (GPT, Grok, Gemini, Claude all flagged this). Flagged explicitly in v2 amendment as "Paketname vor Install prüfen."

---

### TASK 2: Spike — Confirm Hono/Node-Server + WebSocketTransport Coexistence on Shared http.Server

**WHY:** The v2 amendment proposes that Colyseus' `WebSocketTransport` can reuse the existing `http.Server` created by `@hono/node-server`'s `serve()`. This must be verified locally before building the full room, because the Colyseus documentation examples show `createServer()` (not yet listening) but the repository uses a server that is already listening.

**OWNER PROFILE:** Backend/fullstack engineer comfortable with Node.js server setup and Colyseus initialization.

**STEPS:**
1. In a local development environment, create a minimal test file (`apps/api/src/colyseus-spike.ts`) that:
   - Imports and starts the existing Hono app using `@hono/node-server`'s `serve()`.
   - Captures the returned `http.Server` reference.
   - Attempts to initialize `WebSocketTransport({server: httpServer})` using that server reference.
   - Defines a minimal room class (empty state, no handlers).
   - Calls `defineServer({...})` with the transport and room definition.
2. Start the server and confirm it listens on port 4000 without errors.
3. Open the browser to `http://localhost:4000/` and confirm the Hono routes still work (e.g., `GET /health`).
4. Use `wscat` or a WebSocket client to attempt a connection to `ws://localhost:4000/matchmake`:
   ```bash
   npm install -g wscat
   wscat -c ws://localhost:4000/matchmake
   ```
5. Confirm the WebSocket connection succeeds and the room is accessible.
6. Check server logs for warnings, timing issues, or port conflicts.
7. If successful, document the successful pattern in a code comment in the actual `apps/api/src/index.ts` file as a reference for the implementation.
8. If unsuccessful, troubleshoot the timing or try the fallback approach: creating a separate `http.Server` (not yet listening), passing it to both `serve()` and `WebSocketTransport`, then calling `.listen()` once.

**INPUTS NEEDED:**
- Local development environment with Node.js and the repository checked out.
- Working `@hono/node-server` setup in `apps/api`.
- `wscat` CLI tool (installable via npm).

**DELIVERABLE:**
- A working spike server that starts without errors and accepts WebSocket connections on `/matchmake`.
- A brief code comment in `apps/api/src/colyseus-spike.ts` documenting the successful pattern, to be used as a reference for T3.

**SUCCESS CRITERIA:**
- Server starts on port 4000.
- Hono routes still respond (confirmed via browser or curl).
- WebSocket connection to `ws://localhost:4000/matchmake` succeeds.
- No console errors or warnings related to port binding or initialization order.

**ESTIMATED EFFORT:**  
30–45 minutes (setup, testing, troubleshooting, documentation).

**DEPENDENCIES:** Task 1 (must know the correct package name before installing).

**SOURCE:** Claude and Gemini flagged this timing concern; my own validation of v2 caught it as an untested assumption in the server setup. This is a **circuit-breaker spike** before committing to the full implementation.

---

### TASK 3: Install Colyseus Dependencies and Create Base Server Setup

**WHY:** Establishes the Colyseus libraries in both `apps/api` and `apps/web`, configures TypeScript for schema decorators, and wires the server to the existing Hono/Node-Server infrastructure.

**OWNER PROFILE:** Fullstack engineer or DevOps engineer with npm/yarn experience and familiarity with the monorepo structure.

**STEPS:**

1. **Install server-side dependencies in `apps/api`:**
   ```bash
   cd apps/api
   npm install colyseus @colyseus/ws-transport
   ```

2. **Install client-side dependency in `apps/web`:**
   ```bash
   cd apps/web
   npm install [CORRECT_CLIENT_PACKAGE_FROM_T1]
   # e.g., npm install @colyseus/sdk  (or colyseus.js if that is the correct name)
   ```

3. **Add schema dependency to the shared package:**
   ```bash
   cd packages/shared
   npm install @colyseus/schema
   ```

4. **Update `packages/shared/tsconfig.json`** to enable decorators only in this package:
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
   **Important:** Do **not** add these settings to the base tsconfig. They are isolated to `packages/shared` to avoid breaking other packages.

5. **Create the base server initialization in `apps/api/src/index.ts`:**  
   Use the pattern from v2 amendment's Code-Referenz (T0 section). Key points:
   - Import `defineServer` and `defineRoom` from `colyseus`.
   - Import `WebSocketTransport` from `@colyseus/ws-transport`.
   - Capture the `http.Server` created by `@hono/node-server`'s `serve()`.
   - Pass that server to `WebSocketTransport({server: httpServer})`.
   - Call `defineServer({rooms: {...}, transport: ...})` with the configured transport.
   - Log confirmation that Colyseus is listening (at the same port/process as Hono).

6. **Add environment variables:**  
   Update `.env.example` to include:
   ```
   VITE_COLYSEUS_URL=http://localhost:4000
   ```
   (Not `http://localhost:8787` or any other port.)

7. **Build and verify:**
   ```bash
   npm run build --workspaces
   ```
   Confirm no TypeScript errors in any workspace.

**INPUTS NEEDED:**
- Results from T1 (correct client package name).
- Successful spike from T2 (server setup pattern confirmed).
- Current `apps/api/src/index.ts` (to be updated with Colyseus initialization).
- Current `packages/shared/tsconfig.json` (to be updated with decorator settings).

**DELIVERABLE:**
- Updated `apps/api/package.json` with `colyseus` and `@colyseus/ws-transport`.
- Updated `apps/web/package.json` with the correct client package.
- Updated `packages/shared/package.json` with `@colyseus/schema`.
- Updated `packages/shared/tsconfig.json` with `experimentalDecorators` and `useDefineForClassFields` overrides.
- Updated `apps/api/src/index.ts` with base Colyseus server initialization (following v2 Code-Referenz).
- Updated `.env.example` with `VITE_COLYSEUS_URL`.
- Clean build output with no TypeScript errors.

**SUCCESS CRITERIA:**
- All three packages build without errors.
- `npm run build` completes successfully across the monorepo.
- Decorator-specific compiler options are isolated to `packages/shared` only.
- No other `tsconfig.json` files are modified.

**ESTIMATED EFFORT:**  
45–60 minutes (npm installs, file updates, build verification, troubleshooting dependency conflicts if any).

**DEPENDENCIES:** Task 1 and Task 2.

**SOURCE:** v2 amendment T0 + Code-Referenz. All models endorsed the approach; I validated the TypeScript config isolation as a safety measure.

---

### TASK 4: Create Shared Schema Types in `packages/shared`

**WHY:** Defines the authoritative `IslandRoomState` and `ChatMessage` types that the server will mutate and the client will observe. Placing this in `packages/shared` ensures both server and client use identical types.

**OWNER PROFILE:** Backend/fullstack engineer with TypeScript and `@colyseus/schema` decorator familiarity.

**STEPS:**

1. **Create the directory structure:**
   ```bash
   mkdir -p packages/shared/src/multiplayer
   ```

2. **Create `packages/shared/src/multiplayer/ChatMessage.ts`:**
   ```typescript
   import { Schema, type } from "@colyseus/schema";

   export class ChatMessage extends Schema {
     @type("string") sessionId: string = "";
     @type("string") name: string = "";
     @type("string") text: string = "";
     @type("number") ts: number = 0;
   }
   ```

3. **Create `packages/shared/src/multiplayer/IslandRoomState.ts`:**
   ```typescript
   import { Schema, type, ArraySchema } from "@colyseus/schema";
   import { ChatMessage } from "./ChatMessage.js";

   export class IslandRoomState extends Schema {
     @type([ChatMessage]) messages = new ArraySchema<ChatMessage>();
   }
   ```

4. **Export types from `packages/shared/src/index.ts`:**  
   Add these lines (following the project's existing export pattern):
   ```typescript
   export { ChatMessage, IslandRoomState } from "./multiplayer/IslandRoomState.js";
   ```
   (Note: If the file structure is `ChatMessage.ts` separate, export both explicitly.)

5. **Build and verify:**
   ```bash
   cd packages/shared
   npm run build
   ```
   Confirm no errors. The decorators should compile correctly now that `experimentalDecorators` is enabled.

6. **Verify schema exports are importable from both `apps/api` and `apps/web`:**
   ```typescript
   import { IslandRoomState, ChatMessage } from "@kleeblatt/shared";
   ```
   Both imports should resolve without error.

**INPUTS NEEDED:**
- Task 3 completed (TypeScript config and @colyseus/schema installed).
- Existing `packages/shared/src/index.ts` structure (to add exports).

**DELIVERABLE:**
- `packages/shared/src/multiplayer/ChatMessage.ts` with @Schema decorator.
- `packages/shared/src/multiplayer/IslandRoomState.ts` with @Schema decorator and ArraySchema.
- Updated `packages/shared/src/index.ts` with re-exports.
- Successful build with no TypeScript errors.

**SUCCESS CRITERIA:**
- Both schema files compile without errors.
- Decorators are applied correctly (check compiled `.js` output for decorated class structure).
- Types are importable from `@kleeblatt/shared` in both `apps/api` and `apps/web`.
- The schema can be serialized and deserialized by Colyseus (structural readiness; full test in T5).

**ESTIMATED EFFORT:**  
20–30 minutes (file creation, decorator setup, export verification, build testing).

**DEPENDENCIES:** Task 3.

**SOURCE:** v2 amendment T1 + Code-Referenz, endorsed by all models.

---

### TASK 5: Implement `IslandRoom` with Chat Message Validation and Broadcast

**WHY:** Establishes the authoritative room that owns the chat state, validates incoming messages, and broadcasts changes to all clients. This is the core of the multiplayer proof.

**OWNER PROFILE:** Backend/fullstack engineer comfortable with Colyseus room lifecycle, validation patterns, and Zod schema usage.

**STEPS:**

1. **Create `apps/api/src/rooms/IslandRoom.ts`:**  
   Follow the v2 amendment's Code-Referenz (T2 section). Key elements:
   - Import `Room`, `Client`, `validate` from `colyseus`.
   - Import `z` from `zod` (already a dependency in `apps/api`).
   - Import `ChatMessage`, `IslandRoomState` from `@kleeblatt/shared`.
   - Define a `stripControlChars()` helper that removes bytes `0x00–0x1F` and `0x7F`.
   - Define `IslandClient = Client<{userData: {name: string}}>` for type safety.

2. **Implement the room class:**
   ```typescript
   export class IslandRoom extends Room<IslandRoomState> {
     state = new IslandRoomState();
     private lastMessageAt = new Map<string, number>(); // optional rate limit
     private readonly MAX_MESSAGES = 50;
     private readonly RATE_LIMIT_MS = 300;

     messages = {
       chat: validate(
         z.object({
           text: z.string().trim().min(1, "empty").max(200, "too long"),
         }),
         function(this: IslandRoom, client: IslandClient, message) {
           // Rate limiting (optional, but recommended for the proof)
           const last = this.lastMessageAt.get(client.sessionId) ?? 0;
           if (Date.now() - last < this.RATE_LIMIT_MS) return;
           this.lastMessageAt.set(client.sessionId, Date.now());

           const text = stripControlChars(message.text);
           if (!text) return;

           const chatMessage = new ChatMessage();
           chatMessage.sessionId = client.sessionId;
           chatMessage.name = client.userData?.name ?? `Guest-${client.sessionId.slice(0, 4)}`;
           chatMessage.text = text;
           chatMessage.ts = Date.now();

           this.state.messages.push(chatMessage);
           if (this.state.messages.length > this.MAX_MESSAGES) {
             this.state.messages.shift();
           }
         },
       ),
     };

     onJoin(client: IslandClient, options: { name?: string }) {
       const raw = typeof options.name === "string" ? options.name.trim() : "";
       const name = raw.slice(0, 20) || `Guest-${client.sessionId.slice(0, 4)}`;
       client.userData = { name };
       console.log(`[IslandRoom] Client ${client.sessionId} joined as ${name}`);
     }

     onLeave(client: IslandClient) {
       console.log(`[IslandRoom] Client ${client.sessionId} left`);
     }

     onUncaughtException(err: Error, methodName: string) {
       console.error(`[IslandRoom] ${methodName}:`, err.message);
       // Do not re-throw; the room should remain stable even if a single message fails.
     }
   }
   ```

3. **Register the room in `apps/api/src/index.ts`:**  
   Add to the `defineServer()` call:
   ```typescript
   rooms: {
     island: defineRoom(IslandRoom),
   }
   ```

4. **Verify the room compiles and the server starts:**
   ```bash
   cd apps/api
   npm run build
   npm run dev  # or appropriate dev command
   ```
   Confirm logs show "listening on http://localhost:4000" without errors.

5. **Test room initialization locally:**
   - Open a browser console or use `wscat` to connect to `ws://localhost:4000/matchmake`.
   - Attempt to join the `island` room.
   - Confirm the room is created and the client receives the initial (empty) room state.
   - Send a test chat message.
   - Confirm the message is added to the room state (manually inspect or log).

**INPUTS NEEDED:**
- Task 4 completed (schema types available).
- Task 3 completed (Colyseus infrastructure set up).
- Existing `apps/api/src/index.ts` with base Colyseus initialization.
- Zod already in `apps/api` dependencies.

**DELIVERABLE:**
- `apps/api/src/rooms/IslandRoom.ts` with full chat validation and broadcast logic.
- Updated `apps/api/src/index.ts` registering the room in `defineServer()`.
- Successful build and server startup.
- Manual test showing a chat message can be sent and received.

**SUCCESS CRITERIA:**
- Server starts without errors.
- Room registers and is discoverable at `/matchmake?room=island`.
- A client can join the room and receive initial state (empty chat history).
- A message sent to the room is validated, added to state, and visible to all clients.
- Invalid messages (empty, too long, control characters) are rejected silently (not causing a crash or disconnect).
- Message count is capped at 50; older messages are removed when the limit is exceeded.
- Rate limiting works: a single client sending more than one message within 300 ms sees the second rejected.

**ESTIMATED EFFORT:**  
60–90 minutes (room implementation, validation logic, testing, debugging initial connection issues).

**DEPENDENCIES:** Task 3 and Task 4.

**SOURCE:** v2 amendment T2 + Code-Referenz, explicitly endorsed by all models. Rate limiting is optional but recommended (Gemini and Claude endorsed this for production quality).

---

### TASK 6: Create `MultiplayerManager` Client Wrapper

**WHY:** Establishes a single network boundary in the client code. All Colyseus operations (join, send, listen, disconnect) go through this manager; React and Phaser components never call Colyseus directly.

**OWNER PROFILE:** Frontend/fullstack engineer comfortable with TypeScript, React hooks, event emitters, and the project's `gameBridge` pattern.

**STEPS:**

1. **Create the directory and file:**
   ```bash
   mkdir -p apps/web/src/game/multiplayer
   touch apps/web/src/game/multiplayer/MultiplayerManager.ts
   ```

2. **Implement the manager:**
   ```typescript
   import { Client, Callbacks } from "[CORRECT_CLIENT_PACKAGE_FROM_T1]";
   import { gameBridge } from "@kleeblatt/shared";
   import type { IslandRoomState } from "@kleeblatt/shared";

   export class MultiplayerManager {
     private room?: Awaited<ReturnType<Client["joinOrCreate"]>>;
     private client?: Client;
     private unsubscribes: Array<() => void> = [];

     async connect(colyseusUrl: string, playerName: string): Promise<void> {
       this.client = new Client(colyseusUrl);
       this.room = await this.client.joinOrCreate<IslandRoomState>("island", { name: playerName });

       const callbacks = Callbacks.get(this.room);
       
       // Listen for new/updated chat messages in the room state
       const unsubMsg = callbacks.onAdd("messages", (msg) => {
         gameBridge.emit("chat:message", {
           name: msg.name,
           text: msg.text,
           ts: msg.ts,
         });
       });
       this.unsubscribes.push(unsubMsg);

       console.log(`[MultiplayerManager] Joined IslandRoom`);
     }

     sendChat(text: string): void {
       if (!this.room) {
         console.warn("[MultiplayerManager] Not connected to room; ignoring chat send");
         return;
       }
       this.room.send("chat", { text });
     }

     disconnect(): void {
       this.unsubscribes.forEach((unsub) => unsub());
       this.unsubscribes = [];
       this.room?.leave();
       this.room = undefined;
     }

     isConnected(): boolean {
       return !!this.room;
     }
   }

   // Singleton instance for app-wide use
   export const multiplayerManager = new MultiplayerManager();
   ```

3. **Extend `GameBridgeEvents` in `packages/shared/src/gameBridge.ts`:**  
   Add these event types (alongside existing types):
   ```typescript
   export type GameBridgeEvents = {
     // ... existing events ...

     // Multiplayer chat (IslandRoom)
     "chat:message": { name: string; text: string; ts: number };
     "chat:send": { text: string };
   };
   ```

4. **Create a hook for React mounting (optional but recommended):**  
   ```typescript
   // apps/web/src/hooks/useMultiplayer.ts
   import { useEffect } from "react";
   import { multiplayerManager } from "@/game/multiplayer/MultiplayerManager";

   export function useMultiplayer(playerName: string) {
     useEffect(() => {
       const colyseusUrl = import.meta.env.VITE_COLYSEUS_URL || "http://localhost:4000";
       multiplayerManager.connect(colyseusUrl, playerName);

       return () => {
         multiplayerManager.disconnect();
       };
     }, [playerName]);
   }
   ```

5. **Verify the manager compiles and integrates correctly:**
   ```bash
   cd apps/web
   npm run build
   ```
   Confirm no errors. Types should resolve correctly from `@kleeblatt/shared`.

**INPUTS NEEDED:**
- Task 3 (client package installed).
- Task 4 (schema types exported from `@kleeblatt/shared`).
- Task 5 (IslandRoom implemented).
- Current `packages/shared/src/gameBridge.ts`.
- Existing project hooks directory (to place the optional hook).

**DELIVERABLE:**
- `apps/web/src/game/multiplayer/MultiplayerManager.ts` with full connection, send, and cleanup logic.
- `apps/web/src/hooks/useMultiplayer.ts` (optional, for convenient React integration).
- Updated `packages/shared/src/gameBridge.ts` with `chat:message` and `chat:send` event types.
- Successful build with no TypeScript errors.

**SUCCESS CRITERIA:**
- The manager compiles without errors.
- Types from `@kleeblatt/shared` resolve correctly.
- The manager can be instantiated and connected to a running IslandRoom.
- Sending a message through `multiplayerManager.sendChat()` results in a room message event on the server.
- Receiving state updates from the room triggers `gameBridge.emit("chat:message", ...)`.
- Disconnecting cleans up all listeners and unsubscribes.
- The hook can be mounted in a React component without errors.

**ESTIMATED EFFORT:**  
45–60 minutes (implementation, testing integration, debugging listener cleanup).

**DEPENDENCIES:** Task 3, Task 4, Task 5.

**SOURCE:** v2 amendment T3 + Code-Referenz. All models endorsed the single-boundary pattern; I validated the callback subscription and cleanup as critical for avoiding memory leaks.

---

### TASK 7: Implement Input Guard (`isTypingInInput()` Helper and Enforcement)

**WHY:** Prevents gameplay keys (E, I, Esc, WASD) from firing while the user is typing in the chat input. This is critical for UX and must guard **both** the Phaser `update()` loop and global keyboard listeners.

**OWNER PROFILE:** Frontend engineer comfortable with Phaser input handling and the project's keyboard controller.

**STEPS:**

1. **Locate the existing keyboard controller:**  
   Find `apps/web/src/game/input/DesktopKeyboardController.ts` (or similar).

2. **Add a shared `isTypingInInput()` helper at the top of the file:**
   ```typescript
   function isTypingInInput(): boolean {
     const active = document.activeElement;
     return !!active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
   }
   ```

3. **Update the `update()` method to guard movement:**  
   At the start of the movement polling logic, add:
   ```typescript
   update(): void {
     if (!this.cursors) return;

     if (isTypingInInput()) {
       this.inputController.setMoveVector(0, 0);
       return;
     }

     // ... rest of movement logic ...
   }
   ```

4. **Guard global keyboard listeners (E, I, Esc):**  
   Find the handlers for these keys (typically `onInteract`, `onQuestbook`, `onCancel` or similar). Wrap each with the guard:
   ```typescript
   private onInteract(): void {
     if (isTypingInInput()) return;
     this.eventTarget.emit(InputEvents.INTERACT);
   }

   private onQuestbook(): void {
     if (isTypingInInput()) return;
     this.eventTarget.emit(InputEvents.OPEN_QUESTBOOK);
   }

   private onCancel(): void {
     if (isTypingInInput()) return;
     this.inputController.cancelMovement();
     this.eventTarget.emit(InputEvents.CANCEL);
   }
   ```

5. **Test thoroughly:**
   - Start the game.
   - Open the chat input (to be created in T8).
   - Confirm that holding movement keys (W, A, S, D, arrows) does not move the character.
   - Type the character "E" in the chat; confirm no interact action fires.
   - Type the character "I" in the chat; confirm no inventory/questbook action fires.
   - Press Escape in the chat; confirm the game does not cancel its current interaction/menu.
   - Blur the chat input.
   - Confirm that movement keys, E, I, and Esc now work normally.

**INPUTS NEEDED:**
- Existing `apps/web/src/game/input/DesktopKeyboardController.ts`.
- Understanding of the project's keyboard event structure and existing listeners for E, I, Esc.
- Understanding of `InputEvents` enum or event names.

**DELIVERABLE:**
- Updated `DesktopKeyboardController.ts` with `isTypingInInput()` helper.
- All movement and action key handlers guarded with `if (isTypingInInput()) return;`.
- No other changes to input behavior.
- Test results showing the guard works for both WASD/arrows and E/I/Esc.

**SUCCESS CRITERIA:**
- Typing in a text input does not trigger movement.
- Typing "E", "I", or pressing Escape in a text input does not trigger gameplay actions.
- Blurring the input restores normal keyboard control.
- No false positives (e.g., normal gameplay is not blocked when the chat is closed).
- The guard applies consistently across both polling-based (`update()`) and event-based (global `keyboard.on()`) input paths.

**ESTIMATED EFFORT:**  
30–45 minutes (locating handlers, adding guards, systematic testing across all keys).

**DEPENDENCIES:** None (standalone input change). Logically depends on Task 8 for testing, but can be reviewed and merged independently.

**SOURCE:** v2 amendment T6, strongly endorsed by Gemini and Claude as critical. I validated the dual-path necessity (initial spec only guarded `update()`, which misses global listeners).

---

### TASK 8: Create `ChatWidget` React Component and Mount in `GamePage.tsx`

**WHY:** Provides the user-facing chat interface: message display, input field, send button/Enter key, Escape to close. This is where the multiplayer experience becomes visible and pleasant.

**OWNER PROFILE:** Frontend/React engineer comfortable with component structure, styling, and integration with the project's `gameBridge` pattern.

**STEPS:**

1. **Create `apps/web/src/components/ChatWidget.tsx`:**
   ```typescript
   import React, { useEffect, useRef, useState } from "react";
   import { gameBridge } from "@kleeblatt/shared";
   import { multiplayerManager } from "@/game/multiplayer/MultiplayerManager";
   import styles from "./ChatWidget.module.css"; // To be created in T8b

   interface Message {
     name: string;
     text: string;
     ts: number;
   }

   export const ChatWidget: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
     isOpen,
     onClose,
   }) => {
     const [messages, setMessages] = useState<Message[]>([]);
     const [inputValue, setInputValue] = useState("");
     const messagesEndRef = useRef<HTMLDivElement>(null);

     // Listen for incoming messages from the multiplayer manager
     useEffect(() => {
       const unsub = gameBridge.on("chat:message", (msg) => {
         setMessages((prev) => {
           // Cap to 50 messages on the client as well (server enforces, but be defensive)
           const updated = [...prev, msg];
           return updated.slice(-50);
         });
       });
       return () => unsub();
     }, []);

     // Auto-scroll to the latest message
     useEffect(() => {
       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
     }, [messages]);

     const handleSend = () => {
       if (!inputValue.trim()) return;
       gameBridge.emit("chat:send", { text: inputValue });
       setInputValue("");
     };

     const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
       if (e.key === "Enter") {
         e.preventDefault();
         handleSend();
       }
       if (e.key === "Escape") {
         e.preventDefault();
         onClose();
       }
     };

     if (!isOpen) return null;

     return (
       <div className={styles.chatWidget}>
         <div className={styles.header}>
           <span className={styles.title}>Chat</span>
           <button className={styles.closeBtn} onClick={onClose}>
             ×
           </button>
         </div>
         <div className={styles.messageList}>
           {messages.length === 0 && <p className={styles.empty}>No messages yet</p>}
           {messages.map((msg, idx) => {
             const time = new Date(msg.ts).toLocaleTimeString("en-US", {
               hour: "2-digit",
               minute: "2-digit",
             });
             return (
               <div key={idx} className={styles.message}>
                 <span className={styles.name}>{msg.name}</span>
                 <span className={styles.time}>{time}</span>
                 <p className={styles.text}>{msg.text}</p>
               </div>
             );
           })}
           <div ref={messagesEndRef} />
         </div>
         <div className={styles.inputArea}>
           <input
             type="text"
             className={styles.input}
             placeholder="Type a message..."
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
             onKeyDown={handleKeyDown}
             onBlur={onClose} // Optional: close on blur
             autoFocus
           />
           <button className={styles.sendBtn} onClick={handleSend}>
             Send
           </button>
         </div>
       </div>
     );
   };
   ```

2. **Create `apps/web/src/components/ChatWidget.module.css`** with professional styling:
   ```css
   .chatWidget {
     position: fixed;
     bottom: 100px;
     left: 20px;
     width: clamp(260px, 30vw, 380px);
     height: clamp(220px, 45vh, 360px);
     background: rgba(0, 0, 0, 0.85);
     border: 2px solid #4a9eff;
     border-radius: 8px;
     display: flex;
     flex-direction: column;
     z-index: 1000;
     font-family: "Arial", sans-serif;
     color: #e0e0e0;
     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
   }

   .header {
     display: flex;
     justify-content: space-between;
     align-items: center;
     padding: 8px 12px;
     background: rgba(0, 0, 0, 0.5);
     border-bottom: 1px solid #4a9eff;
   }

   .title {
     font-weight: bold;
     font-size: 14px;
   }

   .closeBtn {
     background: none;
     border: none;
     color: #4a9eff;
     font-size: 20px;
     cursor: pointer;
     padding: 0;
     width: 24px;
     height: 24px;
     display: flex;
     align-items: center;
     justify-content: center;
   }

   .closeBtn:hover {
     color: #ff6b6b;
   }

   .messageList {
     flex: 1;
     overflow-y: auto;
     padding: 8px;
     display: flex;
     flex-direction: column;
     gap: 8px;
   }

   .empty {
     text-align: center;
     color: #666;
     font-size: 12px;
     margin: auto;
   }

   .message {
     padding: 6px;
     background: rgba(74, 158, 255, 0.1);
     border-left: 2px solid #4a9eff;
     border-radius: 4px;
     word-wrap: break-word;
   }

   .name {
     font-weight: bold;
     color: #4a9eff;
     font-size: 12px;
   }

   .time {
     font-size: 10px;
     color: #888;
     margin-left: 8px;
   }

   .text {
     margin: 4px 0 0 0;
     font-size: 13px;
     line-height: 1.4;
   }

   .inputArea {
     display: flex;
     gap: 4px;
     padding: 8px;
     border-top: 1px solid #4a9eff;
     background: rgba(0, 0, 0, 0.5);
   }

   .input {
     flex: 1;
     padding: 6px 8px;
     border: 1px solid #4a9eff;
     border-radius: 4px;
     background: rgba(0, 0, 0, 0.3);
     color: #e0e0e0;
     font-size: 12px;
     outline: none;
   }

   .input:focus {
     background: rgba(0, 0, 0, 0.5);
     border-color: #ff6b6b;
   }

   .sendBtn {
     padding: 6px 12px;
     background: #4a9eff;
     border: none;
     border-radius: 4px;
     color: #000;
     font-weight: bold;
     font-size: 12px;
     cursor: pointer;
   }

   .sendBtn:hover {
     background: #ff6b6b;
   }

   @media (max-width: 768px) {
     .chatWidget {
       width: 280px;
       height: 300px;
       right: 10px;
       left: auto;
     }
   }
   ```

3. **Create a shortcut button rail (or integrate into existing UI):**  
   Create `apps/web/src/components/ShortcutRail.tsx`:
   ```typescript
   import React, { useState } from "react";
   import { ChatWidget } from "./ChatWidget";
   import styles from "./ShortcutRail.module.css";

   export const ShortcutRail: React.FC = () => {
     const [chatOpen, setChatOpen] = useState(false);

     return (
       <>
         <div className={styles.rail}>
           <button className={styles.item} title="Questbook">
             📖
           </button>
           <button
             className={styles.item}
             title="Chat"
             onClick={() => setChatOpen(!chatOpen)}
           >
             💬
           </button>
         </div>
         <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
       </>
     );
   };
   ```

4. **Create `ShortcutRail.module.css`:**
   ```css
   .rail {
     position: fixed;
     left: 20px;
     bottom: 20px;
     display: flex;
     flex-direction: column;
     gap: 12px;
     z-index: 999;
   }

   .item {
     width: 50px;
     height: 50px;
     border-radius: 50%;
     background: rgba(74, 158, 255, 0.8);
     border: 2px solid #4a9eff;
     color: #fff;
     font-size: 24px;
     cursor: pointer;
     transition: all 0.2s ease;
     box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
   }

   .item:hover {
     background: rgba(74, 158, 255, 1);
     transform: scale(1.1);
   }

   .item:active {
     transform: scale(0.95);
   }
   ```

5. **Mount the rail in `apps/web/src/pages/GamePage.tsx`:**  
   Add near the top-level JSX:
   ```typescript
   import { ShortcutRail } from "@/components/ShortcutRail";

   export const GamePage: React.FC = () => {
     // ... existing code ...
     return (
       <div className={styles.gamePage}>
         <ShortcutRail />
         {/* ... rest of the page ... */}
       </div>
     );
   };
   ```

6. **Initialize the multiplayer connection in `GamePage`:**  
   Use the `useMultiplayer` hook (from T6) or call it directly:
   ```typescript
   useEffect(() => {
     // Get player name from auth or use a default
     const playerName = user?.name || "Player"; 
     multiplayerManager.connect(
       import.meta.env.VITE_COLYSEUS_URL || "http://localhost:4000",
       playerName
     );

     return () => multiplayerManager.disconnect();
   }, [user]);
   ```

7. **Test the component:**
   - Start the dev server.
   - Navigate to the game page.
   - Confirm the chat button (💬) appears at the bottom left.
   - Click the button to open the chat widget.
   - Type a message and press Enter or click Send.
   - Confirm the message appears in the chat (from the server's broadcast).
   - Close the chat with the × button or Escape key.

**INPUTS NEEDED:**
- Task 5 completed (IslandRoom working).
- Task 6 completed (MultiplayerManager and gameBridge events).
- React component structure and styling familiarity.
- Understanding of existing `GamePage.tsx` layout.

**DELIVERABLE:**
- `apps/web/src/components/ChatWidget.tsx` with message display, input, and send logic.
- `apps/web/src/components/ChatWidget.module.css` with professional styling.
- `apps/web/src/components/ShortcutRail.tsx` with button toggle.
- `apps/web/src/components/ShortcutRail.module.css` with rail styling.
- Updated `apps/web/src/pages/GamePage.tsx` mounting the rail and initializing the multiplayer connection.
- Successful component rendering and chat message exchange.

**SUCCESS CRITERIA:**
- The chat widget renders without errors.
- The shortcut rail appears at the bottom left.
- Clicking the chat button toggles the widget open/closed.
- Typing and sending a message displays it in the chat (rounded-trip through the server).
- Messages show sender name, time (HH:MM format), and text.
- The message list auto-scrolls to the latest message.
- Escape or the close button closes the widget.
- Typing in the chat input does not trigger gameplay actions (verified in T7).
- The component looks polished and professional.

**ESTIMATED EFFORT:**  
90–120 minutes (component implementation, styling, mounting, testing, refinement).

**DEPENDENCIES:** Task 5, Task 6, Task 7.

**SOURCE:** v2 amendment T4 + detailed UX requirements from purpose statement. All models endorsed the React/Phaser bridge pattern; I added detailed styling and professional UX guidance.

---

### TASK 9: Configure Caddy WebSocket Routing for `/matchmake*`

**WHY:** Allows the client to connect to Colyseus through the existing Caddy reverse proxy in staging/production, not just localhost.

**OWNER PROFILE:** DevOps/infrastructure engineer familiar with Caddy configuration and the existing proxy setup.

**STEPS:**

1. **Locate the existing Caddyfile:**  
   Find `infra/caddy/Caddyfile` (or the equivalent for the project's staging/production setup).

2. **Review the existing blocks:**  
   Confirm that blocks for `/api/*`, `/auth/*`, `/health`, and `/me` already proxy to the API server (typically `127.0.0.1:4000` or the appropriate endpoint).

3. **Add a new block for Colyseus matchmaking:**  
   Insert this block alongside the existing proxy rules (order within the domain block typically does not matter, but group it logically with other API proxies):
   ```caddyfile
   handle /matchmake* {
       reverse_proxy 127.0.0.1:4000
   }
   ```
   If the project uses `colyseus/monitor` (a web-based room inspector, optional for debugging), add an additional block:
   ```caddyfile
   handle /colyseus* {
       reverse_proxy 127.0.0.1:4000
   }
   ```

4. **Verify the Caddy configuration syntax:**
   ```bash
   caddy validate --config infra/caddy/Caddyfile
   ```
   Confirm no errors are reported.

5. **Reload Caddy (local/staging):**  
   Depending on the deployment method:
   - If running locally: Restart the Caddy process.
   - If running in Docker: Redeploy or send a SIGHUP to the running container.
   - If running in production: Deploy the updated Caddyfile via the CI/CD pipeline.

6. **Test the routing:**
   ```bash
   # Install wscat if not already available
   npm install -g wscat

   # Test the WebSocket route (adjust domain as needed)
   wscat -c ws://localhost:80/matchmake
   # OR for staging
   wscat -c ws://stage.kleeblatt.space/matchmake
   ```
   Confirm the connection succeeds and you can interact with the Colyseus matchmaking endpoint.

7. **Verify HTTP routes still work:**  
   ```bash
   curl http://localhost/api/health
   curl http://stage.kleeblatt.space/api/health
   ```
   Confirm existing API endpoints are not disrupted.

**INPUTS NEEDED:**
- Current `infra/caddy/Caddyfile`.
- Understanding of the project's domain(s) (localhost for dev, `stage.kleeblatt.space` for staging, production domain for prod).
- Access to deploy or test Caddy reloads.

**DELIVERABLE:**
- Updated `infra/caddy/Caddyfile` with `/matchmake*` block.
- Confirmed Caddy configuration syntax validation.
- Verified WebSocket connection to `/matchmake` endpoint.
- Confirmed existing API routes still work.

**SUCCESS CRITERIA:**
- Caddy syntax is valid (no validation errors).
- WebSocket connection to `ws://localhost:80/matchmake` (or staging domain) succeeds.
- HTTP routes like `/api/health` still respond correctly.
- The Colyseus client in the browser can connect to the `/matchmake` endpoint via the Caddy proxy.

**ESTIMATED EFFORT:**  
20–30 minutes (file update, validation, testing, troubleshooting if needed).

**DEPENDENCIES:** Task 5 (IslandRoom must be running).

**SOURCE:** v2 amendment T7. Caddy automatic WebSocket upgrade detection was endorsed by Gemini as sufficient; no manual header setting needed.

---

### TASK 10: Run Full Two-Tab Chat Smoke Test and Acceptance Verification

**WHY:** Verifies end-to-end multiplayer functionality: two clients in the same room, message synchronization, backlog, input guards, and UI quality. This is the final acceptance test for the chat proof-of-life.

**OWNER PROFILE:** QA engineer or developer familiar with manual testing and debugging multiplayer systems.

**STEPS:**

1. **Ensure all prior tasks are complete and the server is running:**
   ```bash
   npm run build --workspaces
   npm run dev  # or appropriate command to start apps/api and apps/web
   ```
   Confirm both the API and web client start without errors.

2. **Open two browser tabs or windows:**
   - Tab A: `http://localhost:5173` (or the local dev server URL)
   - Tab B: `http://localhost:5173` (same game page)

3. **Test basic connectivity and message exchange:**
   - In Tab A, wait for the game to load and confirm the chat widget is accessible (button visible).
   - Click the chat button to open the widget.
   - In Tab B, repeat: open the game and the chat widget.
   - In Tab A, type a test message: "Hello from Tab A" and press Enter.
   - In Tab B, confirm the message appears within **300 ms** (target latency for the proof).
   - In Tab B, type "Hello from Tab A" (echo to verify the round-trip).
   - In Tab A, confirm the message appears.
   - **Pass/Fail:** Both tabs can send and receive messages with low latency.

4. **Test backlog/reconnection:**
   - With both tabs connected, send 5–10 messages in various orders.
   - Refresh Tab B (reload the page).
   - Wait for the game to load and the chat widget to initialize.
   - Confirm that the backlog (last 50 messages) is visible in Tab B immediately upon connection.
   - **Pass/Fail:** Backlog is complete and accessible after reconnection.

5. **Test input guards:**
   - In Tab B (with chat open and focused):
     - Hold the **W key** (move forward). Confirm the character does NOT move.
     - Press **E**. Confirm no interact action fires (check the game logs if available).
     - Press **I**. Confirm no questbook or inventory action fires.
     - Press **Escape**. Confirm the chat closes but the game does not execute additional cancel actions.
   - Blur the chat input (click elsewhere).
   - Confirm that W, E, I, and Escape now work normally in the game.
   - **Pass/Fail:** All input guards work correctly; no gameplay actions leak through.

6. **Test UI quality and responsiveness:**
   - Open the chat widget and verify:
     - Messages are clearly readable (font size, color, contrast).
     - Sender names and timestamps are visible.
     - The message list auto-scrolls to the latest message.
     - The input field is easy to use (placeholder text, focus state visible).
     - Send button or Enter key works consistently.
     - Close button (×) or Escape key closes the widget.
   - Resize the browser window (test responsive layout).
   - Confirm the chat widget scales appropriately and remains usable at different window sizes.
   - **Pass/Fail:** UI is polished, responsive, and professional.

7. **Test room isolation (optional, advanced):**
   - Open a third tab (Tab C) and navigate to a different page/route in the game (if available).
   - Confirm that Tab C does **not** see the chat messages from Tab A and Tab B.
   - If Tab C also navigates to the `IslandRoom`, confirm it joins the same room and sees the same messages.
   - **Pass/Fail:** Room state is isolated correctly; separate rooms do not leak state.

8. **Check server logs:**
   - In the terminal running the server, confirm logs show:
     - `[IslandRoom] Client <sessionId> joined as <name>` for each client join.
     - Chat message validation and broadcast for each sent message.
     - No errors or warnings during the test.
   - **Pass/Fail:** Server-side logging is clean and informative.

9. **Document results:**
   - Create a test report summarizing:
     - Test date and environment (local/staging).
     - All pass/fail outcomes.
     - Any issues encountered and their resolutions.
     - Overall assessment: ready for staging/production or requires fixes.

**INPUTS NEEDED:**
- All prior tasks completed (server running, client built, routes configured).
- Two browser windows/tabs.
- Access to browser console and server logs.
- Test script or checklist covering all steps above.

**DELIVERABLE:**
- Documented test results showing all steps passed.
- Screenshots or video of the two-tab chat exchange (optional but recommended for stakeholder visibility).
- Server log excerpt showing clean operation without errors.
- Test report summarizing findings and readiness assessment.

**SUCCESS CRITERIA:**
- ✅ Two clients can join the same `IslandRoom` and exchange messages.
- ✅ Messages appear in both clients within 300 ms (target latency).
- ✅ Reloading a tab shows the backlog (last 50 messages).
- ✅ Input guards prevent gameplay keys from firing while typing in chat.
- ✅ UI is professional, responsive, and easy to use.
- ✅ Server logs are clean (no errors, expected join/message logs present).
- ✅ No other room or game state is disrupted by the multiplayer chat.
- ✅ **Overall:** Multiplayer chat proof-of-life is complete, visible, and working smoothly.

**ESTIMATED EFFORT:**  
60–90 minutes (systematic testing, documentation, minor bug fixes if needed).

**DEPENDENCIES:** All prior tasks (Task 1–Task 9).

**SOURCE:** v2 amendment T8 + extended acceptance criteria from purpose statement. All models endorsed the two-tab test; I added detailed UX verification and documentation requirements.

---

## PRIORITY TIER 2 — NEXT ITERATION (POST-CHAT-PROOF ROADMAP)

### TASK 11: Document Movement Synchronization Architecture (Planning, Not Implementation)

**WHY:** Once the chat proof is verified, the next multiplayer feature is player movement. This task documents the intended architecture so future implementation follows a coherent plan.

**OWNER PROFILE:** Senior architect or tech lead familiar with multiplayer game patterns and the repository's design.

**STEPS:**

1. **Define the movement sync model:**
   - **Client input:** Player presses a movement key; client sends `room.send("move", {x, y})` message (not schema state).
   - **Server validation:** IslandRoom receives the move message, validates the input (direction, speed, boundaries), and updates `state.playerPositions[clientId]` with the authoritative position.
   - **Client reconciliation:** Client applies input immediately for responsive rendering, smoothly interpolates toward the server-authoritative position when updates arrive.
   - **Prediction/interpolation:** Client-side prediction layer smooths movement even under latency; server corrections are invisible to the player if the prediction was accurate.

2. **Document the state structure:**
   - Extend `IslandRoomState` with a `playerPositions: MapSchema<PlayerPosition>` (where `PlayerPosition` contains `x`, `y`, `direction`, `velocity`).
   - Keep movement input discrete (messages), not continuous (schema state).

3. **Outline the client-side flow:**
   - Input handler sends movement commands.
   - Local movement system applies input immediately.
   - Movement sync layer listens for position updates from the room and interpolates.

4. **Create a design document (`apps/api/docs/movement-sync-design.md`)** outlining the full model, latency tolerance, and edge cases (teleport, collision, speed hacking prevention).

**INPUTS NEEDED:**
- Understanding of the existing movement system (IslandScene, PlayerController).
- Multiplayer game design patterns (server authority, prediction, reconciliation).

**DELIVERABLE:**
- Design document for movement synchronization.
- Clear separation: messages for input, schema for authoritative state.

**SUCCESS CRITERIA:**
- Design is documented and reviewed.
- Future movement implementation can follow the spec without redesign.

**ESTIMATED EFFORT:**  
60–90 minutes (design, documentation, review).

**DEPENDENCIES:** Task 10 (chat proof complete).

**SOURCE:** My own emphasis on clarity for future phases. All models endorsed deferring movement to post-chat.

---

### TASK 12: Create a Development Checklist for Multiplayer Features

**WHY:** Ensures consistent quality and architectural adherence as more multiplayer features are added after the chat proof.

**OWNER PROFILE:** Tech lead or senior engineer responsible for maintaining the multiplayer roadmap.

**STEPS:**

1. Create a `docs/multiplayer-checklist.md` file that future features must follow.
2. Include items such as:
   - ✅ Feature uses the `MultiplayerManager` boundary (no direct Colyseus calls in components).
   - ✅ Feature events are typed in `GameBridgeEvents`.
   - ✅ Shared types are defined in `packages/shared` and exported.
   - ✅ Server-side logic is in the appropriate room class.
   - ✅ Input is validated on the server, not trusted from the client.
   - ✅ Feature is tested with two-tab/multi-client scenario.
   - ✅ Latency is acceptable for the feature type (chat <300 ms, movement <100 ms target).
   - ✅ Error handling includes `onUncaughtException` or equivalent.
   - ✅ UI is responsive and handles disconnection gracefully.

**DELIVERABLE:**
- Checklist document.

**SUCCESS CRITERIA:**
- Checklist is clear and easy to apply.
- Future PRs reference the checklist.

**ESTIMATED EFFORT:**  
30–45 minutes.

**DEPENDENCIES:** Task 10 (chat proof complete, patterns established).

**SOURCE:** My own quality assurance emphasis. Ensures the architecture remains clean as scope expands.

---

## DEPENDENCIES MAP

```
Task 1 (Client package verification)
  └─ Task 3 (Install dependencies)
       ├─ Task 4 (Create shared schema)
       │    └─ Task 5 (Implement IslandRoom)
       │         ├─ Task 6 (Create MultiplayerManager)
       │         │    ├─ Task 7 (Input guards)
       │         │    └─ Task 8 (ChatWidget UI)
       │         │         └─ Task 10 (Two-tab smoke test)
       │         └─ Task 9 (Caddy routing)
       │              └─ Task 10 (Smoke test, staging variant)
       └─ Task 2 (Spike: Hono + WebSocket coexistence)
            └─ Task 3 (Confirms the server setup pattern)

Task 10 (Chat proof complete)
  └─ Task 11 (Movement sync design)
  └─ Task 12 (Multiplayer checklist)
```

**Critical Path:** Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 8 → Task 10 (approximately 8–10 weeks for a solo/pair developer).

**Parallelizable:** Task 7 (input guards) and Task 9 (Caddy config) can be done during Task 5–Task 6 implementation; they don't block each other.

---

## REJECTED IDEAS

| Idea | Reason |
|------|--------|
| **Using older Colyseus API (`new Server().attach()` pattern)** | Incompatible with Colyseus v0.17 and does not properly integrate with the existing Hono server. Version 0.17 requires `defineServer()`/`defineRoom()`. |
| **Running Colyseus on a separate port (8787)** | Adds operational complexity (second process, Docker container, port management). Single-process integration on port 4000 is cleaner and aligns with the existing architecture. |
| **Mounting ChatWidget in a non-existent `MatchPage.tsx`** | `MatchPage` does not exist in the repository. Mounting in the actual `GamePage.tsx` preserves the real codebase. |
| **Direct `game.scale` access in chat UI** | Bypasses the existing `ScaleManager` singleton, introducing layout inconsistency. The chat widget must use `ScaleManager` like other game UI. |
| **Guarding input only in Phaser's `update()` loop** | Misses global keyboard listeners (`keyboard.on(DOWN)` for E/I/Esc). The input guard must apply to both polling and event-based paths. |
| **Persisting chat history to a database in the chat-proof milestone** | Out of scope for the smoke test. Room-scoped, in-memory chat history is sufficient to prove multiplayer works. Persistence is a post-proof enhancement. |
| **Adding movement synchronization to the chat proof** | Expands scope and couples two features. Chat is a clean, simple proof-of-concept. Movement should follow in the next phase with its own careful design. |
| **Client-side authority for any multiplayer feature** | Server authority is non-negotiable. Clients send input/requests; the server owns the truth. |
| **Using old client package (`colyseus.js` if the version requires `@colyseus/sdk`)** | Import mismatches cause runtime errors. Task 1 verifies the correct package before any code is written. |

---

## STATUS OF IDEAS

| Idea / Proposal | Proposer(s) | Consensus Status | Document Status |
|---|---|---|---|
| Single-process Colyseus on port 4000, integrated with Hono | All models | ✅ Full consensus | **Task 3** |
| `IslandRoom` as authoritative room with schema-backed chat state | All models | ✅ Full consensus | **Task 5** |
| `MultiplayerManager` as the single network boundary | All models | ✅ Full consensus | **Task 6** |
| Input guard covering both `update()` and global listeners | Gemini, Claude, **my validation** | ✅ Endorsed | **Task 7** |
| Chat UI in `GamePage.tsx` (not non-existent `MatchPage`) | Grok, Claude, **amended from v1** | ✅ Endorsed | **Task 8** |
| Use existing `ScaleManager` for chat sizing | Claude, **amended from v1** | ✅ Endorsed | **Task 8** |
| Zod validation + optional rate limiting in IslandRoom | v2 amendment, Claude | ✅ Endorsed | **Task 5** |
| Caddy `/matchmake*` routing with automatic WS upgrade | Gemini, v2 amendment | ✅ Endorsed | **Task 9** |
| Two-tab smoke test as acceptance criteria | All models | ✅ Full consensus | **Task 10** |
| Defer movement sync to post-chat phase | All models | ✅ Full consensus | **Deferred to Task 11** |
| Verify Colyseus client package before coding | All models, **emphasized by my circuit-breaker role** | ✅ Critical blocker | **Task 1** |
| Spike: Test Hono + WebSocket coexistence | Claude, **my circuit-breaker validation** | ✅ Endorsed | **Task 2** |
| Extended UX requirements (styling, responsiveness) | User purpose statement, **my enhancement** | ✅ Added | **Task 8** |
| Development checklist for future features | **My emphasis on quality** | ✅ Recommended | **Task 12** |

---

## IMPLEMENTATION NOTES FOR THE AGENT

1. **Start with Task 1 (Colyseus package verification).** This is a 10-minute confirmation that prevents downstream rework.

2. **Run Task 2 (spike) before committing to the full server setup.** The Hono + WebSocket timing question must be resolved locally first.

3. **Tasks 3–5 are the core server stack.** Complete them in order and test locally before moving to client integration.

4. **Tasks 6–8 are the client and UI.** These can proceed in parallel with Task 9 (Caddy) if infrastructure is available; they don't block each other.

5. **Task 7 (input guards) is critical for UX.** Do not skip the dual-path guarding (both `update()` and global listeners). Test it explicitly with keyboard input.

6. **Task 10 (smoke test) is the gate.** Everything else is scaffolding. The smoke test must pass completely before declaring the chat proof done.

7. **Keep the chat proof tight.** Do not add lobbies, persistence, movement, multi-room logic, or cosmetic polish beyond what Task 8 specifies. Ship Task 10 passing, then plan Task 11.

8. **Document as you go.** Code comments, commit messages, and the design document for movement (Task 11) will make future features much faster to implement.

---

## SUCCESS METRICS

Upon completion of **Task 10** (Two-Tab Smoke Test), the following should be true:

- ✅ Colyseus v0.17 is running on port 4000, integrated with the existing Hono server.
- ✅ One `IslandRoom` exists and synchronizes chat state to all connected clients.
- ✅ The chat widget is visibly polished, responsive, and easy to use.
- ✅ Two tabs can exchange chat messages with <300 ms latency.
- ✅ Typing in the chat does not trigger gameplay actions (input guards working).
- ✅ Reloading a tab restores the message backlog (server-authoritative history).
- ✅ The server logs are clean; no errors or warnings.
- ✅ Caddy routing works in staging (if applicable).
- ✅ The architecture is clean: `MultiplayerManager` owns the network, components communicate via `gameBridge`, server validates all input.

**Result:** A credible, visible, polished multiplayer foundation that proves the technology works and sets up a clear path for movement, lobbies, and broader multiplayer features.
