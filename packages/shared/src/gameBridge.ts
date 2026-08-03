/**
 * gameBridge – einzige Kommunikationsschicht zwischen React (Meta-UI, HUD)
 * und Phaser (Gameplay, Rendering, Input).
 *
 * Vertrag: docs/architecture/14-phaser-react-bridge.md (v1.1)
 *
 * Regeln:
 * - Phaser ruft niemals direkt API-Calls auf.
 * - React steuert niemals direkt Phaser-Sprites.
 * - Beide kommunizieren ausschließlich über typisierte Events.
 */

/** Event-Payloads der gameBridge (Phaser → React und React → Phaser). */
export type GameBridgeEvents = {
  // ── Phaser → React ────────────────────────────────────────────────
  /** Spieler nimmt Schaden / heilt. */
  "player:hp": { current: number; max: number };
  /** Mana/Stamina ändert sich. */
  "player:resource": { current: number; max: number; type: "mana" | "stamina" };
  /** Nach XP-Gain / Level-Up. */
  "player:level": { level: number; xp: number; xpToNext: number };
  /** HP ≤ 0 → Death-Overlay, Respawn-Timer. */
  "player:death": Record<string, never>;
  /** Nach Respawn-Delay. */
  "player:respawn": { hp: number };
  /** Enemy stirbt → XP-Animation, Loot-Hinweis. */
  "enemy:died": { enemyId: string; typeId: string; xp: number; x: number; y: number };
  /** Enemy nimmt Schaden → Enemy-HP-Bar. */
  "enemy:damaged": { enemyId: string; hp: number; maxHp: number };
  /** Kiste geöffnet, Item granted → Toast "Item erhalten". */
  "loot:received": { itemId: string; templateId: string; name: string; rarity: string };
  /** Match-Scene geladen → HUD einblenden. */
  "match:started": { matchId: string };
  /** Match beendet → Ergebnis-Screen, API-Call POST /match/result. */
  "match:ended": { matchId: string; enemiesKilled: number; chestsOpened: number };
  /** Skill verwendet → Cooldown-Overlay auf Skill-Slot. */
  "skill:cooldown": { skillId: string; readyAt: number };
  /** Skill ausgelöst → VFX-Trigger, Sound. */
  "skill:used": { skillId: string };
  /** Kiste geöffnet → Kiste aus Liste entfernen. */
  "chest:opened": { chestId: string };

  // ── React → Phaser ────────────────────────────────────────────────
  /** Spieler klickt "Abenteuer starten" → MatchScene starten. */
  "match:start": {
    heroClass: string;
    level: number;
    equippedStats: Record<string, number>;
  };
  /** Spieler klickt "Verlassen" → Scene stoppen. */
  "match:exit": Record<string, never>;
  /** Spieler rüstet Item aus/ab → Stats im laufenden Match aktualisieren. */
  "loadout:update": { equippedStats: Record<string, number> };
  /** Spieler pausiert (ESC). */
  pause: Record<string, never>;
  /** Spieler resumed. */
  resume: Record<string, never>;
};

type Handler<T> = (payload: T) => void;

/**
 * Minimaler typisierter Event-Emitter (mitt-kompatible API: on/off/emit).
 * Bewusst dependency-frei – der Vertrag lässt „mitt oder eigener" zu.
 */
export class TypedEmitter<Events extends Record<string, unknown>> {
  private handlers = new Map<keyof Events, Set<Handler<unknown>>>();

  /** Registriert einen Handler für ein Event. */
  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): void {
    const set = this.handlers.get(type) ?? new Set<Handler<unknown>>();
    set.add(handler as Handler<unknown>);
    this.handlers.set(type, set);
  }

  /** Entfernt einen Handler für ein Event. */
  off<K extends keyof Events>(type: K, handler: Handler<Events[K]>): void {
    this.handlers.get(type)?.delete(handler as Handler<unknown>);
  }

  /** Emittiert ein Event an alle registrierten Handler. */
  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    for (const handler of this.handlers.get(type) ?? []) {
      handler(payload);
    }
  }
}

/** Singleton – die eine gameBridge für React ↔ Phaser. */
export const gameBridge = new TypedEmitter<GameBridgeEvents>();
