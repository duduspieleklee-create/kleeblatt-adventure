/**
 * Test script for the treasure system implementation
 */

import { initializeTreasureSystem, openChest, getAvailableChests, getChestState, getPlayerInventory } from './src/treasure-system';

console.log('=== Treasure System Test ===\n');

// Test 1: Initialize treasure system
console.log('1. Initializing treasure system...');
const chests = initializeTreasureSystem();
console.log(`   Created ${chests.length} chests`);
chests.forEach(chest => {
  console.log(`   - Chest ${chest.chestId} at (${chest.x}, ${chest.y})`);
});

// Test 2: Get available chests
console.log('\n2. Getting available chests...');
const availableChests = getAvailableChests();
console.log(`   Found ${availableChests.length} available chests`);

// Test 3: Open a chest and get loot
console.log('\n3. Opening first chest...');
try {
  const loot = openChest('prototype_chest_1');
  if (loot) {
    console.log(`   Loot received: ${loot.name} (rarity: ${loot.rarity})`);
    console.log(`   Stats: ${JSON.stringify(loot.stats)}`);
  } else {
    console.log('   Chest already opened or invalid');
  }
} catch (error) {
  console.error('   Error opening chest:', error);
}

// Test 4: Try to open the same chest again
console.log('\n4. Trying to open the same chest again...');
try {
  const loot = openChest('prototype_chest_1');
  if (loot) {
    console.log(`   Loot received: ${loot.name}`);
  } else {
    console.log('   Chest already opened or invalid (as expected)');
  }
} catch (error) {
  console.error('   Error opening chest:', error);
}

// Test 5: Check chest state
console.log('\n5. Checking chest states...');
availableChests.forEach(chest => {
  const isOpened = getChestState(chest.chestId);
  console.log(`   Chest ${chest.chestId}: ${isOpened ? 'Opened' : 'Closed'}`);
});

// Test 6: Get player inventory
console.log('\n6. Checking player inventory...');
const inventory = getPlayerInventory('test-user-id');
console.log(`   Inventory contains ${inventory.length} items:`);
inventory.forEach(item => {
  console.log(`   - ${item.name} (${item.rarity})`);
});

console.log('\n=== Test Complete ===');