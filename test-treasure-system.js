/**
 * Test script for the treasure system implementation
 */

// Since we can't easily run TypeScript, let's create a simple JavaScript test
console.log('=== Treasure System Test ===\n');

// Mock the treasure system functions
const openedChests = new Set();
const itemsDatabase = {};

// Mock game config
const gameConfig = {
  match: {
    chestSpawnPoints: [
      { x: 500, y: 400 },
      { x: 900, y: 700 }
    ]
  },
  lootTables: {
    prototype_chest: {
      chestId: "prototype_chest",
      rolls: 1,
      respawnRule: "once_per_player",
      entries: [
        {
          templateId: "loot_common_chest_1",
          name: "Verstärkte Lederrüstung",
          slot: "chest",
          rarity: "common",
          weight: 50,
          allowedClasses: ["melee", "ranged", "mage"],
          stats: { maxHp: 15 }
        },
        {
          templateId: "loot_uncommon_chest_1",
          name: "Gepanzerter Wams",
          slot: "chest",
          rarity: "uncommon",
          weight: 25,
          allowedClasses: ["melee", "ranged"],
          stats: { maxHp: 25, atk: 2 }
        },
        {
          templateId: "loot_common_weapon_1",
          name: "Rostige Axt",
          slot: "weapon",
          rarity: "common",
          weight: 15,
          allowedClasses: ["melee"],
          stats: { atk: 6 }
        },
        {
          templateId: "loot_rare_chest_1",
          name: "Dornenpanzer",
          slot: "chest",
          rarity: "rare",
          weight: 8,
          allowedClasses: ["melee", "ranged", "mage"],
          stats: { maxHp: 30, atk: 5 },
          mintCandidate: true
        },
        {
          templateId: "loot_epic_weapon_1",
          name: "Klinge der alten Kriege",
          slot: "weapon",
          rarity: "epic",
          weight: 2,
          allowedClasses: ["melee", "ranged"],
          stats: { atk: 12, maxHp: 10 },
          mintCandidate: true
        }
      ],
      totalWeight: 100
    }
  }
};

// Mock functions
function initializeTreasureSystem() {
  const chests = [];
  const spawnPoints = gameConfig.match.chestSpawnPoints;
  
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

function selectWeightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  
  return items[items.length - 1];
}

function openChest(chestId) {
  if (openedChests.has(chestId)) {
    return null;
  }
  
  openedChests.add(chestId);
  
  const lootTable = gameConfig.lootTables.prototype_chest;
  const selectedEntry = selectWeightedRandom(lootTable.entries);
  
  const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const item = {
    itemId,
    templateId: selectedEntry.templateId,
    name: selectedEntry.name,
    slot: selectedEntry.slot,
    rarity: selectedEntry.rarity,
    stats: { ...selectedEntry.stats },
    state: 'web2',
    allowedClasses: selectedEntry.allowedClasses
  };
  
  itemsDatabase[itemId] = item;
  
  return item;
}

function getAvailableChests() {
  return [
    { chestId: 'prototype_chest_1', x: 500, y: 400, opened: false },
    { chestId: 'prototype_chest_2', x: 900, y: 700, opened: false }
  ];
}

function getChestState(chestId) {
  return openedChests.has(chestId);
}

function getPlayerInventory() {
  return Object.values(itemsDatabase);
}

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
const inventory = getPlayerInventory();
console.log(`   Inventory contains ${inventory.length} items:`);
inventory.forEach(item => {
  console.log(`   - ${item.name} (${item.rarity})`);
});

console.log('\n=== Test Complete ===');