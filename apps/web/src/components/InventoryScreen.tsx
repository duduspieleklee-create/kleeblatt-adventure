import React, { useCallback, useEffect, useState } from "react";
import type { InventoryItem } from "@kleeblatt/shared";
import { equipItem, fetchInventory, unequipItem } from "../lib/api";

const InventoryScreen: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchInventory();
    if (result.ok) {
      setInventory(result.data);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const handleItemEquip = async (itemId: string) => {
    setBusyId(itemId);
    const result = await equipItem(itemId);
    if (result.ok) {
      setInventory(result.data.items);
    } else {
      setError(result.message);
    }
    setBusyId(null);
  };

  const handleItemUnequip = async (itemId: string) => {
    setBusyId(itemId);
    const result = await unequipItem(itemId);
    if (result.ok) {
      setInventory(result.data.items);
    } else {
      setError(result.message);
    }
    setBusyId(null);
  };

  if (loading) {
    return (
      <div className="inventory-screen">
        <h2>Inventar</h2>
        <p>Lade Inventar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-screen">
        <h2>Inventar</h2>
        <p className="inventory-error">Fehler: {error}</p>
        <button type="button" onClick={() => void loadInventory()}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="inventory-screen">
      <h2>Inventar</h2>
      <div className="inventory-grid">
        {inventory.length === 0 ? (
          <p>Keine Items im Inventar</p>
        ) : (
          inventory.map((item) => (
            <div key={item.itemId} className={`inventory-item ${item.rarity}`}>
              <div className="item-header">
                <h3>{item.name}</h3>
                {item.equipped && <span className="item-equipped">ausgerüstet</span>}
              </div>
              <div className="item-details">
                {item.slot ? <span>Slot: {item.slot}</span> : <span>Verbrauchsgut</span>}
                {item.stats && Object.keys(item.stats).length > 0 && (
                  <span className="item-stats">{JSON.stringify(item.stats)}</span>
                )}
              </div>
              <div className="item-actions">
                {item.slot && (
                  <button
                    type="button"
                    onClick={() =>
                      item.equipped ? void handleItemUnequip(item.itemId) : void handleItemEquip(item.itemId)
                    }
                    className="equip-button"
                    disabled={busyId === item.itemId}
                  >
                    {item.equipped ? "Ablegen" : "Anlegen"}
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
