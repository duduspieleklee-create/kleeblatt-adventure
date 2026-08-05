/**
 * gameBridge – einzige Kommunikationsschicht zwischen React (Meta-UI, HUD)
 * und Phaser (Gameplay, Rendering, Input).
 *
 * Vertrag: docs/architecture/14-phaser-react-bridge.md (v1.1)
 */

import type { InventoryStacks } from "./types/inventory.js";

/** Loose bag for town/legacy payloads (shape still documented below). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = Record<string, any>;

/**
 * Event-Payloads der gameBridge.
 * Match-Vertrag ist strikt; Town/Legacy bewusst als Loose, bis Systeme vereinheitlicht sind.
 */
export type GameBridgeEvents = {
  // ── Phaser → React (Match / Architektur-Vertrag) ───────────────────
  "player:hp": { current: number; max: number };
  "player:resource": { current: number; max: number; type: "mana" | "stamina" };
  "player:level": { level: number; xp: number; xpToNext: number };
  "player:death": Record<string, never>;
  "player:respawn": { hp: number };
  "enemy:died": { enemyId: string; typeId: string; xp: number; x: number; y: number };
  "enemy:damaged": { enemyId: string; hp: number; maxHp: number };
  "loot:received": { itemId: string; templateId: string; name: string; rarity: string };
  "match:started": { matchId: string };
  "match:ended": { matchId: string; enemiesKilled: number; chestsOpened: number };
  "skill:cooldown": { skillId: string; readyAt: number };
  "skill:used": { skillId: string };
  "chest:opened": { chestId: string };
  "inventory:updated": { stacks: InventoryStacks };

  // ── Phaser → React (Town / Legacy — loose until unified) ───────────
  "player:statsUpdated": Loose;
  "player:hpChanged": Loose;
  "player:xpChanged": Loose;
  "equipment:changed": Loose;
  "combat:hit": Loose;
  "combat:death": Loose;
  "loot:dropped": Loose;
  "quest:started": Loose;
  "quest:progress": Loose;
  "quest:completed": Loose;
  "shop:opened": Loose;
  "shop:itemBought": Loose;
  "dialog:start": Loose;
  "dialog:option": Loose;
  "skill:ready": Loose;
  "npc:stateChanged": Loose;
  "scene:loaded": Loose;
  interaction: Loose;
  "enemy:spawned": Loose;
  "enemy:killed": Loose;

  // ── React → Phaser (Match) ────────────────────────────────────────
  "match:start": {
    heroClass: string;
    level: number;
    equippedStats: Record<string, number>;
  };
  "match:exit": Record<string, never>;
  "loadout:update": { equippedStats: Record<string, number> };
  pause: Record<string, never>;
  resume: Record<string, never>;
  "inventory:hydrate": { stacks: InventoryStacks };

  // ── React → Phaser (Town / Legacy-Commands) ───────────────────────
  "react:useItem": { itemId: string };
  "react:equipItem": { itemId: string };
  "react:unequipItem": { slot: string };
  "react:castSkill": { skillId: string };
  "react:interact": Loose;
  "react:questAccept": { questId: string };
  "react:questDecline": { questId: string };
  "react:shopBuy": { itemId: string };
  "react:shopClose": Record<string, never>;
  "react:dialogOption": { optionId: string };
  "react:dialogClose": Record<string, never>;
};

/**
 * Typed event bus. Handlers accept `any` payload so legacy town code
 * (mixed shapes) typechecks; prefer documented shapes for new code.
 */
export class TypedEmitter<Events extends Record<string, unknown>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers = new Map<keyof Events, Set<(payload: any) => void>>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on<K extends keyof Events>(type: K, handler: (payload: any) => void): void {
    const set = this.handlers.get(type) ?? new Set<(payload: any) => void>();
    set.add(handler);
    this.handlers.set(type, set);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off<K extends keyof Events>(type: K, handler: (payload: any) => void): void {
    this.handlers.get(type)?.delete(handler);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit<K extends keyof Events>(type: K, payload?: any): void {
    for (const handler of this.handlers.get(type) ?? []) {
      handler(payload);
    }
  }
}

/** Singleton – die eine gameBridge für React ↔ Phaser. */
export const gameBridge = new TypedEmitter<GameBridgeEvents>();
