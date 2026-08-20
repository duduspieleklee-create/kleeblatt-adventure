import { useState } from "react";
import { HERO_CLASS_OPTIONS, type Hero, type InventoryItem } from "@kleeblatt/shared";
import { equipItem, unequipItem } from "../lib/api";
import { getToolIcon } from "../lib/gameStats";

interface HeroDashboardCardProps {
  hero: Hero;
  inventory: InventoryItem[];
  onChange: () => void;
}

const SLOT_LABELS: Record<string, string> = {
  weapon: "Waffe",
  chest: "Rüstung",
  head: "Kopf",
  legs: "Beine",
  accessory: "Accessoire",
};

export function HeroDashboardCard({ hero, inventory, onChange }: HeroDashboardCardProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const classInfo = HERO_CLASS_OPTIONS.find((c) => c.id === hero.class);
  const equippedIds = new Set(Object.values(hero.equipped ?? {}));

  async function handleEquip(itemId: string) {
    setBusyId(itemId);
    setError(null);
    const result = await equipItem(itemId);
    setBusyId(null);
    if (result.ok) {
      onChange();
    } else {
      setError(result.message);
    }
  }

  async function handleUnequip(itemId: string) {
    setBusyId(itemId);
    setError(null);
    const result = await unequipItem(itemId);
    setBusyId(null);
    if (result.ok) {
      onChange();
    } else {
      setError(result.message);
    }
  }

  return (
    <section className="card">
      <h2>
        {hero.heroName} <span className="badge">{classInfo?.label ?? hero.class}</span>
      </h2>
      <p className="tag">
        Level {hero.level} · {hero.xp} XP
      </p>

      <div className="equipped">
        <h3>Angelegt</h3>
        {Object.entries(hero.equipped ?? {}).length === 0 ? (
          <p className="muted">Nichts angelegt – lege dein Starter-Gear an!</p>
        ) : (
          <ul>
            {Object.entries(hero.equipped ?? {}).map(([slot, itemId]) => {
              const item = inventory.find((i) => i.itemId === itemId);
              return (
                <li key={slot}>
                  {SLOT_LABELS[slot] ?? slot}: <strong>{item?.name ?? "?"}</strong>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="inventory">
        <h3>Inventar ({inventory.length})</h3>
        {error && <p className="error">{error}</p>}
        {inventory.length === 0 ? (
          <p className="muted">Dein Inventar ist leer.</p>
        ) : (
          <ul className="item-list">
            {inventory.map((item) => (
              <li key={item.itemId} className={`item${item.equipped ? " equipped" : ""}`}>
                <div>
                  <strong>
                    <img src={getToolIcon(item.templateId)} alt="" className="item-icon" />
                    {item.name}
                  </strong>
                  <span className="muted">
                    {item.slot ? (SLOT_LABELS[item.slot] ?? item.slot) : "?"} · {item.rarity}
                    {item.stats && Object.keys(item.stats).length > 0
                      ? ` · ${Object.entries(item.stats)
                          .map(([k, v]) => `+${v} ${k}`)
                          .join(", ")}`
                      : ""}
                  </span>
                  {item.description && <span className="muted"> — {item.description}</span>}
                </div>
                <button
                  type="button"
                  disabled={busyId === item.itemId}
                  onClick={() =>
                    void (item.equipped ? handleUnequip(item.itemId) : handleEquip(item.itemId))
                  }
                >
                  {busyId === item.itemId ? "…" : item.equipped ? "Ablegen" : "Anlegen"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {equippedIds.size === 0 && inventory.length > 0 && (
          <p className="muted hint">Tipp: Starter-Gear anlegen, um stärker zu werden.</p>
        )}
      </div>
    </section>
  );
}
