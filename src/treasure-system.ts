/**
 * Treasure Distribution System for Kleeblatt Adventure
 * 
 * Implements the treasure distribution on map with loot system as defined in:
 * - docs/architecture/03-item-lifecycle.md
 * - docs/architecture/24-api-contract.md
 * - docs/architecture/21-game-config.md
 * 
 * This module handles:
 * 1. Placing treasure chests on the map
 * 2. Managing chest interactions (opening)
 * 3. Generating loot based on weighted random from game-config.json
 * 4. Handling item states and persistence
 */

import { gameConfig } from './game-config';

// Define types based on game-config.json
interface Chest {
  chestId: string;
  x: number;
  y: number;
  opened: boolean;
}

interface ItemTemplate {
  templateId: string;
  name: string;
  slot: string;
  rarity: string;
  weight: number;
  allowedClasses: string[];
  stats: Record<string, number>;
  mintCandidate?: boolean;
}

interface LootTable {
  chestId: string;
  rolls: number;
  respawnRule: string;
  entries: ItemTemplate[];
  totalWeight: number;
}

// Mock database for tracking opened chests
const openedChests: Set<string> = new Set();

// Mock database for items
const itemsDatabase: Record<string, any> = {};

/**
 * Initialize treasure system by placing chests on the map
 * @returns Array of chest objects placed on the map
 */
export function initializeTreasureSystem(): Chest[] {
  const chests: Chest[] = [];
  
  // Get chest spawn points from game config
  const spawnPoints = gameConfig.match.chestSpawnPoints;
  
  // Place chests at spawn points
  spawnPoints.forEach((point, index) => {
    chests.push({
      chestId: `prototype_chest_${index + 1}`,
      x: point.x,
      y: point.y,
      opened: false
    });
  });
  
  return chests;
}

/**
 * Open a chest and generate loot
 * @param chestId - ID of the chest to open
 * @returns Generated loot item or null if already opened
 */
export async function openChest(chestId: string): Promise<any | null> {
  // Check if chest has already been opened
  if (openedChests.has(chestId)) {
    return null; // Already opened
  }
  
  // Mark chest as opened
  openedChests.add(chestId);
  
  // Get loot table for this chest type
  const lootTable: LootTable = gameConfig.lootTables.prototype_chest;
  
  // Perform weighted random selection
  const selectedEntry = selectWeightedRandom(lootTable.entries);
  
  // Create item instance with unique ID
  const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Copy properties from template
  const item = {
    itemId,
    templateId: selectedEntry.templateId,
    name: selectedEntry.name,
    slot: selectedEntry.slot,
    rarity: selectedEntry.rarity,
    stats: { ...selectedEntry.stats },
    state: 'web2', // Initially in web2 state
    allowedClasses: selectedEntry.allowedClasses
  };
  
  // Store item in database
  itemsDatabase[itemId] = item;
  
  // Return the generated item
  return item;
}

/**
 * Select an item from a list based on weights
 * @param items - Array of items with weights
 * @returns Selected item
 */
function selectWeightedRandom(items: ItemTemplate[]): ItemTemplate {
  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  // Generate random number between 0 and total weight
  let random = Math.random() * totalWeight;
  
  // Find the item that corresponds to the random number
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  
  // Fallback (shouldn't happen with valid weights)
  return items[items.length - 1];
}

/**
 * Get all available chests
 */
export function getAvailableChests(): Chest[] {
  // In a real implementation, this would query a database
  // For now, we'll simulate with our mock data
  return [
    { chestId: 'prototype_chest_1', x: 500, y: 400, opened: false },
    { chestId: 'prototype_chest_2', x: 900, y: 700, opened: false }
  ];
}

/**
 * Get the state of a specific chest
 */
export function getChestState(chestId: string): boolean {
  return openedChests.has(chestId);
}

/**
 * Get all items in the player's inventory
 */
export function getPlayerInventory(userId: string): any[] {
  // In a real implementation, this would query a database
  // For now, we'll return all items we've created
  return Object.values(itemsDatabase);
}

// Export for use in other modules
export { itemsDatabase };

// Example usage:
// const chests = initializeTreasureSystem();
// const loot = await openChest('prototype_chest_1');