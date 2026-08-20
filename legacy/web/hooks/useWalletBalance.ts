import { useCallback, useEffect, useState } from "react";
import { fetchWalletBalance } from "../lib/api";

export interface WalletBalanceState {
  address: string;
  ethBalance: string;
  imxBalance: string;
  loading: boolean;
}

export function useWalletBalance() {
  const [state, setState] = useState<WalletBalanceState>({
    address: "",
    ethBalance: "0",
    imxBalance: "0",
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const result = await fetchWalletBalance();
      if (result.ok) {
        setState({
          address: result.data.address,
          ethBalance: result.data.ethBalance,
          imxBalance: result.data.imxBalance,
          loading: false,
        });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}