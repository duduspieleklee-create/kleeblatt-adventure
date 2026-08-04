import { useState } from 'react';
import { useCurrentShop, useGameCommand } from '../hooks/useGameEvents';
import { ReactCommands } from '../game/core/GameEvents';

function getShopName(shop: unknown): string {
  return (shop as any)?.name || 'Laden';
}

function getShopItems(shop: unknown): any[] {
  const items = (shop as any)?.items;
  if (Array.isArray(items)) return items;
  return [];
}

function getPlayerGold(shop: unknown): number {
  return (shop as any)?.playerGold ?? (shop as any)?.gold ?? 0;
}

function getItemName(item: unknown): string {
  return (item as any)?.name || 'Unbekannt';
}

function getItemPrice(item: unknown): number {
  return (item as any)?.price ?? (item as any)?.cost ?? 0;
}

function getItemIcon(item: unknown): string {
  const type = (item as any)?.type;
  switch (type) {
    case 'weapon': return '⚔';
    case 'armor': return '🛡';
    case 'consumable': return '🧪';
    case 'material': return '📦';
    case 'quest': return '📜';
    default: return '🔮';
  }
}

function getRarityClass(item: unknown): string {
  const rarity = (item as any)?.rarity;
  if (rarity) return `rarity-${rarity}`;
  return '';
}

export function ShopPanel() {
  const shop = useCurrentShop();
  const send = useGameCommand();
  const [boughtId, setBoughtId] = useState<string | null>(null);

  if (!shop) return null;

  const items = getShopItems(shop);
  const gold = getPlayerGold(shop);

  const handleBuy = (item: any) => {
    send(ReactCommands.SHOP_BUY, { shopId: (shop as any)?.id, itemId: item.id });
    setBoughtId(item.id);
    setTimeout(() => setBoughtId(null), 600);
  };

  const handleClose = () => {
    send(ReactCommands.SHOP_CLOSE);
  };

  return (
    <div className="overlay-backdrop">
      <div className="shop-panel overlay-panel">
        <button type="button" className="overlay-close" onClick={handleClose}>✕</button>
        <h2>{getShopName(shop)}</h2>
        <div className="shop-gold">Gold: {gold}</div>
        <div className="shop-items">
          {items.length === 0 ? (
            <p className="shop-empty">Keine Artikel verfügbar</p>
          ) : (
            items.map((item: any) => {
              const canAfford = gold >= getItemPrice(item);
              const isBought = boughtId === item.id;
              return (
                <div
                  key={item.id}
                  className={`shop-item ${getRarityClass(item)}${isBought ? ' shop-item-bought' : ''}`}
                >
                  <span className="shop-item-icon">{getItemIcon(item)}</span>
                  <div className="shop-item-info">
                    <span className="shop-item-name">{getItemName(item)}</span>
                    <span className="shop-item-price">{getItemPrice(item)} Gold</span>
                  </div>
                  <button
                    type="button"
                    className={`btn shop-buy-btn${canAfford ? '' : ' shop-buy-disabled'}`}
                    onClick={() => canAfford && handleBuy(item)}
                    disabled={!canAfford}
                  >
                    Kaufen
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}