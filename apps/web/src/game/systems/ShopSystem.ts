import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';
import Player from '../entities/Player';
import InventorySystem from './InventorySystem';

interface ShopItem {
  id: string;
  price: number;
}

export interface ShopData {
  id: string;
  name: string;
  items: ShopItem[];
}

import waffenschmiedData from '../data/shops/waffenschmied.json' with { type: 'json' };
import haendlerData from '../data/shops/haendler.json' with { type: 'json' };

const ALL_SHOPS: ShopData[] = [
  waffenschmiedData as ShopData,
  haendlerData as ShopData,
];

export default class ShopSystem {
  private scene: Phaser.Scene;
  private inventorySystem: InventorySystem | null = null;
  public currentShop: ShopData | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setInventorySystem(inventorySystem: InventorySystem): void {
    this.inventorySystem = inventorySystem;
  }

  openShop(shopId: string): boolean {
    const shop = ALL_SHOPS.find(s => s.id === shopId);
    if (!shop) return false;

    this.currentShop = shop;

    gameBridge.emit(PhaserEvents.SHOP_OPENED, {
      shopId: shop.id,
      name: shop.name,
      items: shop.items,
    });

    return true;
  }

  buyItem(itemId: string): boolean {
    if (!this.currentShop) return false;

    const shopItem = this.currentShop.items.find(i => i.id === itemId);
    if (!shopItem) return false;

    const player = (this.scene as { player?: Player }).player as Player;
    if (!player) return false;

    if (!player.spendGold(shopItem.price)) return false;
    if (!this.inventorySystem) return false;

    this.inventorySystem.addItem(itemId, 1);

    gameBridge.emit(PhaserEvents.SHOP_ITEM_BOUGHT, {
      shopId: this.currentShop.id,
      itemId,
      price: shopItem.price,
    });

    return true;
  }

  closeShop(): void {
    this.currentShop = null;
  }

  getCurrentShop(): ShopData | null {
    return this.currentShop;
  }
}