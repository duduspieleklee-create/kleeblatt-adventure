/**
 * Inventory persistence layer (React side only).
 *
 * Architecture rule (docs/architecture/14-phaser-react-bridge.md):
 * - Phaser never calls the API.
 * - React loads / saves and hydrates Phaser via gameBridge.
 *
 * Covers:
 * - Equipment items → GET /inventory (server)
 * - Material/consumable stacks → GET|PUT /inventory/stacks (server)
 * - Offline / unauthenticated → localStorage fallback for stacks
 */

import type { InventoryItem, InventoryStacks } from "@kleeblatt/shared";
import { gameBridge } from "@kleeblatt/shared";
import {
  fetchInventory,
  fetchInventoryStacks,
  putInventoryStacks,
} from "./api";

const STORAGE_KEY = "kleeblatt.inventory.stacks";
const DEFAULT_DEBOUNCE_MS = 800;

export type PersistenceSource = "api" | "local" | "empty";

export interface LoadInventoryResult {
  equipment: InventoryItem[];
  stacks: InventoryStacks;
  source: PersistenceSource;
}

function readLocalStacks(): InventoryStacks {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: InventoryStacks = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) {
        out[k] = Math.floor(v);
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeLocalStacks(stacks: InventoryStacks): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stacks));
  } catch {
    // quota / private mode — ignore
  }
}

function sanitizeStacks(stacks: InventoryStacks): InventoryStacks {
  const out: InventoryStacks = {};
  for (const [k, v] of Object.entries(stacks)) {
    if (typeof k !== "string" || !k) continue;
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    const n = Math.floor(v);
    if (n > 0) out[k] = n;
  }
  return out;
}

/** Load equipment + stacks. Prefer API; fall back to localStorage for stacks. */
export async function loadInventory(): Promise<LoadInventoryResult> {
  const equipmentRes = await fetchInventory();
  const equipment = equipmentRes.ok ? equipmentRes.data : [];

  const stacksRes = await fetchInventoryStacks();
  if (stacksRes.ok) {
    const stacks = sanitizeStacks(stacksRes.data.stacks);
    writeLocalStacks(stacks); // mirror for offline
    return { equipment, stacks, source: "api" };
  }

  // 401 or API down → local fallback for stacks only
  if (stacksRes.status === 401 || stacksRes.status >= 500 || stacksRes.status === 0) {
    const stacks = readLocalStacks();
    return {
      equipment,
      stacks,
      source: Object.keys(stacks).length ? "local" : "empty",
    };
  }

  return { equipment, stacks: {}, source: "empty" };
}

/** Persist stacks: always write local; try API when session exists. */
export async function saveStacks(
  stacks: InventoryStacks,
): Promise<{ ok: boolean; source: PersistenceSource }> {
  const clean = sanitizeStacks(stacks);
  writeLocalStacks(clean);

  const res = await putInventoryStacks(clean);
  if (res.ok) return { ok: true, source: "api" };
  if (res.status === 401) return { ok: true, source: "local" }; // local is enough offline
  return { ok: false, source: "local" };
}

/**
 * Push stacks into the active Phaser game via bridge.
 * Phaser InventoryPlugin / InventorySystem should listen for `inventory:hydrate`.
 */
export function hydratePhaserStacks(stacks: InventoryStacks): void {
  gameBridge.emit("inventory:hydrate", { stacks: sanitizeStacks(stacks) });
}

export interface InventoryPersistenceController {
  /** Load from server/local and hydrate Phaser. */
  loadAndHydrate: () => Promise<LoadInventoryResult>;
  /** Debounced save triggered by Phaser inventory:updated. */
  scheduleSave: (stacks: InventoryStacks) => void;
  /** Flush pending save immediately (e.g. match exit / unmount). */
  flush: () => Promise<void>;
  /** Tear down listeners / timers. */
  dispose: () => void;
  getLastStacks: () => InventoryStacks;
  getEquipment: () => InventoryItem[];
}

/**
 * React-owned controller: listens to Phaser inventory updates and persists them.
 * Call once while the Phaser game is alive (e.g. MatchPage mount).
 */
export function createInventoryPersistenceController(
  options: { debounceMs?: number } = {},
): InventoryPersistenceController {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  let lastStacks: InventoryStacks = {};
  let equipment: InventoryItem[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: InventoryStacks | null = null;
  let disposed = false;

  const onUpdated = (payload: { stacks: InventoryStacks }) => {
    if (disposed) return;
    lastStacks = sanitizeStacks(payload.stacks);
    scheduleSave(lastStacks);
  };

  // Phaser → React (after plugin/system emits inventory:updated)
  gameBridge.on("inventory:updated", onUpdated);

  function scheduleSave(stacks: InventoryStacks): void {
    pending = stacks;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const toSave = pending;
      pending = null;
      if (toSave) void saveStacks(toSave);
    }, debounceMs);
  }

  async function flush(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending) {
      const toSave = pending;
      pending = null;
      await saveStacks(toSave);
    }
  }

  return {
    async loadAndHydrate() {
      const result = await loadInventory();
      equipment = result.equipment;
      lastStacks = result.stacks;
      hydratePhaserStacks(result.stacks);
      return result;
    },
    scheduleSave,
    flush,
    dispose() {
      disposed = true;
      gameBridge.off("inventory:updated", onUpdated);
      if (timer) clearTimeout(timer);
      timer = null;
    },
    getLastStacks: () => ({ ...lastStacks }),
    getEquipment: () => [...equipment],
  };
}
