/**
 * Game Logic Core - Kleinanzeigen Adventure v2.0
 * Main game engine with race mechanics, scoring, and timer
 */

class GameLogicRace extends Phaser.Scene {
    constructor() {
        super({ key: 'GameLogicRace' });
        this.score = 0;
        this.highScore = 0;
        this.time = 0;
        this.items = [];
        this.player = { x: 400, y: 500, speed: 5, active: false };
    }

    preload() {
        this.load.image('gem', 'https://cdn-icons-png.flaticon.com/512/816/816561.png');
        this.load.image('player', 'https://cdn-icons-png.flaticon.com/512/47/47903.png');
        this.load.image('wall', 'https://cdn-icons-png.flaticon.com/512/3707/3707287.png');
    }

    create() {
        const container = this.add.container(400, 300);

        const wall = this.add.image(100, 100, 'wall').setScale(0.5, 0.5).setOrigin(0);
        const wall2 = this.add.image(300, 100, 'wall').setScale(0.5, 0.5).setOrigin(0);
        container.add(wall).add(wall2);

        const playerImg = this.add.image(400, 500, 'player').setScale(0.8, 0.8).setOrigin(0.5);
        const player = this.add.image(400, 500, 'gem').setScale(0.6, 0.6).setOrigin(0.5);
        container.add(player);

        this.add.keyboard
            .on('keydown', (key) => {
                const keys = {
                    'ArrowLeft': -1, 'ArrowRight': 1,
                    'd': 1, 'a': -1, 'A': -1, 'D': 1
                };
                this.player.x += this.player.speed * (keys[key.key] || 0);
                this.checkBoundaries();
            });

        const scoreText = this.add.text(20, 20, '', { fontSize: '24px', fill: '#f6416c' });
        scoreText.setScrollFactor(0);
        this.scoreText = scoreText;

        const highScoreText = this.add.text(210, 20, '', { fontSize: '20px', fill: '#4ade80' });
        highScoreText.setScrollFactor(0);
        this.highScoreText = highScoreText;

        const clockText = this.add.text(400, 20, 'HH:MM:SS', { fontSize: '18px', fill: '#00ff00' });
        clockText.setScrollFactor(0);
        this.clockText = clockText;

        this.time.addEvent({ delay: 1000, callback: () => {
            const now = new Date();
            this.clockText.setText(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
        }, loop: true });

        this.physics.world.setBounds(0, 0, 800, 600);

        this.spawningTimer = this.time.delayedCall(2000, () => this.spawnItem());
        this.spawningTimer.repeat(100);

        this.active = true;

        this.add.text(400, 560, 'Arrow Keys: Move | Collect: Score +100', {fontSize: '14px', fill: '#888'});
    }

    checkBoundaries() {
        this.player.x = Math.max(0, Math.min(800, this.player.x));
    }

    spawnItem() {
        if (Math.random() > 0.7) {
            const y = 100 + Math.random() * 400;
            const x = Math.random() * 200 + 100;
            const gem = this.add.image(x, y, 'gem').setScale(0.6, 0.6);
            gem.setActive(true).setVisible(true);
            gem.setInteractive();
            gem.on('pointerdown', () => {
                this.score += 100;
                this.scoreText.setText(`Score: ${this.score}`);
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    this.highScoreText.setText(`High: ${this.highScore}`);
                }
                gem.disableImmune();
                gem.destroy();
            });
            this.items.push(gem);
            // 模拟收集检测
            const photonEvent = new Phaser.Curs