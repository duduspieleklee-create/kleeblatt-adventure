import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import {
  worldMaps,
  worldMapTiles,
  worldEnemies,
  worldChests,
  worldNpcPositions,
} from "../db/schema.js";
import type {
  WorldMap,
  WorldMapTile,
  WorldEnemy,
  WorldChest,
  WorldNpcPosition,
} from "@kleeblatt/shared";

/** Returns the DB client or throws when Postgres is unavailable. */
function requireDb(): NonNullable<ReturnType<typeof getDb>> {
  const db = getDb();
  if (!db) {
    throw new Error(
      "Postgres nicht verfuegbar (DATABASE_URL fehlt) – World-State braucht eine DB.",
    );
  }
  return db;
}

export class WorldStateService {
  // Create or update a world map
  static async upsertWorldMap(
    mapData: Omit<WorldMap, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const existingMap = await requireDb()
      .select()
      .from(worldMaps)
      .where(eq(worldMaps.mapId, mapData.mapId))
      .limit(1);

    if (existingMap.length > 0) {
      // Update existing map
      const result = await requireDb()
        .update(worldMaps)
        .set({
          name: mapData.name,
          width: mapData.width,
          height: mapData.height,
          tileSize: mapData.tileSize,
          updatedAt: new Date(),
        })
        .where(eq(worldMaps.mapId, mapData.mapId))
        .returning({ id: worldMaps.id });

      return result[0]!.id;
    } else {
      // Create new map
      const result = await requireDb()
        .insert(worldMaps)
        .values({
          ...mapData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: worldMaps.id });

      return result[0]!.id;
    }
  }

  // Get a world map by map ID
  static async getWorldMap(mapId: string): Promise<WorldMap | null> {
    const result = await requireDb()
      .select()
      .from(worldMaps)
      .where(eq(worldMaps.mapId, mapId))
      .limit(1);

    return result.length > 0 ? (result[0] as WorldMap) : null;
  }

  // Create or update map tiles
  static async upsertMapTiles(
    mapId: string,
    tiles: Omit<WorldMapTile, "id" | "createdAt">[],
  ): Promise<void> {
    // First delete existing tiles for this map
    await requireDb().delete(worldMapTiles).where(eq(worldMapTiles.mapId, mapId));

    // Then insert new tiles
    const tileValues = tiles.map((tile) => ({
      ...tile,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      mapId,
    }));

    await requireDb().insert(worldMapTiles).values(tileValues);
  }

  // Get map tiles for a specific map
  static async getMapTiles(mapId: string): Promise<WorldMapTile[]> {
    return await requireDb().select().from(worldMapTiles).where(eq(worldMapTiles.mapId, mapId));
  }

  // Create or update enemy positions
  static async upsertEnemyPositions(
    mapId: string,
    enemies: Omit<WorldEnemy, "id" | "createdAt" | "updatedAt">[],
  ): Promise<void> {
    // First delete existing enemies for this map
    await requireDb().delete(worldEnemies).where(eq(worldEnemies.mapId, mapId));

    // Then insert new enemies
    const enemyValues = enemies.map((enemy) => ({
      ...enemy,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      mapId,
    }));

    await requireDb().insert(worldEnemies).values(enemyValues);
  }

  // Get enemy positions for a specific map
  static async getEnemyPositions(mapId: string): Promise<WorldEnemy[]> {
    return await requireDb().select().from(worldEnemies).where(eq(worldEnemies.mapId, mapId));
  }

  // Create or update chest states
  static async upsertChestStates(
    mapId: string,
    chests: Omit<WorldChest, "id" | "createdAt" | "updatedAt">[],
  ): Promise<void> {
    // First delete existing chests for this map
    await requireDb().delete(worldChests).where(eq(worldChests.mapId, mapId));

    // Then insert new chests
    const chestValues = chests.map((chest) => ({
      ...chest,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      mapId,
    }));

    await requireDb().insert(worldChests).values(chestValues);
  }

  // Get chest states for a specific map
  static async getChestStates(mapId: string): Promise<WorldChest[]> {
    const rows = await requireDb().select().from(worldChests).where(eq(worldChests.mapId, mapId));
    return rows.map(
      (row) => ({ ...row, itemTemplateId: row.itemTemplateId ?? undefined }) as WorldChest,
    );
  }

  // Update NPC positions
  static async upsertNpcPositions(
    mapId: string,
    npcs: Omit<WorldNpcPosition, "id" | "createdAt" | "updatedAt">[],
  ): Promise<void> {
    // First delete existing NPCs for this map
    await requireDb().delete(worldNpcPositions).where(eq(worldNpcPositions.mapId, mapId));

    // Then insert new NPCs
    const npcValues = npcs.map((npc) => ({
      ...npc,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      mapId,
    }));

    await requireDb().insert(worldNpcPositions).values(npcValues);
  }

  // Get NPC positions for a specific map
  static async getNpcPositions(mapId: string): Promise<WorldNpcPosition[]> {
    return await requireDb()
      .select()
      .from(worldNpcPositions)
      .where(eq(worldNpcPositions.mapId, mapId));
  }

  // Get all persistent world state for a map
  static async getAllWorldState(mapId: string): Promise<{
    map: WorldMap | null;
    tiles: WorldMapTile[];
    enemies: WorldEnemy[];
    chests: WorldChest[];
    npcs: WorldNpcPosition[];
  }> {
    const [map, tiles, enemies, chests, npcs] = await Promise.all([
      this.getWorldMap(mapId),
      this.getMapTiles(mapId),
      this.getEnemyPositions(mapId),
      this.getChestStates(mapId),
      this.getNpcPositions(mapId),
    ]);

    return {
      map,
      tiles,
      enemies,
      chests,
      npcs,
    };
  }

  // Reset world state for a map (useful for testing or resetting progress)
  static async resetWorldState(mapId: string): Promise<void> {
    await requireDb().delete(worldMapTiles).where(eq(worldMapTiles.mapId, mapId));
    await requireDb().delete(worldEnemies).where(eq(worldEnemies.mapId, mapId));
    await requireDb().delete(worldChests).where(eq(worldChests.mapId, mapId));
    await requireDb().delete(worldNpcPositions).where(eq(worldNpcPositions.mapId, mapId));
  }

  // Village-specific methods
  static async getOrCreateVillageMap(): Promise<WorldMap> {
    const villageMapId = "village-map";

    // Try to get existing village map
    const existingMap = await this.getWorldMap(villageMapId);

    if (existingMap) {
      return existingMap;
    }

    // Create new village map
    const newMapId = await this.upsertWorldMap({
      mapId: villageMapId,
      name: "Welcome Village",
      width: 800,
      height: 800,
      tileSize: 32,
    });

    // Return the created map
    const createdMap = await this.getWorldMap(villageMapId);
    return (
      createdMap || {
        id: newMapId,
        mapId: villageMapId,
        name: "Welcome Village",
        width: 800,
        height: 800,
        tileSize: 32,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  static async getVillageState(): Promise<{
    map: WorldMap;
    tiles: WorldMapTile[];
    enemies: WorldEnemy[];
    chests: WorldChest[];
    npcs: WorldNpcPosition[];
  }> {
    // Get or create the village map
    const villageMap = await this.getOrCreateVillageMap();

    // For now, return empty arrays - in future this would load from DB
    return {
      map: villageMap,
      tiles: [],
      enemies: [],
      chests: [],
      npcs: [
        {
          id: "npc-001",
          npcId: "merchant",
          x: 300,
          y: 300,
          mapId: villageMap.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "npc-002",
          npcId: "quest-giver",
          x: 400,
          y: 400,
          mapId: villageMap.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
  }

  static async trackVillageVisit(_userId: string): Promise<boolean> {
    // In a real implementation, this would update a user visitation flag
    // For now, just return true
    return true;
  }
}
