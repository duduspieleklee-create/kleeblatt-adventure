/**
 * Game Data & Core Functions
 * 2D Adventure Game Logic for Kleinanzeigen
 */

export const gameData = {
  score: 0,
  collections: 0,
  player: null,
  treasures: [],
  isPlaying: false,
  startTime: 0,
  selectedCategory: null
};

// Treasure categories matching Kleinanzeigen marketplace
export const TREASURE_CATEGORIES = [
  { id: 1, name: 'Electronics', emoji: '📱', icon: 'laptop' },
  { id: 2, name: 'Cars', emoji: '🚗', icon: 'vehicle' },
  { id: 3, name: 'Pets', emoji: '🐕', icon: 'pet' },
  { id: 4, name: 'Furniture', emoji: '🛋️', icon: 'house' },
  { id: 5, name: 'Music', emoji: '🎸', icon: 'music' },
  { id: 6, name: 'Jobs', emoji: '💼', icon: 'briefcase' },
  { id: 7, name: 'Sport', emoji: '⚽', icon: 'ball' },
  { id: 8, name: 'Fashion', emoji: '👗', icon: 'fashion' },
  { id: 9, name: 'Collectibles', emoji: '⭐', icon: 'star' },
  { id: 10, name: 'Real Estate', emoji: '🏠', icon: 'building' }
];

// Initialize game state
export const initGame = (config = {}) => {
  gameData.score = 0;
  gameData.collections = 0;
  // Spread config with defaults
  gameData.isPlaying = config.isEnabled !== false;
  gameData.treasures = [];
  gameData.startTime = config.startTime || Date.now();
  gameData.selectedCategory = null;
  
  console.log('Game initialized');
};

// Add treasure to collection
export const addTreasure = (categoryId) => {
  // Check if already collected
  const exists = gameData.treasures.find(t => t.categoryId === categoryId);
  if (exists) {
    console.log('Treasure already collected!');
    return false;
  }
  
  // Add to collection
  gameData.treasures.push({
    id: Date.now(),
    categoryId,
    timestamp: Date.now(),
    score: 100
  });
  
  // Update game stats
  gameData.score += 100;
  gameData.collections++;
  
  console.log('Treasure collected:', TREASURE_CATEGORIES.find(c => c.id === categoryId));
  return true;
};

// Update game UI
export const updateUI = () => {
  const ui = document.getElementById('game-ui');
  if (ui) {
    ui.innerHTML = `
      <div class="game-stats">
        <span class="stat-item">Score: ${gameData.score}</span>
        <span class="stat-item">Collected: ${gameData.collections}/10</span>
      </div>
      <div class="game-progress">
        ${gameData.treasures.length} / ${TREASURE_CATEGORIES.length} treasures found!
      </div>
    `;
  }
};

// Check for achievements
export const checkAchievements = (score) => {
  const achievements = [
    { name: 'First Treasure', minScore: 100, unlocked: false },
    { name: 'Treasure Hunter', minScore: 500, unlocked: false },
    { name: 'Master Collector', minScore: 1000, unlocked: false }
  ];
  
  achievements.forEach(ach => {
    if (score >= ach.minScore && !ach.unlocked) {
      gameData.achievements = [...(gameData.achievements || []), ach];
      console.log('🏆 Achievement unlocked:', ach.name);
    }
  });
};

// Get progress percentage
export const getProgress = () => {
  return (gameData.collections / TREASURE_CATEGORIES.length) * 100;
};

// Reset game state
export const resetGame = () => {
  gameData.score = 0;
  gameData.collections = 0;
  gameData.treasures = [];
  gameData.isPlaying = true;
};
