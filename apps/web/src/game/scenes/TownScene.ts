import Phaser from 'phaser';
import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents, ReactCommands } from '../core/GameEvents';
import Player from '../entities/Player';
import NPC, { NPCDialogue } from '../entities/NPC';
import Enemy from '../entities/Enemy';
import InteractionZone from '../entities/InteractionZone';
import Building from '../entities/Building';
import InventorySystem from '../systems/InventorySystem';
import EquipmentSystem from '../systems/EquipmentSystem';
import CombatSystem from '../systems/CombatSystem';
import SkillSystem from '../systems/SkillSystem';
import LootSystem from '../systems/LootSystem';
import QuestSystem from '../systems/QuestSystem';
import ShopSystem from '../systems/ShopSystem';
import DialogueSystem, { DialogueData } from '../systems/DialogueSystem';
import { createWorldMap } from '../maps/createWorldMap';

const CAMERA_ZOOM = 1.5;
const CAMERA_DEADZONE = { width: 0.9, height: 0.9 };

const WORLD_W = 1200;
const WORLD_H = 1200;

export class TowerScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private enemies: Enemy[] = [];
  private interactionZones: InteractionZone[] = [];
  private buildings: Building[] = [];
  private trees!: Phaser.Physics.Arcade.StaticGroup;
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
    super('TowerScene');
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

    // 1. WELT BAUEN
    const world = createWorldMap(this, {
      widthPx: WORLD_W,
      heightPx: WORLD_H,
      groundKey: 'ground_tile',
      wallTilesetKey: 'wall_tile',
      borderWalls: true,
    });
    this.wallLayer = world.wallLayer;

    // 2. BÄUME MIT KOLLISION
    this.trees = this.physics.add.staticGroup();
    this.spawnTrees();

    // 3. DORF-GEBÄUDE
    this.spawnVillage();

    // 4. SPIELER
    const spawnX = world.widthPx / 2;
    const spawnY = world.heightPx / 2;
    this.player = new Player(this, spawnX, spawnY, 'hero_idle');
    this.player.sprite.setScale(1.5);

    // 5. KOLLISIONEN
    if (this.wallLayer) {
      this.physics.add.collider(this.player.sprite, this.wallLayer);
    }
    this.physics.add.collider(this.player.sprite, this.trees);

    // 6. KAMERA
    this.cameras.main.setBounds(0, 0, world.widthPx, world.heightPx);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.setDeadzone(CAMERA_DEADZONE.width, CAMERA_DEADZONE.height);
    this.cameras.main.roundPixels = true;

    // 7. NPCS, GEGNER, ZONEN
    this.spawnNPCs(spawnX, spawnY);
    this.spawnEnemies(spawnX, spawnY);
    this.createInteractionZones();
    this.setupInput();
    this.setupInteractionOverlap();
    this.setupSkillListeners();

    gameBridge.emit(PhaserEvents.SCENE_LOADED, { scene: 'TowerScene' });
  }

  update(time: number, delta: number): void {
    try {
      this.player.update(this.wasd, this.cursors);
      for (const npc of this.npcs) npc.update(time, delta);
      for (const enemy of this.enemies) enemy.update(time, delta);
      this.handleSkillInput();
    } catch (e) {
      console.error('[TowerScene] update error:', e);
    }
  }

  // ============================================================
  //  BÄUME MIT KOLLISION
  // ============================================================
  private spawnTrees(): void {
    const treePositions = [
      [200, 300], [400, 150], [600, 500], [800, 200], [1000, 700],
      [150, 600], [350, 800], [550, 200], [750, 900], [950, 400],
      [100, 100], [1100, 1100], [50, 1050], [1050, 50]
    ];

    for (const [x, y] of treePositions) {
      const tree = this.trees.create(x, y, 'tree_1');
      tree.setDisplaySize(48, 54);
      tree.setDepth(1);
      tree.body.setSize(20, 20);
      tree.body.setOffset(14, 20);
    }
  }

  // ============================================================
  //  DORF MIT GEBÄUDEN
  // ============================================================
  private spawnVillage(): void {
    const cx = WORLD_W / 2;
    const cy = WORLD_H / 2;

    const rathaus = new Building(this, cx - 60, cy - 50, 'Rathaus', {
      color: 0x8B7355,
      roofColor: 0x6B4F12,
      width: 64,
      height: 56,
    });
    rathaus.setCollision();
    this.physics.add.collider(this.player.sprite, rathaus.getBody());
    this.buildings.push(rathaus);

    const taverne = new Building(this, cx + 80, cy + 40, 'Taverne', {
      color: 0x7a5c3a,
      roofColor: 0x8B4513,
      width: 56,
      height: 48,
    });
    taverne.setCollision();
    this.physics.add.collider(this.player.sprite, taverne.getBody());
    this.buildings.push(taverne);

    const schmiede = new Building(this, cx - 100, cy + 70, 'Schmiede', {
      color: 0x6b6b6b,
      roofColor: 0x4a4a4a,
      width: 48,
      height: 40,
    });
    schmiede.setCollision();
    this.physics.add.collider(this.player.sprite, schmiede.getBody());
    this.buildings.push(schmiede);

    const turm = new Building(this, cx + 50, cy - 90, 'Magieturm', {
      color: 0x4a6b8a,
      roofColor: 0x2a4a6a,
      width: 40,
      height: 64,
    });
    turm.setCollision();
    this.physics.add.collider(this.player.sprite, turm.getBody());
    this.buildings.push(turm);
  }

  // ============================================================
  //  NPCS (unverändert)
  // ============================================================
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
      this.physics.add.collider(npc.sprite, this.trees);
    }
  }

  // ============================================================
  //  GEGNER (unverändert)
  // ============================================================
  private spawnEnemies(cx: number, cy: number): void {
    const enemyData: { id: string; x: number; y: number; stats: Partial<EnemyStats> }[] = [
      {
        id: 'slime', x: cx + 300, y: cy - 200,
        stats: { hp: 30, attack: 3, defense: 1, speed: 30, xpReward: 15, goldRewardMin: 1, goldRewardMax: 5 },
      },
      {
        id: 'slime2', x: cx - 280, y: cy + 250,
        stats: { hp: 30, attack: 3, defense: 1, speed: 30, xpReward: 15, goldRewardMin: 1, goldRewardMax: 5 },
      },
      {
        id: 'wolf', x: cx + 350, y: cy + 300,
        stats: { hp: 50, attack: 8, defense: 3, speed: 50, xpReward: 30, goldRewardMin: 5, goldRewardMax: 15 },
      },
      {
        id: 'wolf2', x: cx - 350, y: cy - 300,
        stats: { hp: 50, attack: 8, defense: 3, speed: 50, xpReward: 30, goldRewardMin: 5, goldRewardMax: 15 },
      },
      {
        id: 'skeleton', x: cx + 400, y: cy,
        stats: { hp: 80, attack: 12, defense: 5, speed: 40, xpReward: 50, goldRewardMin: 10, goldRewardMax: 25 },
      },
    ];
    for (const data of enemyData) {
      const enemy = new Enemy(this, data.x, data.y, 'skeleton_idle', data.id, data.stats);
      enemy.sprite.setScale(1.5);
      enemy.setPlayerRef({ x: this.player.sprite.x, y: this.player.sprite.y });
      this.enemies.push(enemy);
      if (this.wallLayer) {
        this.physics.add.collider(enemy.sprite, this.wallLayer);
      }
      this.physics.add.collider(enemy.sprite, this.trees);
    }
  }

  // ============================================================
  //  INTERAKTIONSZONEN (unverändert)
  // ============================================================
  private createInteractionZones(): void {
    for (const npc of this.npcs) {
      const zone = new InteractionZone(this, npc.sprite.x, npc.sprite.y, 64, 64, npc.sprite);
      zone.setCallback(() => {
        gameBridge.emit(PhaserEvents.INTERACTION, { target: npc.name });
      });
      this.interactionZones.push(zone);
    }
  }

  // ============================================================
  //  INPUT, BRIDGE, CLEANUP (unverändert)
  // ============================================================
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
    const skillMap: Record<string, string> = {
      Q: 'slash',
      E: 'fireball',
      A: 'heal',
      J: 'power_strike',
    };
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
              lines: npc.dialogue.map((d, i) => ({
                id: `line_${i}`,
                speaker: npc.name,
                text: d.text,
                options: d.options?.map((o, j) => ({ id: `opt_${j}`, text: o })) || [],
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
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  xpReward: number;
  goldRewardMin: number;
  goldRewardMax: number;
  }
