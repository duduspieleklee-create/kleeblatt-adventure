import React, { useState, useEffect, useMemo } from 'react';
import { gameBridge } from '../lib/gameBridge';
import { PhaserEvents, ReactCommands } from '../game/core/GameEvents';
import itemsData from '../game/data/items.json' with { type: 'json' };

interface ItemDef {
  id: string;
  label: string;
  type: string;
  stackable: boolean;
  maxStack: number;
  effect?: string;
}

type ItemsData = ItemDef[];

const ITEM_ICONS: Record<string, string> = {
  holz: '🪵',
  stein: '🪨',
  heiltrank: '❤️',
  manatrank: '💙',
  stamina_trank: '💚',
  eisen_erz: '⛏️',
  gold_erz: '✨',
  leder: '🧶',
  knochen: '🦴',
  trauertaler: '🪙',
};

const InventoryScreen: React.FC = () => {
  const [slots, setSlots] = useState<Record<string, number>>({});
  const [gold, setGold] = useState(0);

  const itemDefs = useMemo<Record<string, ItemDef>>(
    () => Object.fromEntries((itemsData as ItemsData).map(i => [i.id, i])),
    [],
  );

  useEffect(() => {
    const onInventory = (data: { [key: string]: number }) => {
      setSlots(data);
    };
    const onStats = (data: { gold?: number }) => {
      const g = data?.gold;
      if (g !== undefined) setGold(g);
    };
    const onLoot = (data: { item: string; amount: number; gold?: number }) => {
      const g = data?.gold;
      if (g) setGold(prev => prev + g);
    };

    gameBridge.on(PhaserEvents.INVENTORY_UPDATED, onInventory);
    gameBridge.on(PhaserEvents.PLAYER_STATS_UPDATED, onStats);
    gameBridge.on(PhaserEvents.LOOT_DROPPED, onLoot);
  }, []);

  const handleUse = (itemId: string) => {
    gameBridge.emit(ReactCommands.USE_ITEM, { itemId });
  };

  const handleEquip = (itemId: string) => {
    gameBridge.emit(ReactCommands.EQUIP_ITEM, { itemId });
  };

  const entries = Object.entries(slots).filter(([, qty]) => qty > 0);

  return (
    <div className="inventory-screen" style={{
      background: 'rgba(10, 18, 10, 0.95)',
      border: '2px solid #3a5a2a',
      borderRadius: 8,
      padding: 16,
      color: '#e8f0e8',
      fontFamily: 'system-ui, sans-serif',
      maxHeight: '70vh',
      overflow: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'spaceBetween', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#8fa88f' }}>Inventar</h2>
        <span style={{ fontSize: 14, color: '#fbbf24' }}>💰 {gold} Gold</span>
      </div>

      {entries.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>Inventar leer</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8,
        }}>
          {entries.map(([itemId, qty]) => {
            const def = itemDefs[itemId];
            if (!def) return null;
            const icon = ITEM_ICONS[itemId] || '📦';
            return (
              <div key={itemId} style={{
                background: 'rgba(30, 50, 30, 0.8)',
                border: '1px solid #3a5a2a',
                borderRadius: 6,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{def.label}</span>
                  {qty > 1 && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      color: '#8fa88f',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}>
                      x{qty}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 10, color: '#666', textTransform: 'capitalize' }}>{def.type}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {def.type === 'consumable' && (
                    <button onClick={() => handleUse(itemId)} style={{
                      flex: 1,
                      padding: '4px 0',
                      fontSize: 11,
                      background: '#3a5a2a',
                      color: '#e8f0e8',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}>
                      Benutzen
                    </button>
                  )}
                  {(def.type === 'equipment' || def.type === 'material') && (
                    <button onClick={() => handleEquip(itemId)} style={{
                      flex: 1,
                      padding: '4px 0',
                      fontSize: 11,
                      background: '#2a3a4a',
                      color: '#e8f0e8',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}>
                      Ausrüsten
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InventoryScreen;