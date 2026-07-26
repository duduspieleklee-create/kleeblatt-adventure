/* Kleinanzeigen Adventure - v2.0 Race Game */

class KleinanzeigenRace {
    constructor() {
        this.score = 0;
        this.highScore = 0;
        this.playerX = 400;
        this.playerY = 500;
        this.speed = 5;
    }

    init() {
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        this.clock();
        this.render();
        this.update();
        return this;
    }

    clock() {
        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' + 
                       String(now.getMinutes()).padStart(2, '0') + ':' + 
                       String(now.getSeconds()).padStart(2, '0');
        document.getElementById('clock-text')?.textContent = timeStr;
        this.interval = setInterval(() => this.clock(), 1000);
    }

    update() {
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.playerX = Math.max(0, this.playerX - this.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.playerX = Math.min(800, this.playerX + this.speed);
        }
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.playerY = Math.max(0, this.playerY - this.speed);
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.playerY = Math.min(600, this.playerY + this.speed);
        }
        
        // Collection detection
        this.items.forEach(item => {
            const dist = Math.sqrt(Math.pow(item.x - this.playerX, 2) + Math.pow(item.y - this.playerY, 2));
            if (dist < 20 && item.active) {
                item.active = false;
                this.score += 100;
                showPop(this.playerX, this.playerY - 20, '+100');
                this.render();
            }
        });
        
        // Spawn new item
        if (Math.random() < 0.02 && this.items.length < 5) {
            this.items.push({ 
                x: 100 + Math.random() * 600, 
                y: 50 + Math.random() * 300, 
                active: true 
            });
        }
        
        this.highScore = Math.max(this.score, this.highScore);
        localStorage.setItem('kleinanzeigen-highscore', JSON.stringify({
            score: this.score,
            high: this.highScore
        }));
    }

    render() {
        ctx.clearRect(0, 0, 800, 600);
        document.getElementById('game-canvas').getContext('2d').clearRect(0, 0, 800, 600);
        
        const can = document.getElementById('game-canvas');
        const ctx = can.getContext('2d');
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Score UI
        ctx.fillStyle = '#f6416c';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Score: ${this.score}`, 20, 40);
        
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`High: ${this.highScore}`, 120, 40);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';
        ctx.fillText(new Date().toLocaleTimeString(), 250, 40);
        
        // Player (green circle)
        ctx.beginPath();
        ctx.arc(this.playerX, this.playerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(74, 222, 128, 0.8)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.playerX, this.playerY, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Items (glowing gems)
        this.items.forEach(item => {
            if (!item.active) return;
            ctx.beginPath();
            ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(item.x, item.y, 7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
            ctx.fill();
            // Sparkle
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const sx = item.x + Math.cos(angle) * 16;
                const sy = item.y + Math.sin(angle) * 16;
                ctx.beginPath();
                ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
                ctx.fill();
            }
        });
        
        // Instructions
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.fillText('Use Arrow Keys/WASD to collect gems! Score: +100', 20, 580);
    }

    showPop(x, y, text) {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = 'position:fixed;from the css transform scale(0,0);background:rgba(255,0,0,0.8);color:#fff;font-weight:bold;border-radius:50%;padding:10px 20px;user-select:none;font-size:16px;";
        el.textContent = text;
        el.style.transform = 'scale(0,0)';
        el.style.transition = 'transform 0.3s,opacity 0.3s';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.color = '#fff';
        el.style.zIndex = 1000;
        el.style.background = 'rgba(255,0,0,0.8)';
        el.style.borderRadius = '50%';
        el.style.padding = '10px 20px';
        el.style.userSelect = 'none';
        el.style.fontSize = '16px';
        el.style.left = (400 + Math.random()*100) + 'px';
        el.style.top = (200 + Math.random()*300) + 'px';
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => {
            el.style.transform = 'scale(1,1)';
            el.style.opacity = '0';
        }, 50);
        setTimeout(() => {
            el.remove();
        }, 350);
    }
}

class Game {
    constructor() {
        window.addEventListener('DOMContentLoaded', () => {
            const game = new KleinanzeigenRace();
            game.init();
            
            // Initialize display
            ctx.canvas = document.getElementById('game-canvas');
            ctx = ctx.canvas.getContext('2d');
            ctx.canvas.width = 800;
            ctx.canvas.height = 600;
            game.render();
        });
    }
}

new Game();
