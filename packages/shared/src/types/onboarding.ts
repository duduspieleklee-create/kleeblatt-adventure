/** Onboarding types (docs/architecture/11-onboarding-journey.md) */

export type OnboardingPath = "casual" | "expert";

export interface OnboardingStatus {
  /** null wenn noch nicht gewählt */
  path: OnboardingPath | null;
  /** Intro abgeschlossen? */
  introCompleted: boolean;
}