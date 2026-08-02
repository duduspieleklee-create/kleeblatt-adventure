/** Shared types for prototype – expand with rule-engine types from docs/architecture/19 */

export type HeroClass = "mage" | "ranged" | "melee";

export type ItemState =
  | "web2"
  | "pending_secure"
  | "secured"
  | "active_in_game"
  | "self_custody";

export interface HealthResponse {
  status: string;
  service?: string;
  time?: string;
}
