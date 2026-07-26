/**
 * Main Game Entry Point
 * Kleinanzeigen Adventure - 2D Browser Game
 */

// Import game core
import { initGame, getProgress, TREASURE_CATEGORIES } from './core/index.js';

// Game state
class KleeblattAdventure {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 800;
    this.height = 600;
    this.player = { x: 350, y: 300, size: 40, color: '#4ade80' };
    this.treasures = [];
    this.keys = {};
    this.isPlaying = false;
    this.celebrationComplete = false;
  }

  init() {
    // Setup canvas
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    // Setup input handling
    this.setupInput();

    // Initialize game
    initGame();

    // Start game loop
    this.isPlaying = true;
    this.gameLoop();

    console.log('Kleinanzeigen Adventure started');
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    // Mobile touch controls
    let touch startX = 0;
    let touchStartY = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      const deltaX = touchX - touchStartX;
      const deltaY = touchY - touchStartY;

      // Only move if gesture is horizontal
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        if (deltaX > 0 && this.player.x < 750) {
          this.player.x += 5;
        } else if (deltaX < 0 && this.player.x > 10) {
          this.player.x -= 5;
        }
        touchStartX = touchX;
      }

      // Only move if gesture is vertical
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        if (deltaY > 0 && this.player.y < 580) {
          this.player.y += 5;
        } else if (deltaY < 0 && this.player.y > 20) {
          this.player.y -= 5;
        }
        touchStartY = touchY;
      }
    }, { passive: false });
  }

  gameLoop() {
    if (!this.isPlaying) return;

    this.update();
    this.draw();

    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Player movement with WASD/Arrows
    const speed = 5;

    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.player.x -= speed;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.player.x += speed;
    }
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      this.player.y -= speed;
    }
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
      this.player.y += speed;
    }

    // Generate random treasures occasionally
    if (Math.random() < 0.005 && this.treasures.length < 15) {
      this.spawnTreasure();
    }

    // Check treasure collection
    this.checkTreasureCollection();
  }

  spawnTreasure() {
    const categoryId = Math.floor(Math.random() * TREASURE_CATEGORIES.length) + 1;

    // Random position within canvas
    const x = 50 + Math.random() * (this.width - 100);
    const y = 50 + Math.random() * (this.height - 100);

    // Check if position is too close to player
    const distance = this.getDistance(this.player.x, this.player.y, x, y);

    if (distance > 100) {
      this.treasures.push({
        x,
        y,
        categoryId,
        category: TREASURE_CATEGORIES.find(c => c.id === categoryId),
        collectionRange: 80
      });
    }
  }

  checkTreasureCollection() {
    // Check if we've found at least 5 unique categories
    const uniqueCategories = new Set(this.treasures.map(t => t.categoryId));

    if (uniqueCategories.size >= 5) {
      // Celebrate!
      console.log('Congratulations! You found treasures from multiple categories!');

      if (!this.celebrationComplete) {
        this.celebrate();
        this.celebrationComplete = true;
      }
      return;
    }
  }

  celebrate() {
    // Show celebration popup
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.innerHTML = `
      <h1>Contributor Found! Contributor ID: ${Math.random().toString(36).substring(7)}</h1>
      <p class="contributor-id">Zeroth to find treasures!</p>
      <p class="category-count">Current found: ${this.treasures.length} / 10 treasures found from different categories</p>
      <button class="continue-btn">Continue</button>
    `;
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(22, 30, 38, 0.95);
      padding: 30px;
      border-radius: 12px;
      color: white;
      text-align: center;
      border: 2px solid #fbbf24;
      z-index: 1000;
      min-width: 300px;
    `;

    const continueBtn = dialog.querySelector('.continue-btn');
    continueBtn.style.cssText = 'padding: 12px 24px; margin-top: 20px; background: #f6416c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;';
    continueBtn.addEventListener('click', () => {
      dialog.remove();
    });

    document.body.appendChild(dialog);
  }

  getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw game background (gradient)
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw border
    this.ctx.strokeStyle = '#0f3460';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(2, 2, this.width - 4, this.height - 4);

    // Draw player (green circle)
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = this.player.color;
    this.ctx.fill();
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw every treasure
    this.treasures.forEach((treasure) => {
      this.drawTreasure(treasure);
    });

    // Draw UI overlay text
    this.drawUI();
  }

  drawTreasure(treasure) {
    const treasureY = treasure.y;
    const radius = 25;

    // Draw treasure circle with distance-based highlight
    const distance = this.getDistance(this.player.x, this.player.y, treasure.x, treasureY);
    this.ctx.beginPath();
    this.ctx.arc(treasure.x, treasureY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = distance <= 80 ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.1)';
    this.ctx.fill();

    // Draw underscore border
    this.ctx.strokeStyle = 'gold';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw stars/gems around century
    const stars = 5;
    for (let i = 0; i < stars; i++) {
      const angle = (i / stars) * Math.PI * 2;
      const starX = treasure.x + Math.cos(angle) * (radius + 5);
      const starY = treasureY + Math.sin(angle) * (radius + 5);
      this.ctx.beginPath();
      this.ctx.arc(starX, starY, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = 'gold';
      this.ctx.fill();
    }
  }

  drawUI() {
    const overlay = this.createUIOverlay();
    if (overlay) {
      document.body.appendChild(overlay);
    }
  }

  createUIOverlay() {
    try {
      return document.createElement('div');
    } catch (e) {
      console.log('UI overlay created');
      return null;
    }
  }

  resetGame() {
    document.body.innerHTML = '';
    this.init();
  }
}

// Auto-start game on page load
const game = new KleeblattAdventure();
window.addEventListener('DOMContentLoaded', () => {
  game.init();
});

export default game;
