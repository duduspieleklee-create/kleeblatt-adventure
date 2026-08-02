# 18 – Enemy AI (MVP)

**Version:** 1.0  
**Stand:** 3. August 2026  
**Status:** Implementierungsleitfaden (Phaser)

---

## 1. Ziel

Gegner-Verhalten für die Abenteuer-Map so umsetzen, dass die drei Klassen (Nah / Fern / Magier) spürbar anders spielen – ohne schwere AI-Library.

**Ansatz:** Finite State Machine (FSM) pro Enemy + datengesteuerte Stats.

Verwandt: [17-mvp-gameplay.md](./17-mvp-gameplay.md) (Klassenfähigkeiten).

---

## 2. Zustandsautomat

```
idle → chase → attack → chase
         ↓
       leash (Spieler / Spawn zu weit)
         ↓
       dead
```

| State | Verhalten |
|-------|----------|
| `idle` | Warten; Aggro-Radius prüfen |
| `chase` | Zum Spieler (oder Prefer-Range) bewegen |
| `attack` | Angriff ausführen, Cooldown setzen |
| `leash` | Zurück zum Spawn; optional HP-Reset |
| `dead` | XP/Loot-Event, Body disable |

Optional später: `hitstun`.

---

## 3. Drei Archetypen

| Typ | ID | Rolle | KI-Besonderheit |
|-----|-----|--------|------------------|
| **Bruiser** | `bruiser` | Langsam, viel HP | Nur Nahkampf, frontal |
| **Runner** | `runner` | Schnell, wenig HP | Hohe Speed, stresst Caster |
| **Spitter** | `spitter` | Fernkampf | Hält Prefer-Range, schießt |

### Warum die drei?

| Spieler-Skill | Sinnvoller Gegner |
|---------------|-------------------|
| Nah: Schildwall / Dash | Bruiser, Runner |
| Fern: Slow / Kiting | Runner, Bruiser |
| Magier: Blink / AoE | Runner (Druck), Gruppen mit Spitter |

---

## 4. Stats-Tabelle (Startwerte, balancebar)

```ts
export type EnemyTypeId = "bruiser" | "runner" | "spitter";

export interface EnemyStats {
  id: EnemyTypeId;
  maxHp: number;
  speed: number;
  detectRange: number;
  attackRange: number;
  preferRangeMin?: number;
  preferRangeMax?: number;
  attackCooldownMs: number;
  damage: number;
  xp: number;
  leashRange: number;
}

export const ENEMY_STATS: Record<EnemyTypeId, EnemyStats> = {
  bruiser: {
    id: "bruiser",
    maxHp: 80,
    speed: 60,
    detectRange: 180,
    attackRange: 36,
    attackCooldownMs: 1200,
    damage: 12,
    xp: 15,
    leashRange: 400,
  },
  runner: {
    id: "runner",
    maxHp: 35,
    speed: 110,
    detectRange: 220,
    attackRange: 28,
    attackCooldownMs: 800,
    damage: 8,
    xp: 12,
    leashRange: 350,
  },
  spitter: {
    id: "spitter",
    maxHp: 45,
    speed: 50,
    detectRange: 240,
    attackRange: 160,
    preferRangeMin: 100,
    preferRangeMax: 180,
    attackCooldownMs: 1500,
    damage: 10,
    xp: 18,
    leashRange: 420,
  },
};
```

Werte liegen in **Data/JSON**, nicht hardcodiert in der State-Logik.

---

## 5. Verhaltensregeln pro State

### idle
- Velocity 0
- Wenn Distanz(Spieler) ≤ `detectRange` → `chase`

### chase
- Wenn Distanz > `detectRange * 1.15` → `idle`
- Wenn Distanz(Spawn) > `leashRange` → `leash`
- **Bruiser/Runner:** auf Spieler zubewegen
- **Spitter:**
  - näher als `preferRangeMin` → weg vom Spieler
  - weiter als `preferRangeMax` → zum Spieler
  - dazwischen → stehen
- Wenn Distanz ≤ `attackRange` und Cooldown fertig → `attack`

### attack
- Velocity 0
- Melee: Schaden nur wenn noch in Range
- Spitter: Event `enemy:shoot` (Projektil spawnt die Scene)
- `attackReadyAt = now + attackCooldownMs`
- Danach zurück zu `chase`

### leash
- Bewegung zum Spawn
- Angekommen: optional HP = maxHp, State `idle`

### dead
- Keine AI mehr; einmalig `enemy:died` mit `{ xp, x, y, typeId }`

---

## 6. Anbindung Spieler-Skills

| Fähigkeit | Effekt auf Enemy |
|-----------|------------------|
| Fern **Slow** | `applySlow(0.4, 2500)` – Speed-Multiplikator |
| Magier **Feuerball-AoE** | Alle Enemies in Radius `takeDamage` |
| Magier **Blink** | Nur Spieler-Position; Chase folgt natürlich |
| Nah **Dash** | Overlap-Schaden auf Dash-Pfad |
| Nah **Schildwall** | Nur Spieler-seitig (Damage-Reduktion) |

---

## 7. Scene-Vertrag (Events)

| Event | Payload | Scene macht |
|-------|---------|-------------|
| `enemy:melee` | `{ damage }` | Spieler-HP reduzieren (nach Block/Schild) |
| `enemy:shoot` | `{ fromX, fromY, toX, toY, damage }` | Projektil spawnen |
| `enemy:died` | `{ xp, x, y, typeId }` | XP, ggf. Loot-Roll |

---

## 8. Implementierungsregeln (Phaser)

1. Ein `Enemy`-Sprite/Physics-Body pro Instanz, FSM in `preUpdate` oder Scene-`update`-Loop.
2. Stats aus Tabelle lesen; Speed beim Bewegen mit optionalem `speedMul` (Slow).
3. **Kein A\*** im MVP – direkte Winkel-Bewegung; Hindernisse später.
4. 5–15 Gegner gleichzeitig; bei Respawn Object Pool erwägen.
5. Single-Player-Abenteuer: KI **client-side**; XP/Loot-Ergebnis nach Session **server-authoritativ** speichern (M5).
6. Realtime-Hub ([15](./15-game-backend-realtime.md)): **keine** diese Combat-KI – nur Presence.

---

## 9. Was bewusst nicht im MVP

- Pathfinding / Navigation Mesh
- Line-of-Sight / Stealth
- Gruppen-Flankieren / Squad-AI
- Adaptive Difficulty
- Server-side Combat-Simulation

---

## 10. Test-Checklist

| Test | Erwartung |
|------|-----------|
| Spieler betritt detectRange | → chase |
| Spieler verlässt Range | → idle |
| Zu weit vom Spawn | → leash, Rückkehr |
| Bruiser in attackRange | Melee + CD |
| Spitter zu nah | Weicht zurück |
| Spitter in Komfortzone | Steht und schießt |
| Slow | Deutlich langsamer |
| Tod | Einmal XP, keine weiteren Angriffe |

---

## 11. Ein-Satz-Zusammenfassung

**Drei datengesteuerte Archetypen (Bruiser, Runner, Spitter) mit idle/chase/attack/leash/dead – Spitter hält Distanz, Runner stresst, Bruiser belohnt Nahkampf; Skills greifen über Slow, AoE und Dash in dieselbe FSM.**

---

## Verwandte Docs

- [17-mvp-gameplay.md](./17-mvp-gameplay.md) – Klassen & Map
- [14-phaser-react-bridge.md](./14-phaser-react-bridge.md) – Match-Events an React
- [16-developer-guide.md](./16-developer-guide.md) – Phase M4
