import React, { useState, useEffect } from 'react';
import { gameBridge } from '../lib/gameBridge';

interface InventoryItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material' | 'quest';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  equipped: boolean;
}

const InventoryScreen: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for inventory updates from the game
    const unsubscribe = gameBridge.on('inventory:update', (data: { items?: InventoryItem[] }) => {
      setInventory(data.items || []);
      setLoading(false);
    });

    // Listen for errors
    const unsubscribeError = gameBridge.on('inventory:error', (err: { message?: string }) => {
      setError(err.message || 'Failed to load inventory');
      setLoading(false);
    });

    // Request initial inventory data
    gameBridge.emit('inventory:request');

    return () => {
      unsubscribe();
      unsubscribeError();
    };
  }, []);

  const handleItemUse = (itemId: string) => {
    gameBridge.emit('inventory:use', { itemId });
  };

  const handleItemEquip = (itemId: string) => {
    gameBridge.emit('inventory:equip', { itemId });
  };

  const handleItemUnequip = (itemId: string) => {
    gameBridge.emit('inventory:unequip', { itemId });
  };

  if (loading) {
    return (
      <div className="inventory-screen">
        <h2>Inventory</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-screen">
        <h2>Inventory</h2>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="inventory-screen">
      <h2>Inventory</h2>
      <div className="inventory-grid">
        {inventory.length === 0 ? (
          <p>No items in inventory</p>
        ) : (
          inventory.map((item) => (
            <div key={item.id} className={`inventory-item ${item.rarity}`}>
              <div className="item-header">
                <h3>{item.name}</h3>
                <span className="item-quantity">x{item.quantity}</span>
              </div>
              <div className="item-actions">
                {item.type !== 'consumable' && (
                  <button 
                    onClick={() => item.equipped ? handleItemUnequip(item.id) : handleItemEquip(item.id)}
                    className="equip-button"
                  >
                    {item.equipped ? 'Unequip' : 'Equip'}
                  </button>
                )}
                {item.type === 'consumable' && (
                  <button 
                    onClick={() => handleItemUse(item.id)}
                    className="use-button"
                  >
                    Use
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InventoryScreen;