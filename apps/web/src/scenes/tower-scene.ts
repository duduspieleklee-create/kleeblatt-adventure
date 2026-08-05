import Phaser from 'phaser';
import { gameBridge } from '../lib/gameBridge';
import { PhaserEvents, ReactCommands } from '../game/core/GameEvents';
import Player from '../game/entities/Player';
import NPC, { NPCDialogue } from '../game/entities/NPC';
import Enemy from '../game/entities/Enemy';
import InteractionZone from '../game/entities/InteractionZone';
import Building from '../game/entities/Building';
import InventorySystem from '../game/systems/InventorySystem';
import EquipmentSystem from '../game/systems/EquipmentSystem';
import CombatSystem from '../game/systems/CombatSystem';
import SkillSystem from '../game/systems/SkillSystem';
import LootSystem from '../game/systems/LootSystem';
import QuestSystem from '../game/systems/QuestSystem';
import ShopSystem from '../game/systems/ShopSystem';
import DialogueSystem, { DialogueData } from '../game/systems/DialogueSystem';
import { createWorldMap } from '../game/maps/createWorldMap';
import { CAMERA_ZOOM, CAMERA_DEADZONE } from '../game/constants';

/** World size in pixels (not tiles). */
const WORLD_W = 1200;
const WORLD_H = 1200;

export class TowerScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private enemies: Enemy[] = [];
  private interactionZones: InteractionZone[] = [];
  private buildings: Building[] = [];
  private wallLayer: Phaser.Tilemaps.TilemapLayer | null = null;

  private inventorySystem!: InventorySystem;
  private equipmentSystem!: EquipmentSystem;
  private combatSystem!: CombatSystem;
  private skillSystem!: SkillSystem;
  private lootSystem!: LootSystem;
  private questSystem!: QuestSystem;
  private shopSystem!: ShopSystem;
  private dialogueSystem!: DialogueSystem;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private keys!: {
    Q: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
  };

  private bridgeHandlers: Array<[string, (payload: unknown) => void]> = [];

  constructor() {
    super('tower');
  }

  private onBridge<T>(event: string, handler: (payload: T) => void): void {
    const wrapped = handler as (payload: unknown) => void;
    gameBridge.on(event, wrapped);
    this.bridgeHandlers.push([event, wrapped]);
  }

  create(): void {
    this.registerShutdownCleanup();

    this.inventorySystem = new InventorySystem(this);
    this.equipmentSystem = new EquipmentSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.skillSystem = new SkillSystem(this);
    this.skillSystem.setCombatSystem(this.combatSystem);
    this.lootSystem = new LootSystem(this);
    this.lootSystem.setInventorySystem(this.inventorySystem);
    this.combatSystem.setLootSystem(this.lootSystem);
    this.questSystem = new QuestSystem(this);
    this.questSystem.setInventorySystem(this.inventorySystem);
    this.shopSystem = new ShopSystem(this);
    this.shopSystem.setInventorySystem(this.inventorySystem);
    this.dialogueSystem = new DialogueSystem(this);

    const world = createWorldMap(this, {
      widthPx: WORLD_W,
      heightPx: WORLD_H,
      groundKey: 'ground_tile',
      wallTilesetKey: 'wall_tile',
      borderWalls: true,
    });
    this.wallLayer = world.wallLayer;

    this.createPaths();
    this.createDecorations();

    const spawnX = world.widthPx / 2;
    const spawnY = world.heightPx / 2;

    this.player = new Player(this, spawnX, spawnY, 'hero_idle');
    this.player.sprite.setScale(1.5);

    if (this.wallLayer) {
      this.physics.add.collider(this.player.sprite, this.wallLayer);
    }

    this.cameras.main.setBounds(0, 0, world.widthPx, world.heightPx);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.setDeadzone(CAMERA_DEADZONE.width, CAMERA_DEADZONE.height);
    this.cameras.main.roundPixels = true;

    this.spawnNPCs(spawnX, spawnY);
    this.spawnEnemies(spawnX, spawnY);
    this.spawnBuildings(spawnX, spawnY);
    this.createInteractionZones();
    this.setupInput();
    this.setupInteractionOverlap();
    this.setupSkillListeners();

    gameBridge.emit(PhaserEvents.SCENE_LOADED, { scene: 'TowerScene' });
  }

  update(time: number, delta: number): void {
    try {
      this.player.update(this.wasd, this.cursors);
      for (const npc of this.npcs) {
        npc.update(time, delta);
      }
      for (const enemy of this.enemies) {
        enemy.update(time, delta);
      }
      this.handleSkillInput();
    } catch (e) {
      console.error('[TowerScene] update error:', e);
    }
  }

  private createPaths(): void {
    const cx = WORLD_W / 2;
    const cy = WORLD_H / 2;
    const pw = 64;

    const pathG = this.add.graphics();
    pathG.fillStyle(0x9e8e70, 1);
    pathG.fillRect(cx - pw / 2, 0, pw, WORLD_H);
    pathG.fillRect(0, cy - pw / 2, WORLD_W, pw);
    pathG.setDepth(0.5);

    for (let i = 0; i < 200; i++) {
      const px = Phaser.Math.Between(cx - pw / 2, cx + pw / 2);
      const py = Phaser.Math.Between(0, WORLD_H);
      pathG.fillStyle(0x8a7a5e, 1);
      pathG.fillRect(px, py, 3, 3);
    }
    for (let i = 0; i < 200; i++) {
      const px = Phaser.Math.Between(0, WORLD_W);
      const py = Phaser.Math.Between(cy - pw / 2, cy + pw / 2);
      pathG.fillStyle(0x8a7a5e, 1);
      pathG.fillRect(px, py, 3, 3);
    }

    const wellG = this.add.graphics();
    wellG.fillStyle(0x5a5a5a, 1);
    wellG.fillCircle(cx, cy, 36);
    wellG.fillStyle(0x3a3a3a, 1);
    wellG.fillCircle(cx, cy, 28);
    wellG.fillStyle(0x4a8ab5, 0.8);
    wellG.fillCircle(cx, cy, 24);
    wellG.setDepth(0.6);
  }

  private createDecorations(): void {
    const cx = WORLD_W / 2;
    const cy = WORLD_H / 2;

    for (let i = 0; i < 80; i++) {
      const tx = Phaser.Math.Between(40, WORLD_W - 40);
      const ty = Phaser.Math.Between(40, WORLD_H - 40);
      if (Math.abs(tx - cx) < 80 || Math.abs(ty - cy) < 80) continue;
      const s = 32 + Phaser.Math.Between(0, 32);
      const tree = this.add.image(tx, ty, 'tree');
      tree.setDisplaySize(s, s * 1.125);
      tree.setAlpha(0.85 + Math.random() * 0.15);
      tree.setDepth(1);
    }

    for (let i = 0; i < 100; i++) {
      const fx = Phaser.Math.Between(20, WORLD_W - 20);
      const fy = Phaser.Math.Between(20, WORLD_H - 20);
      if (Math.abs(fx - cx) < 50 || Math.abs(fy - cy) < 50) continue;
      const colors = [0xff6b8a, 0xffd166, 0xa78bfa, 0x60a5fa, 0xf87171];
      const c = colors[Phaser.Math.Between(0, colors.length - 1)]!;
      const fg = this.add.graphics();
      fg.fillStyle(c, 1);
      fg.fillCircle(fx, fy, 3);
      fg.setDepth(1);
    }

    for (let i = 0; i < 40; i++) {
      const rx = Phaser.Math.Between(40, WORLD_W - 40);
      const ry = Phaser.Math.Between(40, WORLD_H - 40);
      if (Math.abs(rx - cx) < 80 || Math.abs(ry - cy) < 80) continue;
      const shade = 80 + Phaser.Math.Between(0, 40);
      const rg = this.add.graphics();
      rg.fillStyle((shade << 16) | (shade << 8) | shade, 1);
      rg.fillCircle(rx, ry, 6 + Phaser.Math.Between(0, 6));
      rg.setDepth(1);
    }

    const lampPositions = [
      { x: cx + 80, y: cy }, { x: cx - 80, y: cy },
      { x: cx, y: cy + 80 }, { x: cx, y: cy - 80 },
      { x: cx + 200, y: cy }, { x: cx - 200, y: cy },
      { x: cx, y: cy + 200 }, { x: cx, y: cy - 200 },
    ];

    for (const pos of lampPositions) {
      const lg = this.add.graphics();
      lg.fillStyle(0x4a4a4a, 1);
      lg.fillRect(pos.x - 3, pos.y - 20, 6, 24);
      lg.fillStyle(0xffee88, 0.9);
      lg.fillCircle(pos.x, pos.y - 22, 5);
      lg.fillStyle(0xffee88, 0.15);
      lg.fillCircle(pos.x, pos.y - 22, 20);
      lg.setDepth(2);
    }

    const benchPositions = [
      { x: cx + 120, y: cy + 60 },
      { x: cx - 120, y: cy - 60 },
    ];

    for (const pos of benchPositions) {
      const bg = this.add.graphics();
      bg.fillStyle(0x5a3a20, 1);
      bg.fillRect(pos.x - 16, pos.y - 4, 32, 8);
      bg.fillRect(pos.x - 16, pos.y - 12, 4, 12);
      bg.fillRect(pos.x + 12, pos.y - 12, 4, 12);
      bg.fillRect(pos.x - 16, pos.y - 12, 32, 4);
      bg.setDepth(2);
    }

    const postG = this.add.graphics();
    postG.fillStyle(0x5a3a20, 1);
    postG.fillRect(cx - 4, cy - 50, 8, 20);
    postG.fillRect(cx - 4, cy + 30, 8, 20);
    postG.setDepth(2);

    const fenceG = this.add.graphics();
    fenceG.fillStyle(0x6b5030, 1);
    for (let i = 0; i < 6; i++) {
      fenceG.fillRect(cx - 100 + i * 40, cy - 120, 6, 24);
    }
    fenceG.fillRect(cx - 100, cy - 112, 240, 4);
    fenceG.fillRect(cx - 100, cy - 100, 240, 4);
    for (let i = 0; i < 6; i++) {
      fenceG.fillRect(cx - 100 + i * 40, cy + 100, 6, 24);
    }
    fenceG.fillRect(cx - 100, cy + 104, 240, 4);
    fenceG.fillRect(cx - 100, cy + 116, 240, 4);
    fenceG.setDepth(2);
  }

  private spawnNPCs(cx: number, cy: number): void {
    const npcData: { id: string; x: number; y: number; label: string; dialogue: NPCDialogue[] }[] = [
      {
        id: 'haendler', x: cx + 140, y: cy - 40, label: 'Händler',
        dialogue: [{ text: 'Willkommen! Was kann ich für dich tun?', options: ['Handeln', 'Gehen'] }],
      },
      {
        id: 'auftraggeber', x: cx - 140, y: cy + 40, label: 'Auftraggeber',
        dialogue: [{ text: 'Ich brauche Hilfe! Sammle mir 5 Holz.', options: ['Annehmen', 'Ablehnen'] }],
      },
      {
        id: 'schmied', x: cx + 40, y: cy + 140, label: 'Schmied',
        dialogue: [{ text: 'Gute Waffen hier! Sieh dir um.', options: ['Schauen', 'Später'] }],
      },
      {
        id: 'magierin', x: cx - 40, y: cy - 140, label: 'Magierin',
        dialogue: [{ text: 'Die Magie fließt stark heute...', options: ['Lernen', 'Danke'] }],
      },
      {
        id: 'taverne', x: cx + 200, y: cy + 100, label: 'Tavernenwirt',
        dialogue: [{ text: 'Ein Bier? Setz dich hin.', options: ['Ja', 'Nein'] }],
      },
    ];
    for (const data of npcData) {
      const npc = new NPC(this, data.x, data.y, 'skeleton_idle', data.label, data.dialogue);
      npc.sprite.setScale(1.5);
      npc.setPlayerRef({ x: this.player.sprite.x, y: this.player.sprite.y });
      this.npcs.push(npc);
      this.physics.add.collider(npc.sprite, this.wallLayer ?? undefined as any); // safe collider usage
    }
  }

  private spawnEnemies(cx: number, cy: number): void {
    const enemyData: { id: string; x: number; y: number; stats: Partial<EnemyStats> }[] = [
      { id: 'slime', x: cx + 300, y: cy - 200, stats: { hp: 30, attack: 3, defense: 1, speed: 30, xpReward: 15, goldRewardMin: 1, goldRewardMax: 5 } },
      { id: 'slime2', x: cx - 280, y: cy + 250, stats: { hp: 30, attack: 3, defense: 1, speed: 30, xpReward: 15, goldRewardMin: 1, goldRewardMax: 5 } },
      { id: 'wolf', x: cx + 350, y: cy + 300, stats: { hp: 50, attack: 8, defense: 3, speed: 50, xpReward: 30, goldRewardMin: 5, goldRewardMax: 15 } },
      { id: 'wolf2', x: cx - 350, y: cy - 300, stats: { hp: 50, attack: 8, defense: 3, speed: 50, xpReward: 30, goldRewardMin: 5, goldRewardMax: 15 } },
      { id: 'skeleton', x: cx + 400, y: cy, stats: { hp: 80, attack: 12, defense: 5, speed: 40, xpReward: 50, goldRewardMin: 10, goldRewardMax: 25 } },
    ];
    for (const data of enemyData) {
      const enemy = new Enemy(this, data.x, data.y, 'skeleton_idle', data.id, data.stats);
      enemy.sprite.setScale(1.5);
      enemy.setPlayerRef({ x: this.player.sprite.x, y: this.player.sprite.y });
      this.enemies.push(enemy);
      if (this.wallLayer) this.physics.add.collider(enemy.sprite, this.wallLayer);
    }
  }

  private spawnBuildings(cx: number, cy: number): void {
    const buildingData = [
      { x: cx - 130, y: cy - 130, label: 'Rathaus', color: 0x8B7355, roofColor: 0x6B4F12 },
      { x: cx + 210, y: cy + 110, label: 'Taverne', color: 0x7a5c3a, roofColor: 0x8B4513 },
      { x: cx + 50, y: cy + 150, label: 'Schmiede', color: 0x6b6b6b, roofColor: 0x4a4a4a },
      { x: cx - 50, y: cy - 150, label: 'Magieturm', color: 0x4a6b8a, roofColor: 0x2a4a6a },
    ];

    for (const data of buildingData) {
      const building = new Building(this, data.x, data.y, data.label, { color: data.color, roofColor: data.roofColor });
      building.setCollision();
      this.physics.add.collider(this.player.sprite, building.getBody());
      for (const enemy of this.enemies) {
        this.physics.add.collider(enemy.sprite, building.getBody());
      }
      this.buildings.push(building);
    }
  }

  private createInteractionZones(): void {
    for (const npc of this.npcs) {
      const zone = new InteractionZone(this, npc.sprite.x, npc.sprite.y, 64, 64, npc.sprite);
      zone.setCallback(() => {
        gameBridge.emit(PhaserEvents.INTERACTION, { target: npc.name });
      });
      this.interactionZones.push(zone);
    }
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)!,
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)!,
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)!,
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)!,
    };
    this.keys = {
      Q: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)!,
      E: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)!,
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)!,
      J: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J)!,
    };
  }

  private setupInteractionOverlap(): void {
    for (const zone of this.interactionZones) {
      zone.setOverlapWith(this.player.sprite, () => {
        zone.trigger({ x: this.player.sprite.x, y: this.player.sprite.y });
      });
    }
  }

  private setupSkillListeners(): void {
    this.onBridge<{ skillId: string }>(ReactCommands.CAST_SKILL, (data) => {
      this.castSkill(data.skillId);
    });
    this.onBridge<{ itemId: string }>(ReactCommands.USE_ITEM, (data) => {
      this.inventorySystem.useItem(data.itemId);
    });
    this.onBridge<{ itemId: string }>(ReactCommands.EQUIP_ITEM, (data) => {
      this.equipmentSystem.equip(data.itemId);
    });
    this.onBridge<{ slot: string }>(ReactCommands.UNEQUIP_ITEM, (data) => {
      this.equipmentSystem.unequip(data.slot as 'weapon' | 'head' | 'chest' | 'legs' | 'ring' | 'amulet' | 'offhand');
    });
    this.onBridge<{ itemId: string }>(ReactCommands.SHOP_BUY, (data) => {
      this.shopSystem.buyItem(data.itemId);
    });
    this.onBridge<{ optionId: string }>(ReactCommands.DIALOG_OPTION, (data) => {
      this.dialogueSystem.selectOption(data.optionId);
    });
    this.onBridge(ReactCommands.DIALOG_CLOSE, () => {
      this.dialogueSystem.closeDialogue();
    });
    this.onBridge(ReactCommands.SHOP_CLOSE, () => {
      this.shopSystem.closeShop();
    });
  }

  private registerShutdownCleanup(): void {
    const cleanup = () => {
      for (const [event, handler] of this.bridgeHandlers) {
        gameBridge.off(event, handler);
      }
      this.bridgeHandlers.length = 0;
      this.wallLayer = null;
      this.npcs.length = 0;
      this.enemies.length = 0;
      this.interactionZones.length = 0;
      this.buildings.length = 0;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
  }

  private handleSkillInput(): void {
    const skillMap: Record<string, string> = { Q: 'slash', E: 'fireball', A: 'heal', J: 'power_strike' };
    for (const [key, skillId] of Object.entries(skillMap)) {
      const k = this.keys[key as keyof typeof this.keys];
      if (k && Phaser.Input.Keyboard.JustDown(k)) {
        this.castSkill(skillId);
      }
    }
    const eKey = this.keys.E;
    if (eKey && Phaser.Input.Keyboard.JustDown(eKey)) {
      this.tryInteract();
    }
  }

  private castSkill(skillId: string): void {
    if (!this.skillSystem.canUse(skillId)) return;
    const target = this.getNearestEnemy();
    if (target) {
      this.skillSystem.useSkill(this.player, target, skillId);
    } else if (skillId === 'heal') {
      this.skillSystem.useSkill(this.player, this.player, skillId);
    }
  }

  private tryInteract(): void {
    for (const zone of this.interactionZones) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        zone.zone.x, zone.zone.y
      );
      if (dist < 80) {
        const npc = this.npcs.find(n => zone.interactWith === n.sprite);
        if (npc) {
          if (npc.name === 'Händler') {
            this.shopSystem.openShop('haendler');
          } else {
            const dialogueData: DialogueData = {
              npcId: npc.name,
              lines: npc.dialogue.map((d: NPCDialogue, i: number) => ({
                id: `line_${i}`,
                speaker: npc.name,
                text: d.text,
                options: d.options?.map((o: string, j: number) => ({ id: `opt_${j}`, text: o })) || [],
              })),
              startLine: 'line_0',
            };
            this.dialogueSystem.startDialogue(npc.name, dialogueData);
          }
        }
        return;
      }
    }
  }

  private getNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.isDead()) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        enemy.sprite.x, enemy.sprite.y
      );
      if (dist < minDist && dist < 300) {
        minDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }
}

interface EnemyStats {
  hp: number;
  maxHp?: number;
  attack: number;
  defense: number;
  speed: number;
  xpReward: number;
  goldRewardMin: number;
  goldRewardMax: number;
}
