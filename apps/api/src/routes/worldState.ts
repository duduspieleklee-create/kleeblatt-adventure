/** World-State-Routen: GET/POST /world-state/:mapId (Map, Tiles, Enemies, Chests, NPCs) + Village-Endpoints. */

import { Hono } from "hono";
import type { AppVariables } from "../middleware/session.js";
import { WorldStateService } from "../services/worldState.js";

export const worldStateRoutes = new Hono<{ Variables: AppVariables }>();

worldStateRoutes.get("/world-state/:mapId", async (c) => {
  const mapId = c.req.param("mapId");
  try {
    const worldState = await WorldStateService.getAllWorldState(mapId);
    return c.json(worldState);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch world state" }, 500);
  }
});

worldStateRoutes.post("/world-state/:mapId/tiles", async (c) => {
  const mapId = c.req.param("mapId");
  const tiles = await c.req.json().catch(() => []);
  try {
    await WorldStateService.upsertMapTiles(mapId, tiles);
    return c.json({ success: true });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to update tiles" }, 500);
  }
});

worldStateRoutes.post("/world-state/:mapId/enemies", async (c) => {
  const mapId = c.req.param("mapId");
  const enemies = await c.req.json().catch(() => []);
  try {
    await WorldStateService.upsertEnemyPositions(mapId, enemies);
    return c.json({ success: true });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to update enemies" }, 500);
  }
});

worldStateRoutes.post("/world-state/:mapId/chests", async (c) => {
  const mapId = c.req.param("mapId");
  const chests = await c.req.json().catch(() => []);
  try {
    await WorldStateService.upsertChestStates(mapId, chests);
    return c.json({ success: true });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to update chests" }, 500);
  }
});

worldStateRoutes.post("/world-state/:mapId/npcs", async (c) => {
  const mapId = c.req.param("mapId");
  const npcs = await c.req.json().catch(() => []);
  try {
    await WorldStateService.upsertNpcPositions(mapId, npcs);
    return c.json({ success: true });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to update npcs" }, 500);
  }
});

// Village-specific endpoints (Welcome Village/Camp starting area)
worldStateRoutes.get("/world-state/village", async (c) => {
  try {
    const village = await WorldStateService.getVillageState();
    return c.json(village);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch village state" }, 500);
  }
});

worldStateRoutes.post("/world-state/village/visit", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const userId = (body as { userId?: string }).userId ?? "anonymous";
  try {
    const visited = await WorldStateService.trackVillageVisit(userId);
    return c.json({ success: true, visited });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to track visit" }, 500);
  }
});
