/**
 * Kleinanzeigen Adventure - 2D Browser Game for Gala Playworks
 * Simple player movement and treasure collection game
 */

class KleeblattAdventure {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 800;
    this.height = 600;
    this.player = { x: this.width / 2, y: this.height / 2, size: 20, color: '#4ade80' };
    this.treasures = [];
    this.keys = {};
    this.score = 0;
    this.isPlaying = false;
    this.puts = [];
  }

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    this.setupInput();

    // Initialize game state
    this.resetGame();

    // Start game loop
    this.isPlaying = true;
    this.gameLoop();

    console.log('Kleinanzeigen Adventure started!');
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    // Mobile touch controls
    let touchStartX = window.innerWidth / 2;
    let touchStartY = window.innerHeight / 2;

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX;
      const deltaY = touchY - touchStartY;

      if (deltaX > 10 && this.player.x < this.width - 50) {
        this.player.x += 3;
      } else if (deltaX < -10 && this.player.x > 50) {
        this.player.x -= 3;
      }

      touchStartX = touchX;
      touchStartY = touchY;
    }, { passive: false });
  }

  gameLoop() {
    if (!this.isPlaying) return;

    this.update();
    this.draw();

    this.pagery();

    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    const speed = 5;

    if (this.keys['ArrowLeft'] || this.keys['a']) {
      this.player.x -= speed;
    }
    if (this.keys['ArrowRight'] || this.keys['d']) {
      this.player.x += speed;
    }
    if (this.keys['ArrowUp'] || this.keys['w']) {
      this.player.y -= speed;
    }
    if (this.keys['ArrowDown'] || this.keys['s']) {
      this.player.y += speed;
    }

    // Boundary checks
    this.player.x = Math.max(20, Math.min(this.width - 20, this.player.x));
    this.player.y = Math.max(20, Math.min(this.height - 20, this.player.y));

    // Generate random treasure occasionally
    if (Math.random() < 0.005 && this.treasures.length < 20) {
      this.spawnTreasure();
    }

    // Check treasure collection
    this.checkTreasureCollection();
  }

  spawnTreasure() {
    const x = 50 + Math.random() * (this.width - 100);
    const y = 50 + Math.random() * (this.height - 100);
    const distance = Math.sqrt(
      Math.pow(x - this.player.x, 2) +
      Math.pow(y - this.player.y, 2)
    );

    if (distance > 150) {
      this.treasures.push({
        x,
        y,
        size: 15,
        collected: false
      });
    }
  }

  checkTreasureCollection() {
    this.treasures
      .map((t) => {
        const distance = Math.sqrt(
          Math.pow(t.x - this.player.x, 2) +
          Math.pow(t.y - this.player.y, 2)
        );
        return { treasure: t, distance };
      })
      .filter((item) => item.distance < 20)
      .forEach((item) => {
        const { treasure } = item;

        if (!treasure.collected) {
          treasure.collected = true;
          this.score += 100;
          console.log('Treasure collected! Score:', this.score);

          // Show collection message
          showCollectionMessage(treasure);
        }
      });

    // Clear collected treasures
    this.treasures = this.treasures.map((t) => ({ ...t, collected: false }));
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw background
    this.drawBackground();

    // Draw treasures
    this.treasures.map((t) => {
      this.drawTreasure(t);
    });

    // Draw player
    this.drawPlayer();

    // Draw UI
    this.drawUI();
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawTreasure(treasure) {
    const radius = 15;
    this.ctx.beginPath();
    this.ctx.arc(treasure.x, treasure.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(treasure.x, treasure.y, radius - 5, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
    this.ctx.fill();

    // Gem decoration
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const starX = treasure.x + Math.cos(angle) * (radius + 5);
      const starY = treasure.y + Math.sin(angle) * (radius + 5);
      this.ctx.beginPath();
      this.ctx.arc(starX, starY, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      this.ctx.fill();
    }
  }

  drawPlayer() {
    // Outer glow
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, 30, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
    this.ctx.fill();

    // Player body
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
    this.ctx.fillStyle = this.player.color;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, this.player.size - 5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();
  }

  drawUI() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 150, 80);

    this.ctx.fillStyle = '#4ade80';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 25, 35);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    const treasureCount = this.treasures.filter((t) => !t.collected).length;
    this.ctx.fillText(`Treasures: ${treasureCount} found`, 25, 55);
  }
}

// Show collection message
function showCollectionMessage(treasure) {
  const message = document.createElement('div');
  message.id = 'collection-message';
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(22, 30, 38, 0.95);
    padding: 20px 40px;
    border-radius: 12px;
    color: #fbbf24;
    font-weight: bold;
    text-align: center;
    border: 2px solid #fbbf24;
    z-index: 1000;
  `;

  const btn = document.createElement('button');
  btn.textContent = 'Continue';
  btn.style.cssText = 'padding: 10px 24px; margin-top: 15px; background: #f6416c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;';
  btn.onclick = () => {
    message.remove();
  };

  message.appendChild(btn);
  document.body.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, 1500);
}

// Initialize game on page load
class Game {
  constructor() {
    window.addEventListener('DOMContentLoaded', () => {
      new KleeblattAdventure();
    });
  }
}

new Game();
