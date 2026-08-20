import { useEffect, useState } from "react";
import { gameBridge } from "@kleeblatt/shared";

export interface SessionContext {
  providerType: "email" | "google" | "wallet" | "guest";
  profile: {
    userId: string;
    username: string | null;
    walletAddress: string | null;
    level: number;
    gold: number;
  } | null;
  walletLinked: boolean;
  isGuest: boolean;
}

export type SessionContextState =
  | { status: "pending" }
  | { status: "ready"; context: SessionContext };

export function useSessionContext(): SessionContextState {
  const [state, setState] = useState<SessionContextState>({ status: "pending" });

  useEffect(() => {
    const handler = (ctx: SessionContext): void => {
      setState({ status: "ready", context: ctx });
    };
    gameBridge.on("session:initialized", handler);
    return () => {
      gameBridge.off("session:initialized", handler);
    };
  }, []);

  return state;
}
