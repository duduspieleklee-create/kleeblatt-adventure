import { useCallback, useEffect, useState } from "react";
import type { OnboardingPath } from "@kleeblatt/shared";
import { fetchOnboardingStatus, chooseOnboardingPath as apiChoosePath, completeOnboarding as apiComplete } from "../lib/api";

export type OnboardingState =
  | { status: "loading" }
  | { status: "not_started" }
  | { status: "choice" }
  | { status: "intro"; path: OnboardingPath }
  | { status: "complete" };

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({ status: "loading" });

  const refresh = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const result = await fetchOnboardingStatus();
      if (!result.ok) {
        setState({ status: "not_started" });
        return;
      }
      const data = result.data;
      if (!data.path || !data.introCompleted) {
        if (data.path) {
          setState({ status: "intro", path: data.path });
        } else {
          setState({ status: "choice" });
        }
      } else {
        setState({ status: "complete" });
      }
    } catch {
      setState({ status: "not_started" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const choosePath = useCallback(async (path: OnboardingPath) => {
    const result = await apiChoosePath(path);
    if (result.ok) {
      setState({ status: "intro", path: result.data.path ?? path });
    }
  }, []);

  const completeIntro = useCallback(async () => {
    const result = await apiComplete();
    if (result.ok) {
      setState({ status: "complete" });
    }
  }, []);

  return { state, choosePath, completeIntro, refresh };
}