import { useCallback, useEffect, useState } from "react";
import type { Hero, InventoryItem } from "@kleeblatt/shared";
import { fetchHero, fetchInventory } from "../lib/api";

export type HeroState =
  | { status: "loading" }
  | { status: "none" } // noch kein Held angelegt
  | { status: "ready"; hero: Hero; inventory: InventoryItem[] }
  | { status: "error"; message: string };

export function useHero() {
  const [state, setState] = useState<HeroState>({ status: "loading" });

  const refresh = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const heroResult = await fetchHero();
      if (!heroResult.ok) {
        setState({ status: "error", message: heroResult.message });
        return;
      }
      if (!heroResult.data) {
        setState({ status: "none" });
        return;
      }
      const inventoryResult = await fetchInventory();
      const inventory = inventoryResult.ok ? inventoryResult.data : [];
      setState({ status: "ready", hero: heroResult.data, inventory });
    } catch {
      setState({ status: "error", message: "API nicht erreichbar" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, refresh };
}
