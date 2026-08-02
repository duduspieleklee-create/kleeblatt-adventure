import { useEffect, useState } from "react";
import { fetchHealth } from "../lib/api";

export function useHealth() {
  const [health, setHealth] = useState<string>("…");

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth("API nicht erreichbar (npm run dev:api?)"));
  }, []);

  return health;
}
