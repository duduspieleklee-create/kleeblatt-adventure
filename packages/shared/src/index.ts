/**
 * @kleeblatt/shared
 * Shared types and constants for API + Web.
 */

export type {
  HeroClass,
  Hero,
  HeroClassInfo,
  CreateHeroInput,
  HeroResponse,
} from "./types/hero.js";
export { HERO_CLASSES, HERO_CLASS_OPTIONS, isHeroClass } from "./types/hero.js";

export type {
  ItemState,
  ItemSlot,
  ItemRarity,
  ItemTemplateRef,
  InventoryItem,
} from "./types/item.js";

export type {
  InventoryStacks,
  InventoryStacksResponse,
  PutInventoryStacksRequest,
} from "./types/inventory.js";

export type { HealthResponse, ApiErrorBody } from "./types/api.js";

export type { SessionUser, MeResponse } from "./types/user.js";
export {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  validatePassword,
  isEmailWellFormed,
} from "./lib/passwordRules.js";
export type { PasswordRequirement } from "./lib/passwordRules.js";
export type { WalletStatus, WalletResponse, WalletConnectRequest, WalletConnectResponse, WalletBalance, StakingInfo } from "./types/wallet.js";
export type { OnboardingPath, OnboardingStatus } from "./types/onboarding.js";

export type { GameBridgeEvents } from "./gameBridge.js";
export { gameBridge, TypedEmitter } from "./gameBridge.js";

export type { XpCurveLevel, XpState, ApplyXpResult } from "./rules/xp.js";
export { applyXp, DEFAULT_XP_CURVE } from "./rules/xp.js";

export { API_DEFAULT_PORT, WEB_DEFAULT_PORT, PROTOTYPE_MAP_ID } from "./constants/index.js";

/** HttpOnly session cookie name (game-config.json → auth.session.cookieName) */
export const SESSION_COOKIE_NAME = "kleeblatt_session";
