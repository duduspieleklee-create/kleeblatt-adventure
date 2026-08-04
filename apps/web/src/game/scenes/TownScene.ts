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

export class TownScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private enemies: Enemy[] = [];
  private interactionZones: InteractionZone[] = [];
  private buildings: Building[] = [];

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

  constructor() {
    super('town');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#3a5a2a');

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

    this.player = new Player(this, 300, 300, 'hero_idle');
    this.player.sprite.setScale(1.5);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);

    this.spawnNPCs();
    this.spawnEnemies();
    this.spawnBuildings();
    this.createInteractionZones();
    this.setupInput();
    this.setupInteractionOverlap();
    this.setupSkillListeners();

    gameBridge.emit(PhaserEvents.SCENE_LOADED, { scene: 'TownScene' });
  }

  update(time: number, delta: number): void {
    this.player.update(this.wasd, this.cursors);
    for (const npc of this.npcs) {
      npc.update(time, delta);
    }
    for (const enemy of this.enemies) {
      enemy.update(time, delta);
    }
    this.handleSkillInput();
  }

  private spawnNPCs(): void {
    const npcData: { id: string; x: number; y: number; label: string; dialogue: NPCDialogue[] }[] = [
      {
        id: 'haendler', x: 300, y: 180, label: 'Händler',
        dialogue: [{ text: 'Willkommen! Was kann ich für dich tun?', options: ['Handeln', 'Gehen'] }],
      },
      {
        id: 'auftraggeber', x: 450, y: 220, label: 'Auftraggeber',
        dialogue: [{ text: 'Ich brauche Hilfe! Sammle mir 5 Holz.', options: ['Annehmen', 'Ablehnen'] }],
      },
      {
        id: 'taverne', x: 520, y: 300, label: 'Taverne',
        dialogue: [{ text: 'Ein Bier? Setz dich hin.', options: ['Ja', 'Nein'] }],
      },
    ];
    for (const data of npcData) {
      const npc = new NPC(this, data.x, data.y, 'skeleton_idle', data.label, data.dialogue);
      npc.sprite.setScale(1.5);
      npc.setPlayerRef({ x: this.player.sprite.x, y: this.player.sprite.y });
      this.npcs.push(npc);
    }
  }

  private spawnEnemies(): void {
    const enemyData: { id: string; x: number; y: number; stats: Partial<EnemyStats> }[] = [
      {
        id: 'slime', x: 600, y: 400,
        stats: { hp: 30, attack: 3, defense: 1, speed: 30, xpReward: 15, goldRewardMin: 1, goldRewardMax: 5 },
      },
      {
        id: 'wolf', x: 700, y: 350,
        stats: { hp: 50, attack: 8, defense: 3, speed: 50, xpReward: 30, goldRewardMin: 5, goldRewardMax: 15 },
      },
    ];
    for (const data of enemyData) {
      const enemy = new Enemy(this, data.x, data.y, 'skeleton_idle', data.id, data.stats);
      enemy.sprite.setScale(1.5);
      enemy.setPlayerRef({ x: this.player.sprite.x, y: this.player.sprite.y });
      this.enemies.push(enemy);
    }
  }

  private spawnBuildings(): void {
    const buildingData = [
      { x: 300, y: 140, key: 'tiles_buildings', label: 'Rathaus' },
      { x: 520, y: 260, key: 'tiles_buildings', label: 'Taverne' },
      { x: 300, y: 300, key: 'tiles_buildings', label: 'Händler' },
    ];
    for (const data of buildingData) {
      const building = new Building(this, data.x, data.y, data.key, data.label);
      building.setCollision();
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
    gameBridge.on(ReactCommands.CAST_SKILL, (data: { skillId: string }) => {
      this.castSkill(data.skillId);
    });
    gameBridge.on(ReactCommands.USE_ITEM, (data: { itemId: string }) => {
      this.inventorySystem.useItem(data.itemId);
    });
    gameBridge.on(ReactCommands.EQUIP_ITEM, (data: { itemId: string }) => {
      this.equipmentSystem.equip(data.itemId);
    });
    gameBridge.on(ReactCommands.UNEQUIP_ITEM, (data: { slot: string }) => {
      this.equipmentSystem.unequip(data.slot as 'weapon' | 'head' | 'chest' | 'legs' | 'ring' | 'amulet' | 'offhand');
    });
    gameBridge.on(ReactCommands.SHOP_BUY, (data: { itemId: string }) => {
      this.shopSystem.buyItem(data.itemId);
    });
    gameBridge.on(ReactCommands.DIALOG_OPTION, (data: { optionId: string }) => {
      this.dialogueSystem.selectOption(data.optionId);
    });
    gameBridge.on(ReactCommands.DIALOG_CLOSE, () => {
      this.dialogueSystem.closeDialogue();
    });
    gameBridge.on(ReactCommands.SHOP_CLOSE, () => {
      this.shopSystem.closeShop();
    });
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