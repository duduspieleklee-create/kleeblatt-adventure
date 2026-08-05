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

import type { InventoryStacks } from "./types/inventory.js";

/** Event-Payloads der gameBridge (Phaser → React und React → Phaser). */
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
  /** Stack-Bag geändert → debounced Persist + Inventar-UI. */
  "inventory:updated": { stacks: InventoryStacks };

  // ── Phaser → React (Town / Legacy-Systeme) ─────────────────────────
  "player:statsUpdated": Record<string, number> & {
    gold?: number;
    hp?: number;
    maxHp?: number;
    mana?: number;
    maxMana?: number;
    stamina?: number;
    maxStamina?: number;
    level?: number;
    xp?: number;
  };
  "player:hpChanged": { current: number; max: number };
  "player:xpChanged": { xp: number; level?: number; xpToNext?: number };
  "equipment:changed": {
    slot?: string;
    itemId?: string | null;
    equipped?: Record<string, string | null>;
  };
  "combat:hit": {
    attackerId: string;
    targetId: string;
    damage: number;
    skill?: unknown;
  };
  "combat:death": { targetId: string };
  "loot:dropped": {
    enemyId?: string;
    items?: unknown;
    gold?: number;
    item?: string;
    amount?: number;
  };
  "quest:started": { questId: string; title?: string };
  "quest:progress": { questId: string; progress?: number; target?: number };
  "quest:completed": { questId: string };
  "shop:opened": { shopId: string };
  "shop:itemBought": { itemId: string; price?: number };
  "dialog:start": { npcId: string; lineId?: string };
  "dialog:option": { optionId: string };
  "skill:ready": { skillId: string };
  "npc:stateChanged": { npcId: string; state?: string };
  "scene:loaded": { scene: string };
  interaction: { target: string };
  "enemy:spawned": { enemyId: string; x?: number; y?: number };
  "enemy:killed": { enemyId: string };

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
  "react:interact": Record<string, never> | { targetId?: string };
  "react:questAccept": { questId: string };
  "react:questDecline": { questId: string };
  "react:shopBuy": { itemId: string };
  "react:shopClose": Record<string, never>;
  "react:dialogOption": { optionId: string };
  "react:dialogClose": Record<string, never>;
};

type Handler<T> = (payload: T) => void;

/**
 * Minimaler typisierter Event-Emitter (mitt-kompatible API: on/off/emit).
 * Bewusst dependency-frei – der Vertrag lässt „mitt oder eigener" zu.
 */
export class TypedEmitter<Events extends Record<string, unknown>> {
  private handlers = new Map<keyof Events, Set<Handler<unknown>>>();

  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): void {
    const set = this.handlers.get(type) ?? new Set<Handler<unknown>>();
    set.add(handler as Handler<unknown>);
    this.handlers.set(type, set);
  }

  off<K extends keyof Events>(type: K, handler: Handler<Events[K]>): void {
    this.handlers.get(type)?.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    for (const handler of this.handlers.get(type) ?? []) {
      handler(payload);
    }
  }
}

/** Singleton – die eine gameBridge für React ↔ Phaser. */
export const gameBridge = new TypedEmitter<GameBridgeEvents>();
