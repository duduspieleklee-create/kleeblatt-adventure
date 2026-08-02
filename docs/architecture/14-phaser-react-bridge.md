# 14 – Phaser 3 + React Bridge

**Version:** 1.0  
**Stand:** 3. August 2026  
**Status:** Design Decision

---

## 1. Ziel

Festlegen, wie **Phaser 3** (2D-Gameplay) und **React** (Meta-UI: Login, Shop, Inventar, Claim) kommunizieren – ohne dass eine Seite die andere „besitzt“.

**Engine-Kontext:** Phaser 3 (aktuell 3.8x), TypeScript, Vite.  
**Shell:** React über der Engine.

---

## 2. Grundprinzip

```
React Shell (Login, Shop, Inventar, Claim, HUD-Overlays)
        ↕  Bridge (Events + ggf. leichter UI-Store)
Phaser Game (Scenes: Boot, Match, Result, …)
        ↕
Game Backend / SDK
```

| Richtung | Typische Fälle |
|----------|----------------|
| **React → Phaser** | Match starten, Pause, Settings, Feedback nach Mint |
| **Phaser → React** | Match zu Ende, Loot, Inventar öffnen, HP für HUD |
| **Beide → Backend** | Auth, Inventar, Mint, Stake, Claim |

**Nicht:** React rendert Sprites. **Nicht:** Phaser baut den Shop.

**Source of Truth für Items:** Game Backend – nicht die Bridge.

---

## 3. Empfohlenes Muster: Event Bus + Game Handle

### 3.1 React: Phaser mounten

```tsx
// GameCanvas.tsx
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "./phaser/createGameConfig";
import { gameBridge } from "./bridge/gameBridge";

export function GameCanvas() {
  const parentRef = useRef<HTMLDivElement>(null);
  const created = useRef(false);

  useEffect(() => {
    if (!parentRef.current || created.current) return;
    created.current = true;

    const game = new Phaser.Game(
      createGameConfig(parentRef.current, gameBridge)
    );
    gameBridge.attachGame(game);

    return () => {
      gameBridge.detachGame();
      game.destroy(true);
      created.current = false;
    };
  }, []);

  return <div ref={parentRef} id="phaser-root" className="w-full h-full" />;
}
```

`created`-Ref: schützt vor Doppel-Mount (React Strict Mode).

### 3.2 Bridge

```ts
// bridge/gameBridge.ts
type Handler = (payload?: unknown) => void;

class GameBridge {
  private game: Phaser.Game | null = null;
  private listeners = new Map<string, Set<Handler>>();

  attachGame(game: Phaser.Game) {
    this.game = game;
  }

  detachGame() {
    this.game = null;
  }

  on(event: string, handler: Handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)!.delete(handler);
  }

  emit(event: string, payload?: unknown) {
    this.listeners.get(event)?.forEach((h) => h(payload));
  }

  /** React → Phaser */
  sendToGame(event: string, payload?: unknown) {
    if (!this.game) return;
    this.game.events.emit(event, payload);
  }
}

export const gameBridge = new GameBridge();
```

### 3.3 Phaser Config + Registry

```ts
// phaser/createGameConfig.ts
export function createGameConfig(
  parent: HTMLElement,
  bridge: { /* GameBridge */ }
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    scene: [/* BootScene, MatchScene, ... */],
    callbacks: {
      preBoot: (game) => {
        game.registry.set("bridge", bridge);
      },
    },
  };
}
```

In Scenes: `const bridge = this.game.registry.get("bridge")`.

### 3.4 Scene: empfangen und senden

```ts
export class MatchScene extends Phaser.Scene {
  constructor() {
    super("MatchScene");
  }

  create() {
    this.game.events.on("match:pause", this.onPause, this);
    this.game.events.on("match:resume", this.onResume, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("match:pause", this.onPause, this);
      this.game.events.off("match:resume", this.onResume, this);
    });
  }

  private onPause = () => this.scene.pause();
  private onResume = () => this.scene.resume();

  endMatch(result: { won: boolean; lootItemIds: string[] }) {
    const bridge = this.game.registry.get("bridge");
    bridge.emit("match:ended", result);
  }
}
```

### 3.5 React Hook

```ts
// hooks/useGameEvent.ts
import { useEffect } from "react";
import { gameBridge } from "../bridge/gameBridge";

export function useGameEvent(event: string, handler: (payload: any) => void) {
  useEffect(() => gameBridge.on(event, handler), [event, handler]);
}
```

```tsx
function MatchOverlay() {
  useGameEvent("match:ended", (result) => {
    openLootModal(result.lootItemIds);
  });

  return (
    <button onClick={() => gameBridge.sendToGame("match:pause")}>
      Pause
    </button>
  );
}
```

---

## 4. Event-Vertrag v1

Wenige, stabile Namen. Keine Per-Frame-Spam-Events außer bewusst für HUD.

| Event | Richtung | Payload (Beispiel) |
|-------|----------|---------------------|
| `match:start` | React → Phaser | `{ matchId, loadout }` |
| `match:pause` | React → Phaser | — |
| `match:resume` | React → Phaser | — |
| `match:ended` | Phaser → React | `{ won, lootItemIds }` |
| `player:hp` | Phaser → React | `{ current, max }` |
| `ui:open-inventory` | Phaser → React | — |
| `inventory:updated` | React → Phaser | `{ itemIds }` (nur wenn nötig) |
| `item:secured` | React → Phaser | `{ itemId }` (Feedback) |

Erweiterungen nur mit Doc-Update.

---

## 5. Was **nicht** über die Bridge läuft

| Thema | Stattdessen |
|-------|-------------|
| Mint / Claim / Shop-Kauf | React → Backend / SDK |
| Auth-Session | React / HTTP |
| Vollständiges Inventar (Source of Truth) | Server; React cached; Phaser nur Loadout |
| Jeder Physik-Tick | Phaser-intern |

Bridge = **UI- und Flow-Signale**, nicht Netzwerkprotokoll.

---

## 6. Varianten (Kurzvergleich)

| Ansatz | Vorteil | Nachteil |
|--------|---------|----------|
| **Event Bus (gewählt)** | Entkoppelt, einfach | Disziplin bei Namen |
| Globaler React-Store für alles | Devtools | Phaser koppelt an UI-State; riskant bei 60 fps |
| `postMessage` / iframe | Harte Isolation | Meist unnötiger Overhead |
| UI nur in Phaser | Eine Runtime | Shop/Onboarding in Phaser ungeeignet |

Optional: **React-Store nur für Meta-UI** (Modal offen, Shop-Tab). Phaser schreibt dort nicht jeden Frame.

---

## 7. Lebenszyklus & Fallstricke

| Thema | Regel |
|-------|--------|
| Strict Mode | Game nur einmal erzeugen (`created` Ref) |
| Unmount | `game.destroy(true)` + `detachGame` |
| Scene-Shutdown | Listener an `game.events` entfernen |
| Resize | Phaser Scale Mode + CSS am Container abstimmen |
| Modal offen | `game.input.enabled = false` und/oder `match:pause` |

---

## 8. Scene-Schnitt (Vorschlag)

| Scene | Aufgabe | React-Bezug |
|-------|---------|-------------|
| `BootScene` | Assets, Config | Loading-UI optional in React |
| `MatchScene` | Kern-Gameplay | Pause/HUD/Ende über Bridge |
| `ResultScene` | Optional kurz in Phaser | Oder Loot komplett in React nach `match:ended` |

**Empfehlung:** Loot-Reveal, „Item sichern“, Shop in **React** – Phaser endet mit `match:ended`.

---

## 9. Festlegungen Kleeblattadventure

| Thema | Entscheidung |
|-------|----------------|
| Engine | Phaser 3 (3.8x), TypeScript, Vite |
| Meta-UI | React Shell |
| Kommunikation | `gameBridge` (`emit` / `on` / `sendToGame`) |
| Phaser intern | `game.events` + Registry `bridge` |
| Items / Ownership | Backend + SDK, nicht Bridge |
| Event-Vertrag | Abschnitt 4 dieses Docs |

---

## 10. Ein-Satz-Zusammenfassung

**React und Phaser teilen einen kleinen Event-Bus: React steuert Flow und Meta-UI, Phaser liefert Spiel-Ergebnisse – Geld und Ownership laufen über das Backend.**

---

## Verwandte Docs

- [13-sdk-api-skizze-v1.md](./13-sdk-api-skizze-v1.md) – Secure / Claim APIs
- [10-player-journeys.md](./10-player-journeys.md) – UX nach Match/Loot
- [11-onboarding-journey.md](./11-onboarding-journey.md) – Login vor dem Canvas
