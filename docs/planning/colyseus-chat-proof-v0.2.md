# Colyseus Chat-Proof – Start-Insel

**Stand:** 20. August 2026 (v2, überarbeitet nach Code-Audit) **Bezug:** Monorepo `apps/web` (React + Phaser 4.2, Scale.FIT 1280×720), `apps/api` (Hono), `packages/shared` (enthält `gameBridge`)

---

## Änderungen ggü. v1 (Audit-Zusammenfassung)

Dieser Plan wurde gegen den tatsächlichen Repo-Stand (Zip vom 20.08.2026) und die aktuelle Colyseus-Doku (v0.17) geprüft. **Zum Zeitpunkt des Audits existiert noch kein Colyseus-Code im Repo** – alle Punkte unten sind Korrekturen am Plan selbst, bevor implementiert wird.

| # | Ticket | Fund | Fix |
|---|---|---|---|
| 🔴 | T0 | Plan nutzt veraltete API (`new Server()` + `gameServer.attach()`); Colyseus ist bei v0.17 (`defineServer`/`defineRoom`) | Server-Setup neu geschrieben, siehe Code-Referenz |
| 🔴 | T0 | `VITE_COLYSEUS_URL`-Default `8787` passt nicht zum echten API-Port (`env.ts`: Default `4000`) | Default korrigiert auf `4000` |
| 🔴 | T1 | `@colyseus/schema`'s `@type()`-Decorator braucht `experimentalDecorators: true` + `useDefineForClassFields: false`; Projekt-Base-`tsconfig` (target ES2022) hat das nicht gesetzt → Schema kompiliert falsch oder gar nicht | Override in `packages/shared/tsconfig.json` ergänzt |
| 🔴 | T6 | `E`/`I`/`Esc` sind globale `keyboard.on(DOWN,...)`-Listener, **nicht** Teil von `update()` – ein Guard nur in `update()` schützt nicht davor, dass Tippen im Chat (z. B. Buchstabe „i“) den Questbook togglet | Gemeinsamer `isTypingInInput()`-Helper, in `update()` **und** allen drei Handlern |
| 🟠 | T3 | `gameBridge.ts` hat ein strikt getyptes `GameBridgeEvents`-Interface ohne `chat:*`-Einträge | Explizite Erweiterung als Teilschritt in T3 |
| 🟠 | T3 | Client-State-Sync läuft in 0.17 über `Callbacks.get(room)`, nicht `room.state.messages.onAdd(...)` direkt | Code korrigiert |
| 🟠 | T4 | `MatchPage` existiert nicht im Repo (nur `GamePage.tsx`, `HomePage.tsx`) | Mount-Punkt korrigiert auf `GamePage.tsx` |
| 🟠 | T5 | Es gibt bereits `apps/web/src/game/managers/ScaleManager.ts` (Singleton `scaleManager` mit eigener Resize-Subscription-API) | An bestehenden Wrapper andocken statt direkt `game.scale` |
| 🟡 | T2 | Manuelles Sanitizing statt Colyseus' nativem `validate()` + Zod (Zod v4 ist in `apps/api` bereits Dependency) | `validate()`-Pattern übernommen |
| 🟡 | T2 | Kein Crash-Schutz | `onUncaughtException` ergänzt |
| 🟡 | T7 | Stage-Caddyfile existiert bereits, proxied `/api/*` etc. nach Port `4000` – Plan ging von unbekanntem Setup aus | Konkreter Diff gegen die echte Caddyfile |
| 🟡 | — | Namensnähe `/match/start` (bestehende REST-Route) vs. `/matchmake` (Colyseus) | Klarstellung ergänzt |

---

## Entscheidung: KEIN Docker-Image für Colyseus

Colyseus ist eine **Bibliothek**, kein eigenständiger Dienst. Wir mounten sie in den bestehenden `apps/api`-Prozess – **gleicher Prozess, gleicher Port, sogar dasselbe `http.Server`-Objekt** wie Hono (siehe T0: Colyseus' `WebSocketTransport` bekommt den von `@hono/node-server` erzeugten Server übergeben, statt selbst einen zu öffnen). Kein neues Image, kein neuer Container, keine neue Portfreigabe.

Ein eigenes Image wäre nur sinnvoll bei horizontaler Skalierung (mehrere API-Replicas, Redis-Presence). Für den Chat-Proof auf der Start-Insel ist das Overkill und bewusst **nicht** Teil dieses Plans.

**Für später:** Die Redis-Migration (`RedisPresence`/`RedisDriver`) ist bei Bedarf isoliert in der `defineServer(...)`-Config nachrüstbar (`presence`/`driver`-Optionen) – kein Room-Code muss sich dafür ändern. Das ist der Vorteil, jetzt schon auf `defineServer` zu bauen statt auf das alte `attach()`-Pattern.

---

## Ziel

Globaler Raum-Chat auf der Start-Insel. Wenn zwei Tabs in Echtzeit miteinander reden können, ist bewiesen: Connect + Relay + React↔Phaser-Bridge (`gameBridge`) + ScaleManager-Sizing + Caddy-WS-Routing funktionieren alle. Der Chat ist also der Rauchtest für die gesamte Colyseus-Integration.

---

## Architektur-Überblick

```
Browser Tab A ─┐                                              ┌─ ChatWidget (React, GamePage)
               ├─ ColyseusClient ─WS─ /matchmake ─┐           │     ↕ gameBridge
Browser Tab B ─┘                                  │           │
                                                  ▼           │
                     apps/api: EIN http.Server (via @hono/node-server, Port 4000)
                     ├─ Hono-Fetch-Handler   (REST: /api/*, /health, /me, /match/*, ...)
                     └─ Colyseus WebSocketTransport → IslandRoom   ◄── MultiplayerManager
                                       │  messages.chat (validate()+Zod)
                                       ▼  push → IslandRoomState.messages (cap 50)
                                     Broadcast an alle Clients
```

`gameBridge` (aus `@kleeblatt/shared`) ist der etablierte Event-Bus zwischen Phaser und React — wir erfinden keinen neuen. **Wichtig:** `gameBridge.ts` pflegt ein strikt getyptes `GameBridgeEvents`-Interface; neue Event-Typen müssen dort explizit eingetragen werden (siehe T3).

**Hinweis zur Namensnähe:** `POST /match/start` ist eine bestehende REST-Route (Match-Session starten, XP-Ergebnis einreichen, `apps/api/src/routes/match.ts`) und hat **nichts** mit Colyseus' `/matchmake`-Endpoint zu tun. Beim Caddy-Routing (T7) und in der Doku nicht verwechseln.

---

## Tasks

| Ticket | Was | Done wenn | Dateien |
| ------ | --- | --------- | ------- |
| T0 | Colyseus in `apps/api` installieren (`colyseus`, `@colyseus/ws-transport`) + in `apps/web` (Client-SDK, **Paketname vor Install verifizieren** – Doku zeigt aktuell `@colyseus/sdk`, ältere Anleitungen `colyseus.js`). Server-Setup über `defineServer()`/`defineRoom()` (0.17-API), Colyseus teilt sich den `http.Server`, den `@hono/node-server`'s `serve()` bereits erzeugt hat – siehe Code-Referenz. `VITE_COLYSEUS_URL` Default `http://localhost:4000` (nicht 8787). | `npm run build` in api+web grün; Server loggt „listening" ohne 2. `listen()`; **Spike zuerst**: lokal verifizieren, dass `WebSocketTransport({server})` mit dem bereits laufenden `@hono/node-server`-Server sauber koexistiert. | `apps/api/package.json`, `apps/web/package.json`, `apps/api/src/index.ts`, `apps/api/src/rooms/IslandRoom.ts`, `.env.example` |
| T1 | Schema in `packages/shared/src/multiplayer/`: `ChatMessage` + `IslandRoomState.messages: ArraySchema<ChatMessage>` (cap 50) mit `@colyseus/schema`. **Voraussetzung:** `experimentalDecorators`/`useDefineForClassFields` in `packages/shared/tsconfig.json` setzen (siehe Code-Referenz), sonst kompilieren die `@type()`-Decorator falsch. `@colyseus/schema` zu `packages/shared/package.json`-Dependencies hinzufügen. Explizit in `packages/shared/src/index.ts` re-exportieren (kein `export *` im Projekt-Stil). | Shared-Typecheck grün; `IslandRoomState` hat `messages`; Typen sind aus `@kleeblatt/shared` importierbar. | `packages/shared/src/multiplayer/*`, `packages/shared/src/index.ts`, `packages/shared/tsconfig.json`, `packages/shared/package.json` |
| T2 | `IslandRoom` (apps/api): `messages = { chat: validate(zodSchema, handler) }`-Pattern (Colyseus-natives Composability-Feature) statt manueller Sanitization – Zod übernimmt Trim + Länge (max 200), Control-Char-Strip bleibt als expliziter Schritt im Handler. `name` aus Join-Option ebenfalls validieren/cappen (20 Zeichen) über typisierten `Client<{userData:{name}}>`. `onUncaughtException` ergänzen, damit ein kaputter Payload nicht die ganze Room-Instanz crasht. Push `ChatMessage`; Array auf letzte 50 trimmen. Backlog kommt für neue Joiner via Full-State-Sync gratis. Kein DB, room-scoped. Optional (nicht blockierend): simples Cooldown (300ms/Client) gegen Flooding. | Tab B sieht nach Reload die letzten 50 Nachrichten; ein absichtlich kaputter Payload (z. B. `text: null`) crasht den Room nicht, sondern wird sauber abgelehnt. | `apps/api/src/rooms/IslandRoom.ts` |
| T3 | Client: `ColyseusClient` (join `"island"`, Option `{name}`) über den `@colyseus/sdk`-Client. `MultiplayerManager` (neu `apps/web/src/game/multiplayer/`): State-Sync über `Callbacks.get(room)` + `callbacks.onAdd("messages", ...)` → `gameBridge.emit("chat:message", {...})`; `sendChat(text) => room.send("chat",{text})`. **Zusätzlicher Schritt:** `chat:message`/`chat:send` explizit in `GameBridgeEvents` (`packages/shared/src/gameBridge.ts`) eintragen, sonst kein Typ-Schutz. In `IslandScene.create`/`shutdown` verdrahten. | Manager verbindet + empfängt Broadcast; `chat:message`/`chat:send` sind in `GameBridgeEvents` getypt, kein `any`-Fallback nötig. | `apps/web/src/game/multiplayer/*`, `apps/web/src/game/scenes/IslandScene.ts`, `packages/shared/src/gameBridge.ts` |
| T4 | UI: Floating Shortcut-Rail links. Item1 = Questbook 📖 (mounten — existiert als `QuestPanel` aber ist noch nicht gemountet), Item2 = Chat 💬 **direkt darunter**. Klick toggelt `ChatWidget`. `ChatWidget` (neu, **in `GamePage.tsx` gemountet** – `MatchPage` existiert nicht im Repo): scrollbare Liste (letzte 50) + One-Line-Input. Enter=send, Esc/Blur=close, Auto-Scroll, `name: text` + `HH:MM`. Send → `gameBridge.emit("chat:send")` → MultiplayerManager. Receive → `gameBridge.on("chat:message")` → append. **Koordination mit T6:** Esc schließt den Chat rein auf React-Ebene (Input-`onKeyDown`) – der globale Phaser-`Esc`-Handler ist währenddessen per Guard stumm (siehe T6), löst also nicht zusätzlich `InputEvents.CANCEL` im Spiel aus. | Bubble unten links sichtbar; öffnen zeigt Panel; Nachricht erscheint; Esc schließt nur den Chat, ohne dass gleichzeitig eine Spiel-Interaktion abbricht. | `apps/web/src/components/ChatWidget.tsx` (neu), `apps/web/src/pages/GamePage.tsx`, Rail-Komponente (neu) |
| T5 | **Scale-aware Sizing:** An den bestehenden `scaleManager`-Wrapper andocken (`apps/web/src/game/managers/ScaleManager.ts`, Singleton, bereits mit Resize-Subscription-API), **nicht** direkt `game.scale` (Pattern siehe `IslandScene`'s `cameraResizeUnsub`). `FIT`+`CENTER_BOTH` letterboxt Canvas, echte Größe ≠ Fenstergröße. Resize-Callback setzt `--chat-w`/`--chat-h` aus `scaleManager.getDisplaySize()`; Panel = `width: clamp(260px, 30%*var(--chat-w), 380px)`, `height: clamp(220px, 45%*var(--chat-h), 360px)`. vmin-Fallback vor erstem Resize-Event. **Abgelehnt:** reines vmin (ignoriert Letterbox, driftet bei Extrem-Verhältnissen aus dem Canvas). | Panel bleibt proportional + on-canvas bei Resize/Fenstergröße; kein direkter `game.scale`-Zugriff außerhalb von `ScaleManager.ts`. | CSS-Variablen in Rail/Widget, Subscription auf `scaleManager` in Manager/Widget |
| T6 | Input-Guard in `DesktopKeyboardController.ts`: gemeinsamer `isTypingInInput()`-Helper (prüft `document.activeElement`), angewendet **sowohl** in `update()` (blockt Movement) **als auch** in `onInteract`/`onQuestbook`/`onCancel` (blocken die globalen `keyboard.on(DOWN,...)`-Listener für E/I/Esc — diese laufen unabhängig von `update()` und werden von einem reinen `update()`-Guard nicht erfasst). Future-proof für alle DOM-Inputs. | Halten von Bewegungstaste + Tippen → Spieler bleibt stehen; Tippen von „E"/„I" im Chat-Input löst **keine** Questbook/Interact-Aktion aus. | `apps/web/src/game/input/DesktopKeyboardController.ts` |
| T7 | Caddy: bestehende Stage-Caddyfile (`infra/caddy/Caddyfile`) um `handle /matchmake* { reverse_proxy 127.0.0.1:4000 }` (+optional `/colyseus*` falls Monitor-Panel genutzt wird) ergänzen, im Stil der bestehenden `/api/*`-Blöcke. Caddys `reverse_proxy` erkennt WS-Upgrades i.d.R. automatisch (kein manuelles `Upgrade`/`Connection`-Header-Setzen nötig wie bei nginx) — trotzdem per `wscat` verifizieren. Kein Container-Wechsel, nur Routing. | `wscat -c ws://stage.kleeblatt.space/matchmake` verbindet. | `infra/caddy/Caddyfile` |
| T8 | Verifikation: Zwei Tabs joinen IslandRoom → Tab A "hi" → Tab B <300ms. Reload Tab B → Backlog. Bewegungstaste halten + tippen → steht. Chat-Input: „E"/„I" tippen → keine Spiel-Aktion. Server-Log: room created, 2 clients, broadcast. | Alle 5 Checks grün. | manuell |

---

## Code-Referenz

### T0 — Server-Setup (0.17-API, geteilter `http.Server`)

```ts
// apps/api/src/index.ts
import { serve } from "@hono/node-server";
import { defineServer, defineRoom } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { runMigrationsIfAvailable } from "./db/migrate.js";
import { isDbAvailable } from "./db/client.js";
import { IslandRoom } from "./rooms/IslandRoom.js";

const app = createApp();

await runMigrationsIfAvailable();

console.info(
  `[auth] googleConfigured=${Boolean(env.googleClientId && env.googleClientSecret)} ` +
    `callbackUrl=${env.googleCallbackUrl} webUrl=${env.webUrl} cookieSecure=${env.nodeEnv === "production"} db=${(await isDbAvailable()) ? "postgres" : "memory"}`,
);

// @hono/node-server startet den Node-http.Server sofort und gibt die Referenz
// zurück. Colyseus' WebSocketTransport "mitbenutzt" denselben Server statt
// einen eigenen zu öffnen – gleicher Prozess, gleicher Port, ein Server-Objekt.
const httpServer = serve({ fetch: app.fetch, port: env.port });

defineServer({
  rooms: {
    island: defineRoom(IslandRoom),
  },
  transport: new WebSocketTransport({ server: httpServer }),
});

console.info(`API + Colyseus listening on http://localhost:${env.port}`);
```

⚠️ **Vor Umsetzung verifizieren:** Die Doku bestätigt, dass `WebSocketTransport` einen bestehenden `http.Server` per `server`-Option wiederverwenden kann ("useful when you'd like to use Express along with Colyseus"), zeigt das Beispiel aber mit einem noch nicht lauschenden `createServer()`. Ob das Timing mit einem von `@hono/node-server` bereits gestarteten Server (der schon `.listen()` aufgerufen hat) genauso sauber funktioniert, konnte ich aus der Doku nicht abschließend bestätigen — deshalb der Spike als erster Schritt in T0, bevor der Rest gebaut wird. Fallback, falls es hakt: `@hono/node-server`s `createServer`-Option nutzen, um Hono einen selbst erstellten (noch nicht lauschenden) `http.Server` unterzuschieben, den man dann in exakt der Doku-Reihenfolge an Colyseus übergibt.

```
# apps/web/.env.example (Ergänzung)
VITE_COLYSEUS_URL=http://localhost:4000
```

### T1 — Schema + tsconfig-Fix

```ts
// packages/shared/src/multiplayer/IslandRoomState.ts
import { Schema, type, ArraySchema } from "@colyseus/schema";

export class ChatMessage extends Schema {
  @type("string") sessionId: string = "";
  @type("string") name: string = "";
  @type("string") text: string = "";
  @type("number") ts: number = 0;
}

export class IslandRoomState extends Schema {
  @type([ChatMessage]) messages = new ArraySchema<ChatMessage>();
}
```

```jsonc
// packages/shared/tsconfig.json — Ergänzung im compilerOptions-Block
{
  "extends": "../tsconfig/base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "composite": true,
    // @colyseus/schema's @type()-Decorator braucht legacy Decorators.
    // Bewusst NUR hier gesetzt (nicht in packages/tsconfig/base.json),
    // damit apps/api und apps/web davon unberührt bleiben.
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  },
  "include": ["src/**/*"]
}
```

```ts
// packages/shared/src/index.ts — Ergänzung (Pattern wie bei HeroClass etc.)
export type { ChatMessage, IslandRoomState } from "./multiplayer/IslandRoomState.js";
```

### T2 — `validate()`-Pattern + Exception-Handling

```ts
// apps/api/src/rooms/IslandRoom.ts
import { Room, Client, validate } from "colyseus";
import { z } from "zod";
import { ChatMessage, IslandRoomState } from "@kleeblatt/shared";

type IslandClient = Client<{ userData: { name: string } }>;

const MAX_MESSAGES = 50;
const RATE_LIMIT_MS = 300; // optional, siehe unten

function stripControlChars(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x1F\x7F]/g, "");
}

export class IslandRoom extends Room {
  state = new IslandRoomState();

  private lastMessageAt = new Map<string, number>(); // optional Cooldown

  messages = {
    chat: validate(
      z.object({
        text: z.string().trim().min(1, "leer").max(200, "zu lang"),
      }),
      function (this: IslandRoom, client: IslandClient, message) {
        // Optional, nicht blockierend: simples Anti-Flood-Cooldown.
        const last = this.lastMessageAt.get(client.sessionId) ?? 0;
        if (Date.now() - last < RATE_LIMIT_MS) return;
        this.lastMessageAt.set(client.sessionId, Date.now());

        const text = stripControlChars(message.text);
        if (!text) return;

        const chatMessage = new ChatMessage();
        chatMessage.sessionId = client.sessionId;
        chatMessage.name = client.userData?.name ?? `Guest-${client.sessionId.slice(0, 4)}`;
        chatMessage.text = text;
        chatMessage.ts = Date.now();

        this.state.messages.push(chatMessage);
        if (this.state.messages.length > MAX_MESSAGES) {
          this.state.messages.shift();
        }
      },
    ),
  };

  onJoin(client: IslandClient, options: { name?: string }) {
    const raw = typeof options.name === "string" ? options.name.trim() : "";
    client.userData = { name: raw.slice(0, 20) || `Guest-${client.sessionId.slice(0, 4)}` };
  }

  onUncaughtException(err: Error, methodName: string) {
    console.error(`[IslandRoom] ${methodName}:`, err.message);
  }
}
```

*Hinweis: `validate()` mit `Messages<R>`-Typ braucht laut Doku eine reguläre `function`-Expression statt Arrow-Function, wenn `this` gebraucht wird — oben entsprechend umgesetzt.*

### T3 — Client-Sync + `gameBridge`-Erweiterung

```ts
// packages/shared/src/gameBridge.ts — Ergänzung in GameBridgeEvents
export type GameBridgeEvents = {
  // ... bestehende Einträge unverändert ...

  // Multiplayer-Chat (Colyseus IslandRoom)
  "chat:message": { name: string; text: string; ts: number };
  "chat:send": { text: string };
};
```

```ts
// apps/web/src/game/multiplayer/MultiplayerManager.ts (neu)
import { Client, Callbacks } from "@colyseus/sdk";
import { gameBridge } from "@kleeblatt/shared";
import type { IslandRoomState } from "@kleeblatt/shared";

export class MultiplayerManager {
  private room?: Awaited<ReturnType<Client["joinOrCreate"]>>;

  async connect(colyseusUrl: string, name: string): Promise<void> {
    const client = new Client(colyseusUrl);
    this.room = await client.joinOrCreate<IslandRoomState>("island", { name });

    const callbacks = Callbacks.get(this.room);
    callbacks.onAdd("messages", (msg) => {
      gameBridge.emit("chat:message", { name: msg.name, text: msg.text, ts: msg.ts });
    });
  }

  sendChat(text: string): void {
    this.room?.send("chat", { text });
  }

  disconnect(): void {
    this.room?.leave();
  }
}
```

⚠️ **Paketname vor Install prüfen:** Die aktuelle Colyseus-Doku zeigt den TS-Client als `@colyseus/sdk` (`import { Client, Callbacks } from "@colyseus/sdk"`). Ältere Anleitungen/der ursprüngliche Plan nennen `colyseus.js`. Vor `npm install` kurz gegen die Getting-Started-Seite der jeweils installierten Colyseus-Server-Version prüfen, welcher Client-Paketname aktuell zusammenpasst.

### T6 — Input-Guard (vollständig, ersetzt `DesktopKeyboardController.ts`)

```ts
import Phaser from 'phaser';
import { PlayerInputController } from './PlayerInputController';
import { InputEvents } from './InputEvents';

/** True während der Fokus in einem Text-Input liegt (Chat-Box, künftige Dialog-Inputs, ...). */
function isTypingInInput(): boolean {
  const active = document.activeElement;
  return !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
}

/**
 * WASD + arrows → moveVector
 * E → interact | I → openQuestbook | Escape → cancel
 * Action keys fire once per press via scene events.
 *
 * Alle Pfade (Polling in update() UND die globalen DOWN-Listener für
 * E/I/Esc) sind gegen isTypingInInput() gesichert — ein Guard nur in
 * update() würde die DOWN-Listener nicht erfassen, da diese unabhängig
 * vom update()-Loop feuern.
 */
export class DesktopKeyboardController {
  private readonly scene: Phaser.Scene;
  private readonly inputController: PlayerInputController;
  private readonly eventTarget: Phaser.Events.EventEmitter;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private eKey?: Phaser.Input.Keyboard.Key;
  private iKey?: Phaser.Input.Keyboard.Key;
  private escKey?: Phaser.Input.Keyboard.Key;

  constructor(
    scene: Phaser.Scene,
    inputController: PlayerInputController,
    eventTarget: Phaser.Events.EventEmitter = scene.events,
  ) {
    this.scene = scene;
    this.inputController = inputController;
    this.eventTarget = eventTarget;
    this.bind();
  }

  private bind(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey('W'),
      down: keyboard.addKey('S'),
      left: keyboard.addKey('A'),
      right: keyboard.addKey('D'),
    };

    this.eKey = keyboard.addKey('E');
    this.iKey = keyboard.addKey('I');
    this.escKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.eKey.on(Phaser.Input.Keyboard.Events.DOWN, this.onInteract, this);
    this.iKey.on(Phaser.Input.Keyboard.Events.DOWN, this.onQuestbook, this);
    this.escKey.on(Phaser.Input.Keyboard.Events.DOWN, this.onCancel, this);
  }

  /** Call each frame to refresh continuous move vector. */
  update(): void {
    if (!this.cursors) return;

    if (isTypingInInput()) {
      this.inputController.setMoveVector(0, 0);
      return;
    }

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    const x = (left ? -1 : 0) + (right ? 1 : 0);
    const y = (up ? -1 : 0) + (down ? 1 : 0);

    this.inputController.setMoveVector(x, y);
  }

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

  shutdown(): void {
    this.eKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.onInteract, this);
    this.iKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.onQuestbook, this);
    this.escKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.onCancel, this);
  }
}
```

### T7 — Caddy-Ergänzung (Diff gegen bestehende Stage-Caddyfile)

```caddyfile
# infra/caddy/Caddyfile — innerhalb des stage.kleeblatt.space-Blocks ergänzen,
# direkt neben den bestehenden /api/*, /auth/*, /health, /me Blöcken:

    handle /matchmake* {
        reverse_proxy 127.0.0.1:4000
    }
    # Nur falls @colyseus/monitor für Debugging gemountet wird:
    # handle /colyseus* {
    #     reverse_proxy 127.0.0.1:4000
    # }
```

---

## Scope Gates (Proof only)

- Kein Persistenz (DB/Historie über Session hinaus)
- Keine Moderation / Profanity-Filter
- Kein Whisper / Private-Message
- Kein Emoji-Filter über Control-Char-Strip hinaus
- Das optionale 300ms-Cooldown in T2 ist reiner Flood-Schutz, keine Moderation

---

## Flags / Hinweise

- **Questbook-Toggle ist aktuell nicht gemountet.** Die Rail definiert Item1 (📖) daher selbst, damit Chat (Item2) sauber darunter sitzt. Falls zur Laufzeit schon ein Questbook-Shortcut woanders existiert, einfach den Chat-Button direkt darunter einfügen.
- **Caddy-Ergänzung ist der einzige Infra-Schritt.** Die Stage-Caddyfile proxied `/api/*`, `/auth/*`, `/health`, `/me` bereits nach `127.0.0.1:4000` — es muss nur ein `handle /matchmake*`-Block im gleichen Stil ergänzt werden (siehe T7-Code-Referenz), nicht mehr grundsätzlich geklärt werden, ob die API erreichbar ist.

---

## Verifikation (der eigentliche Proof)

1. Zwei Tabs öffnen, beide joinen IslandRoom.
2. Tab A tippt "hi" → Tab B zeigt es < 300 ms.
3. Tab B reload → sieht Backlog (letzte 50).
4. Bewegungstaste halten + tippen → Spieler bewegt sich nicht (Guard T6).
5. Im Chat-Input „E" oder „I" tippen → keine Interact-/Questbook-Aktion im Spiel (Guard T6, DOWN-Listener-Pfad).
6. Server-Log zeigt: room created, 2 clients, broadcast.

Wenn 1–6 grün sind, ist die komplette Colyseus-Integration (Connect, Relay, Bridge, ScaleManager, Caddy-WS) bewiesen und kann für echtes Multiplayer (Remote-Player, Bewegungssync) ausgebaut werden.
