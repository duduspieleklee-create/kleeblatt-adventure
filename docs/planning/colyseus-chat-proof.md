# Colyseus Chat-Proof – Start-Insel

**Stand:** 20. August 2026
**Bezug:** Monorepo `apps/web` (React + Phaser 4.2, Scale.FIT 1280×720), `apps/api` (Hono), `packages/shared` (enthält `gameBridge`)

---

## Entscheidung: KEINE Docker-Image für Colyseus

Colyseus ist eine **Bibliothek**, kein eigenständiger Dienst. Wir mounten sie in den bestehenden `apps/api`-Prozess via `gameServer.attach(server)` — gleicher Prozess, gleicher Port, gleiche Deploy-Unit. Kein neues Image, kein neuer Container, keine neue Portfreigabe.

Ein eigenes Image wäre nur sinnvoll bei horizontaler Skalierung (mehrere API-Replicas, Redis-Presence). Für den Chat-Proof auf der Start-Insel ist das Overkill und bewusst **nicht** Teil dieses Plans.

---

## Ziel

Globaler Raum-Chat auf der Start-Insel. Wenn zwei Tabs in Echtzeit miteinander reden können, ist bewiesen: Connect + Relay + React↔Phaser-Bridge (`gameBridge`) + ScaleManager-Sizing + Caddy-WS-Routing funktionieren alle. Der Chat ist also der Rauchtest für die gesamte Colyseus-Integration.

---

## Architektur-Überblick

```
Browser Tab A ─┐                                              ┌─ ChatWidget (React, MatchPage)
               ├─ ColyseusClient ─WS─ /matchmake ─┐           │     ↕ gameBridge
Browser Tab B ─┘                                  │           │
                                                  ▼           │
                                        apps/api (Hono + Colyseus)
                                        IslandRoom  ◄─────────┘ MultiplayerManager
                                          │  onMessage("chat")
                                          ▼  push → IslandRoomState.messages (cap 50)
                                        Broadcast an alle Clients
```

`gameBridge` (aus `@kleeblatt/shared`) ist der etablierte Event-Bus zwischen Phaser und React — wir erfinden keinen neuen.

---

## Tasks

| Ticket | Was | Done wenn | Dateien |
|--------|-----|-----------|---------|
| T0 | Colyseus in `apps/api` installieren (`colyseus`, `@colyseus/ws-transport`) + in `apps/web` (`colyseus.js`). In `apps/api/src/index.ts`: http.Server bauen, `new Server({transport: WebSocketTransport({server})})`, `gameServer.attach(server)`, `gameServer.define("island", IslandRoom)`. Env `VITE_COLYSEUS_URL` (Default `http://localhost:8787`). | `npm run build` in api+web grün; Server loggt "listening" ohne 2. listen(). | `apps/api/package.json`, `apps/web/package.json`, `apps/api/src/index.ts`, `.env.example` |
| T1 | Schema in `packages/shared`: `ChatMessage {sessionId:string, name:string, text:string, ts:number}` + `IslandRoomState.messages: ArraySchema<ChatMessage>` (cap 50). Shared nach Edit rebuilden (wird vorkompiliert von api+web konsumiert). | Shared-Typecheck grün; IslandRoomState hat `messages`. | `packages/shared/src/**`, rebuild-Skript |
| T2 | `IslandRoom` (apps/api): `onMessage("chat", ({text}))` → trim, auf 200 Zeichen cap, Control-Chars strippen, leer reject. Push `ChatMessage{sessionId, name:client.name, text, ts:Date.now()}`; Array auf letzte 50 trimmen. `name` aus Join-Option oder `Guest-<rand>`. Backlog kommt für neue Joiner via Full-State-Sync gratis. Kein DB, room-scoped. | Tab B sieht nach Reload die letzten 50 Nachrichten. | `apps/api/src/rooms/IslandRoom.ts` |
| T3 | Client: `ColyseusClient` (join `"island"`, Option `{name}`); `MultiplayerManager` (neu `apps/web/src/game/multiplayer/`): `room.state.messages.onAdd(msg => gameBridge.emit("chat:message", {name,text,ts}))`; `sendChat(text) => room.send("chat",{text})`. In `IslandScene.create`/`shutdown` verdrahten. | Manager verbindet + empfängt Broadcast. | `apps/web/src/game/multiplayer/*`, `apps/web/src/game/scenes/IslandScene.ts` |
| T4 | UI: Floating Shortcut-Rail links. Item1 = Questbook 📖 (mounten — existiert als `QuestPanel` aber ist noch nicht gemountet), Item2 = Chat 💬 **direkt darunter**. Klick toggelt `ChatWidget`. `ChatWidget` (neu, in `MatchPage` gemountet): scrollbare Liste (letzte 50) + One-Line-Input. Enter=send, Esc/Blur=close, Auto-Scroll, `name: text` + `HH:MM`. Send → `gameBridge.emit("chat:send")` → MultiplayerManager. Receive → `gameBridge.on("chat:message")` → append. | Bubble unten links sichtbar; öffnen zeigt Panel; Nachricht erscheint. | `apps/web/src/components/ChatWidget.tsx` (neu), `apps/web/src/pages/MatchPage.tsx`, Rail-Komponente (neu) |
| T5 | **Scale-aware Sizing (Entscheidung):** An ScaleManager hängen. `FIT`+`CENTER_BOTH` letterboxt Canvas, echte Größe ≠ Fenstergröße. `game.scale.on(RESIZE)` setzt `--chat-w`/`--chat-h` aus `displaySize`; Panel = `width: clamp(260px, 30%*var(--chat-w), 380px)`, `height: clamp(220px, 45%*var(--chat-h), 360px)`. vmin-Fallback vor Event. **Abgelehnt:** reines vmin (ignoriert Letterbox, driftet bei Extrem-Verhältnissen aus dem Canvas). | Panel bleibt proportional + on-canvas bei Resize/Fenstergröße. | CSS-Variablen in Rail/Widget, `game.scale` Listener in Manager/Widget |
| T6 | Input-Guard in `DesktopKeyboardController.ts`: oben in `update()` → `if (activeElement ist INPUT/TEXTAREA) return;` — kein Laufen während dem Tippen. Future-proof für alle DOM-Inputs. | Halten von Bewegungstaste + Tippen → Spieler bleibt stehen. | `apps/web/src/game/input/DesktopKeyboardController.ts` |
| T7 | Caddy: `/matchmake` (+`/colyseus`) mit WebSocket-Upgrade → API-Port. Kein Container-Wechsel, nur Routing. | `wscat -c ws://<domain>/matchmake` verbindet. | Caddyfile (lokal staging) |
| T8 | Verifikation: Zwei Tabs joinen IslandRoom → Tab A "hi" → Tab B <300ms. Reload Tab B → Backlog. Bewegungstaste halten + tippen → steht. Server-Log: room created, 2 clients, broadcast. | Alle 4 Checks grün. | manuell |

---

## Scope Gates (Proof only)

- Kein Persistenz (DB/Historie über Session hinaus)
- Keine Moderation / Profanity-Filter
- Kein Whisper / Private-Message
- Kein Emoji-Filter über Control-Char-Strip hinaus

---

## Flags / Hinweise

- **Questbook-Toggle ist aktuell nicht gemountet.** Die Rail definiert Item1 (📖) daher selbst, damit Chat (Item2) sauber darunter sitzt. Falls zur Laufzeit schon ein Questbook-Shortcut woanders existiert, einfach den Chat-Button direkt darunter einfügen.
- **Deploy-Blocker:** Caddy muss `/matchmake` mit WS-Upgrade zur API durchreichen. Vor T7 klären, ob die API überhaupt vom Browser-Origin erreichbar ist (hinter Caddy) oder nur intern.

---

## Verifikation (der eigentliche Proof)

1. Zwei Tabs öffnen, beide joinen IslandRoom.
2. Tab A tippt "hi" → Tab B zeigt es < 300 ms.
3. Tab B reload → sieht Backlog (letzte 50).
4. Bewegungstaste halten + tippen → Spieler bewegt sich nicht (Guard T6).
5. Server-Log zeigt: room created, 2 clients, broadcast.

Wenn 1–5 grün sind, ist die komplette Colyseus-Integration (Connect, Relay, Bridge, ScaleManager, Caddy-WS) bewiesen und kann für echtes Multiplayer (Remote-Player, Bewegungssync) ausgebaut werden.
