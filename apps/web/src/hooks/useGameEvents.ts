import { useState, useEffect, useCallback } from 'react';
import { gameBridge } from '../lib/gameBridge';
import { PhaserEvents } from '../game/core/GameEvents';

export function useGameEvent<T = unknown>(event: string, handler: (data: T) => void) {
  useEffect(() => {
    const unsub = gameBridge.on(event, handler as (data?: unknown) => void);
    return unsub;
  }, [event, handler]);
}

export function useGameCommand() {
  return useCallback((command: string, data?: unknown) => {
    gameBridge.emit(command, data);
  }, []);
}

export function usePlayerStats() {
  const [stats, setStats] = useState<Record<string, number>>({});
  useGameEvent(PhaserEvents.PLAYER_STATS_UPDATED, (data: Record<string, number>) => setStats(data));
  return stats;
}

export function useInventory() {
  const [inventory, setInventory] = useState<Record<string, number>>({});
  useGameEvent(PhaserEvents.INVENTORY_UPDATED, (data: Record<string, number>) => setInventory(data));
  return inventory;
}

export function useEquipment() {
  const [equipment, setEquipment] = useState<Record<string, unknown>>({});
  useGameEvent(PhaserEvents.EQUIPMENT_CHANGED, (data: Record<string, unknown>) => setEquipment(data));
  return equipment;
}

export function useActiveQuests() {
  const [quests, setQuests] = useState<unknown[]>([]);
  useGameEvent(PhaserEvents.QUEST_STARTED, (data: unknown) => setQuests(prev => [...prev, data]));
  useGameEvent(PhaserEvents.QUEST_COMPLETED, (data: unknown) => {
    setQuests(prev => prev.filter(q => (q as any)?.id !== (data as any)?.id));
  });
  return quests;
}

export function useCurrentShop() {
  const [shop, setShop] = useState<unknown>(null);
  useGameEvent(PhaserEvents.SHOP_OPENED, (data: unknown) => setShop(data));
  return shop;
}

export function useCurrentDialogue() {
  const [dialogue, setDialogue] = useState<unknown>(null);
  useGameEvent(PhaserEvents.DIALOG_START, (data: unknown) => setDialogue(data));
  return dialogue;
}