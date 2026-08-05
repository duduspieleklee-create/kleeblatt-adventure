import { useEffect, useRef } from "react";
import {
  createInventoryPersistenceController,
  type InventoryPersistenceController,
  type LoadInventoryResult,
} from "../lib/inventoryPersistence";

/**
 * Mount while the Phaser game is alive.
 * Loads stacks/equipment, hydrates Phaser, debounces saves on inventory:updated.
 */
export function useInventoryPersistence(enabled = true): {
  controller: InventoryPersistenceController | null;
  lastLoad: LoadInventoryResult | null;
} {
  const controllerRef = useRef<InventoryPersistenceController | null>(null);
  const lastLoadRef = useRef<LoadInventoryResult | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = createInventoryPersistenceController();
    controllerRef.current = controller;

    void controller.loadAndHydrate().then((result) => {
      lastLoadRef.current = result;
    });

    return () => {
      void controller.flush().finally(() => controller.dispose());
      controllerRef.current = null;
    };
  }, [enabled]);

  return {
    controller: controllerRef.current,
    lastLoad: lastLoadRef.current,
  };
}
