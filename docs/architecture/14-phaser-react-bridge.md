# 14 – Phaser-React Bridge (gameBridge)

**Version:** 1.1  
**Stand:** 3. August 2026  
**Status:** Design Decision

---

## 1. Zweck

Saubere Trennung zwischen Phaser (Gameplay, Rendering, Input) und React (Meta-UI, HUD, Menüs).  
Die `gameBridge` ist die einzige Kommunikationsschicht zwischen beiden.

```text
React (HUD, Menüs, Inventar)
    ↕ gameBridge (Event Emitter)
Phaser (Match, Map, Combat, Movement)
```

**Regel:** Phaser ruft niemals direkt API-Calls auf. React steuert niemals direkt Phaser-Sprites.

---

## 2. Implementierung

Minimaler Typed Event Emitter (z. B. `mitt` oder eigener):

```typescript
// packages/shared/src/gameBridge.ts

import mitt from "mitt";

export type GameBridgeEvents = {
  // Phaser → React
  "player:hp":           { current: number; max: number };
  "player:resource":    { current: number; max: number; type: "mana" | "stamina" };
  "player:level":       { level: number; xp: number; xpToNext: number };
  "player:death":       {  };
  "player:respawn":     { hp: number };
  "enemy:died":          { enemyId: string; typeId: string; xp: number; x: number; y: number };
  "enemy:damaged":      { enemyId: string; hp: number; maxHp: number };
  "loot:received":       { itemId: string; templateId: string; name: string; rarity: string };
  "match:started":      { matchId: string };
  "match:ended":        { matchId: string; enemiesKilled: number; chestsOpened: number };
  "skill:cooldown":     { skillId: string; readyAt: number };
  "skill:used":         { skillId: string };
  "chest:opened":       { chestId: string };

  // React → Phaser
  "match:start":        { heroClass: string; level: number; equippedStats: Record<string, number> };
  "match:exit":         {  };
  "loadout:update":     { equippedStats: Record<string, number> };
  "pause":              {  };
  "resume":             {  };
};

export const gameBridge = mitt<GameBridgeEvents>();
```

---

## 3. Events: Phaser → React

| Event | Payload | Wann | React macht |
|-------|---------|------|-------------|
| `player:hp` | `{ current, max }` | Spieler nimmt Schaden / heilt | HP-Bar aktualisieren |
| `player:resource` | `{ current, max, type }` | Mana/Stamina ändert sich | Ressourcen-Bar aktualisieren |
| `player:level` | `{ level, xp, xpToNext }` | Nach XP-Gain / Level-Up | Level + XP-Bar aktualisieren |
| `player:death` | `{}` | HP ≤ 0 | Death-Overlay, Respawn-Timer anzeigen |
| `player:respawn` | `{ hp }` | Nach Respawn-Delay | Overlay ausblenden |
| `enemy:died` | `{ enemyId, typeId, xp, x, y }` | Enemy stirbt | XP-Animation, Loot-Hinweis |
| `enemy:damaged` | `{ enemyId, hp, maxHp }` | Enemy nimmt Schaden | Enemy-HP-Bar (über Sprite oder World-Space) |
| `loot:received` | `{ itemId, templateId, name, rarity }` | Kiste geöffnet, Item granted | Toast/Popup "Item erhalten" |
| `match:started` | `{ matchId }` | Match-Scene geladen | HUD einblenden |
| `match:ended` | `{ matchId, enemiesKilled, chestsOpened }` | Match beendet | Ergebnis-Screen, API-Call `POST /match/result` |
| `skill:cooldown` | `{ skillId, readyAt }` | Skill verwendet | Cooldown-Overlay auf Skill-Slot |
| `skill:used` | `{ skillId }` | Skill ausgelöst | VFX-Trigger, Sound |
| `chest:opened` | `{ chestId }` | Kiste geöffnet | Kiste aus Liste entfernen |

---

## 4. Events: React → Phaser

| Event | Payload | Wann | Phaser macht |
|-------|---------|------|-------------|
| `match:start` | `{ heroClass, level, equippedStats }` | Spieler klickt "Abenteuer starten" | MatchScene starten, Spieler-Sprite mit Stats |
| `match:exit` | `{}` | Spieler klickt "Verlassen" | Scene stoppen, zurück zu Hub/Inventar |
| `loadout:update` | `{ equippedStats }` | Spieler rüstet Item aus/ab | Stats im laufenden Match aktualisieren |
| `pause` | `{}` | Spieler pausiert (ESC) | Spiel pausieren, Overlay |
| `resume` | `{}` | Spieler resumed | Spiel fortsetzen |

---

## 5. Verwendung

### React-Seite

```tsx
import { gameBridge } from "@kleeblatt/shared";

function HUD() {
  const [hp, setHp] = useState({ current: 120, max: 120 });

  useEffect(() => {
    const onHp = (data: { current: number; max: number }) => setHp(data);
    gameBridge.on("player:hp", onHp);
    return () => gameBridge.off("player:hp", onHp);
  }, []);

  return <HpBar current={hp.current} max={hp.max} />;
}

function startMatch(heroClass: string, level: number, stats: Record<string, number>) {
  gameBridge.emit("match:start", { heroClass, level, equippedStats: stats });
}
```

### Phaser-Seite

```typescript
import { gameBridge } from "@kleeblatt/shared";

class MatchScene extends Phaser.Scene {
  create() {
    gameBridge.emit("match:started", { matchId: this.matchId });

    gameBridge.on("match:start", ({ heroClass, level, equippedStats }) => {
      this.spawnPlayer(heroClass, level, equippedStats);
    });

    gameBridge.on("match:exit", () => {
      this.scene.stop();
    });
  }

  onPlayerDamage(hp: number, maxHp: number) {
    gameBridge.emit("player:hp", { current: hp, max: maxHp });
  }

  onEnemyDeath(enemy: Enemy) {
    gameBridge.emit("enemy:died", {
      enemyId: enemy.id,
      typeId: enemy.typeId,
      xp: enemy.stats.xp,
      x: enemy.x,
      y: enemy.y,
    });
  }
}
```

---

## 6. Anti-Patterns

| Nicht machen | Stattdessen |
|--------------|-------------|
| API-Calls aus Phaser | React macht API-Calls, sendet Ergebnis via gameBridge |
| Direkte React-State-Mutation aus Phaser | gameBridge.emit, React hört und updated |
| Phaser importiert React-Komponenten | Nie. Nur Events |
| React manipuliert Phaser-Sprites direkt | gameBridge.emit, Phaser hört und updated |
| Komplexe Payloads (>1KB) | Nur IDs und Werte, React lädt Details per API |

---

## 7. Testing

Die Events sind rein typisiert – man kann ohne Phaser testen:

```typescript
import { gameBridge } from "@kleeblatt/shared";

test("player:hp updates HUD", () => {
  const received: number[] = [];
  gameBridge.on("player:hp", ({ current }) => received.push(current));

  gameBridge.emit("player:hp", { current: 50, max: 120 });
  gameBridge.emit("player:hp", { current: 30, max: 120 });

  expect(received).toEqual([50, 30]);
});
```

---

## 8. Ein-Satz-Zusammenfassung

**gameBridge ist ein typisierter Event-Emitter – Phaser sendet Gameplay-Events, React sendet Steuerungs-Events, beide kommunizieren nur darüber, niemals direkt.**
