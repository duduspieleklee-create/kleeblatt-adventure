import { useCallback, useEffect, useState } from "react";
import type { MeResponse } from "@kleeblatt/shared";
import { fetchMe, logout as apiLogout } from "../lib/api";

export type MeState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; me: MeResponse }
  | { status: "error"; message: string };

export function useMe() {
  const [state, setState] = useState<MeState>({ status: "loading" });

  const refresh = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const result = await fetchMe();
      if (result.ok) {
        setState({ status: "authenticated", me: result.data });
      } else if (result.status === 401) {
        setState({ status: "anonymous" });
      } else {
        setState({ status: "error", message: `HTTP ${result.status}` });
      }
    } catch {
      setState({ status: "error", message: "API nicht erreichbar" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiLogout();
    setState({ status: "anonymous" });
  }, []);

  return { state, refresh, logout };
}
