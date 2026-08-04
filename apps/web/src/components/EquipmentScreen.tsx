import { useEquipment, useGameCommand } from '../hooks/useGameEvents';
import { ReactCommands } from '../game/core/GameEvents';

const SLOTS = [
  { key: 'weapon', label: 'Waffe' },
  { key: 'head', label: 'Kopf' },
  { key: 'chest', label: 'Brust' },
  { key: 'legs', label: 'Beine' },
  { key: 'ring', label: 'Ring' },
  { key: 'amulet', label: 'Amulett' },
  { key: 'offhand', label: 'Offhand' },
];

const SLOT_ICONS: Record<string, string> = {
  weapon: '⚔',
  head: '🛡',
  chest: '👕',
  legs: '👖',
  ring: '💍',
  amulet: '📿',
  offhand: '✋',
};

interface EquipmentItemData {
  id?: string;
  name?: string;
  rarity?: string;
}

function getItemName(item: EquipmentItemData | null | undefined): string {
  if (!item) return '';
  return item.name || item.id || 'Unbekannt';
}

function getRarityClass(item: EquipmentItemData | null | undefined): string {
  if (!item) return '';
  if (item.rarity) return `rarity-${item.rarity}`;
  return '';
}

export function EquipmentScreen() {
  const equipment = useEquipment();
  const send = useGameCommand();

  const handleUnequip = (slot: string) => {
    send(ReactCommands.UNEQUIP_ITEM, { slot });
  };

  return (
    <div className="equipment-screen card">
      <h2>Ausrüstung</h2>
      <div className="equipment-grid">
        {SLOTS.map(({ key, label }) => {
          const item = equipment[key] as EquipmentItemData | null | undefined;
          const equipped = !!item;
          return (
            <button
              key={key}
              type="button"
              className={`equipment-slot${equipped ? ` equipped ${getRarityClass(item)}` : ' empty'}`}
              onClick={() => equipped && handleUnequip(key)}
              disabled={!equipped}
              title={equipped ? `${label}: ${getItemName(item)}` : `${label}: leer`}
            >
              <span className="equipment-slot-icon">{SLOT_ICONS[key]}</span>
              <span className="equipment-slot-label">{equipped ? getItemName(item) : label}</span>
              <span className="equipment-slot-hint">{equipped ? 'Klicken zum Ausrüsten' : 'Leer'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}