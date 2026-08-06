/**
 * Game configuration loader
 * Loads and exports the game configuration from game-config.json
 */

// Import the game configuration
import gameConfigJson from '../game-config.json';

// Define types for the game configuration
export interface GameConfig {
  version: string;
  description: string;
  auth: {
    provider: string;
    providerNote: string;
    session: {
      type: string;
      cookieName: string;
      ttlMinutes: number;
      refreshThresholdMinutes: number;
      sameSite: string;
      secure: boolean;
      httpOnly: boolean;
    };
    env: Record<string, string>;
    routes: Record<string, string>;
  };
  statStacking: {
    formula: string;
    levelBonusHp: string;
    levelBonusAtk: string;
    gearBonus: string;
    rules: string;
  };
  hero: {
    classes: {
      melee: {
        id: string;
        label: string;
        description: string;
        baseStats: {
          maxHp: number;
          speed: number;
          atk: number;
          resource: string;
          maxResource: number;
          resourceRegenPerSec: number;
        };
        skills: string[];
        basicAttack: {
          id: string;
          name: string;
          type: string;
          damage: number;
          range?: number;
          arcDeg?: number;
          cooldownMs: number;
          resourceCost?: number;
          projectileSpeed?: number;
          castTimeMs?: number;
          interruptible?: boolean;
        };
      };
      ranged: {
        id: string;
        label: string;
        description: string;
        baseStats: {
          maxHp: number;
          speed: number;
          atk: number;
          resource: string;
          maxResource: number;
          resourceRegenPerSec: number;
        };
        skills: string[];
        basicAttack: {
          id: string;
          name: string;
          type: string;
          damage: number;
          range?: number;
          arcDeg?: number;
          cooldownMs: number;
          resourceCost?: number;
          projectileSpeed?: number;
          castTimeMs?: number;
          interruptible?: boolean;
        };
      };
      mage: {
        id: string;
        label: string;
        description: string;
        baseStats: {
          maxHp: number;
          speed: number;
          atk: number;
          resource: string;
          maxResource: number;
          resourceRegenPerSec: number;
        };
        skills: string[];
        basicAttack: {
          id: string;
          name: string;
          type: string;
          damage: number;
          range?: number;
          arcDeg?: number;
          cooldownMs: number;
          resourceCost?: number;
          projectileSpeed?: number;
          castTimeMs?: number;
          interruptible?: boolean;
        };
      };
    };
    skillUnlockLevels: {
      q: number;
      e: number;
    };
    levelBonuses: {
      hpPerLevel: number;
      atkPerLevel: number;
    };
  };
  skills: {
    dash: {
      id: string;
      name: string;
      class: string;
      slot: string;
      unlockLevel: number;
      cdMs: number;
      staminaCost: number;
      damage: number;
      type: string;
      dashDistance: number;
      dashDurationMs: number;
    };
    shield_wall: {
      id: string;
      name: string;
      class: string;
      slot: string;
      unlockLevel: number;
      cdMs: number;
      staminaCost: number;
      durationMs: number;
      damageTakenFactor: number;
      type: string;
    };
    rapid_fire: {
      id: string;
      name: string;
      class: string;
      slot: string;
      unlockLevel: number;
      cdMs: number;
      staminaCost: number;
      damage: number;
      shots: number;
      shotIntervalMs: number;
      projectileSpeed: number;
      range: number;
      type: string;
    };
    slow_shot: {
      id: string;
      name: string;
      class: string;
      slot: string;
      unlockLevel: number;
      cdMs: number;
      staminaCost: number;
      damage: number;
      slowFactor: number;
      durationMs: number;
      projectileSpeed: number;
      range: number;
      type: string;
    };
    fireball: {
      id: string;
      name: string;
      class: string;
      slot: string;
      unlockLevel: number;
      cdMs: number;
      manaCost: number;
      damage: number;
      aoeRadius: number;
      projectileSpeed: number;
      range: number;
      type: string;
    };
    blink: {
      id: string;
      name: string;
      class: string;
      slot: string;
      unlockLevel: number;
      cdMs: number;
      manaCost: number;
      blinkDistance: number;
      type: string;
    };
  };
  enemies: {
    archetypes: {
      bruiser: {
        id: string;
        label: string;
        description: string;
        enabledInPrototype: boolean;
        stats: {
          maxHp: number;
          speed: number;
          detectRange: number;
          attackRange: number;
          attackCooldownMs: number;
          damage: number;
          xp: number;
          leashRange: number;
        };
        fsm: string[];
        behavior: string;
      };
      runner: {
        id: string;
        label: string;
        description: string;
        enabledInPrototype: boolean;
        stats: {
          maxHp: number;
          speed: number;
          detectRange: number;
          attackRange: number;
          attackCooldownMs: number;
          damage: number;
          xp: number;
          leashRange: number;
        };
        fsm: string[];
        behavior: string;
      };
      spitter: {
        id: string;
        label: string;
        description: string;
        enabledInPrototype: boolean;
        stats: {
          maxHp: number;
          speed: number;
          detectRange: number;
          attackRange: number;
          preferRangeMin: number;
          preferRangeMax: number;
          attackCooldownMs: number;
          damage: number;
          xp: number;
          leashRange: number;
        };
        fsm: string[];
        behavior: string;
        projectileSpeed: number;
      };
    };
    spawnConfig: {
      prototype: {
        type: string;
        count: number;
        respawnMs: number;
        spawnPoints: { x: number; y: number }[];
      };
    };
  };
  xpCurve: {
    mode: string;
    type: string;
    xpSource: string;
    levels: Array<{
      level: number;
      xpToNext: number;
      totalXp: number;
      unlocks: string[];
      note?: string;
    }>;
    rules: {
      xpOnEnemyDeath: boolean;
      xpOnChest: boolean;
      xpKeptOnDeath: boolean;
      levelUpHealToFull: boolean;
    };
  };
  starterGear: {
    melee: any[];
    ranged: any[];
    mage: any[];
  };
  lootTables: {
    prototype_chest: {
      chestId: string;
      rolls: number;
      respawnRule: string;
      entries: any[];
      totalWeight: number;
    };
  };
  respawn: {
    onDeathDelayMs: number;
    respawnAt: string;
    hpOnRespawn: string;
    xpKeptOnDeath: boolean;
    resourceResetOnRespawn: boolean;
  };
  match: {
    type: string;
    winCondition: string;
    mapId: string;
    mapSize: {
      width: number;
      height: number;
      tileSize: number;
    };
    playerSpawn: { x: number; y: number };
    chestCount: number;
    chestSpawnPoints: { x: number; y: number }[];
    chestInteraction: {
      type: string;
      proximityRange: number;
      key: string;
    };
  };
  itemStateEnum: string[];
  rarityEnum: string[];
  rarityMintRules: {
    common: boolean;
    uncommon: boolean;
    rare: boolean;
    epic: boolean;
  };
  village: {
    id: string;
    label: string;
    safeZone: { x: number; y: number; width: number; height: number };
    spawnPoint: { x: number; y: number };
    landmarks: any[];
    npcs: any[];
    waypoints: any[];
  };
}

// Export the loaded configuration
export const gameConfig: GameConfig = gameConfigJson;

// Export individual parts for easier access
export const lootTables = gameConfig.lootTables;
export const matchConfig = gameConfig.match;
export const heroClasses = gameConfig.hero.classes;
export const starterGear = gameConfig.starterGear;