import { useState } from 'react';
import { useCurrentShop, useGameCommand } from '../hooks/useGameEvents';
import { ReactCommands } from '../game/core/GameEvents';

interface ShopItemData {
  id: string;
  name?: string;
  price?: number;
  cost?: number;
  type?: string;
  rarity?: string;
}

interface ShopData {
  id?: string;
  name?: string;
  items?: ShopItemData[];
  playerGold?: number;
  gold?: number;
}

function getShopName(shop: ShopData): string {
  return shop.name || 'Laden';
}

function getShopItems(shop: ShopData): ShopItemData[] {
  if (Array.isArray(shop.items)) return shop.items;
  return [];
}

function getPlayerGold(shop: ShopData): number {
  return shop.playerGold ?? shop.gold ?? 0;
}

function getItemName(item: ShopItemData): string {
  return item.name || 'Unbekannt';
}

function getItemPrice(item: ShopItemData): number {
  return item.price ?? item.cost ?? 0;
}

function getItemIcon(item: ShopItemData): string {
  switch (item.type) {
    case 'weapon': return '⚔';
    case 'armor': return '🛡';
    case 'consumable': return '🧪';
    case 'material': return '📦';
    case 'quest': return '📜';
    default: return '🔮';
  }
}

function getRarityClass(item: ShopItemData): string {
  if (item.rarity) return `rarity-${item.rarity}`;
  return '';
}

export function ShopPanel() {
  const shop = useCurrentShop() as ShopData | null;
  const send = useGameCommand();
  const [boughtId, setBoughtId] = useState<string | null>(null);

  if (!shop) return null;

  const items = getShopItems(shop);
  const gold = getPlayerGold(shop);

  const handleBuy = (item: ShopItemData) => {
    send(ReactCommands.SHOP_BUY, { shopId: shop.id, itemId: item.id });
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
            items.map((item) => {
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