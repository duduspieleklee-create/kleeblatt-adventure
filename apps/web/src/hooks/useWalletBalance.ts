import { useCallback, useEffect, useState } from "react";
import type { WalletBalance } from "@kleeblatt/shared";
import { fetchWalletBalance } from "../lib/api";

export type WalletBalanceState =
  | { status: "loading" }
  | { status: "ready"; data: WalletBalance }
  | { status: "error"; message: string };

export function useWalletBalance(enabled: boolean) {
  const [state, setState] = useState<WalletBalanceState>({ status: "loading" });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({ status: "loading" });
      return;
    }

    setState({ status: "loading" });
    const result = await fetchWalletBalance();
    if (result.ok) {
      setState({ status: "ready", data: result.data });
    } else {
      setState({ status: "error", message: result.message });
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, refresh };
}
