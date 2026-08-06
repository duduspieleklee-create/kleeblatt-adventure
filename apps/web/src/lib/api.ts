/** Thin fetch helpers toward Game API (credentials for session cookie) */

import type {
  CreateHeroInput,
  Hero,
  HeroResponse,
  InventoryItem,
  InventoryStacks,
  InventoryStacksResponse,
  OnboardingPath,
  OnboardingStatus,
} from "@kleeblatt/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "";
// Default: /api-Prefix (Doku-Architektur Web → /api/* → nginx/vite → API,
// siehe DEPLOYMENT.md). VITE_API_URL (z.B. http://localhost:4000) überschreibt.
const API_PREFIX = API_URL ? API_URL.replace(/\/$/, "") : "/api";

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_PREFIX}${path}`;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const maybe = body as { error?: { code?: string; message?: string; retryable?: boolean } };
    if (maybe.error?.message) return maybe.error.message;
  }
  return fallback;
}

export type ApiResult<T> =
  { ok: true; data: T; status: number } | { ok: false; status: number; message: string };

export async function fetchHealth(): Promise<string> {
  const res = await apiFetch("/health");
  const data = (await res.json()) as { status?: string };
  if (data.status === "ok") return "API online";
  return JSON.stringify(data);
}

export async function fetchMe(): Promise<
  { ok: true; data: import("@kleeblatt/shared").MeResponse } | { ok: false; status: number }
> {
  const res = await apiFetch("/me");
  if (res.status === 401) return { ok: false, status: 401 };
  if (!res.ok) return { ok: false, status: res.status };
  const data = (await res.json()) as import("@kleeblatt/shared").MeResponse;
  return { ok: true, data };
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

export async function fetchHero(): Promise<ApiResult<Hero | null>> {
  const res = await apiFetch("/hero");
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return {
      ok: false,
      status: res.status,
      message: errorMessage(body, "Held konnte nicht geladen werden."),
    };
  return { ok: true, status: res.status, data: body as Hero | null };
}

export async function createHero(input: CreateHeroInput): Promise<ApiResult<HeroResponse>> {
  const res = await apiFetch("/hero", { method: "POST", body: JSON.stringify(input) });
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return {
      ok: false,
      status: res.status,
      message: errorMessage(body, "Held konnte nicht erstellt werden."),
    };
  return { ok: true, status: res.status, data: body as HeroResponse };
}

export async function fetchInventory(): Promise<ApiResult<InventoryItem[]>> {
  const res = await apiFetch("/inventory");
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return {
      ok: false,
      status: res.status,
      message: errorMessage(body, "Inventar konnte nicht geladen werden."),
    };
  const data = body as { items?: InventoryItem[] };
  return { ok: true, status: res.status, data: data.items ?? [] };
}

/** Material/consumable stacks (Rucksack). */
export async function fetchInventoryStacks(): Promise<ApiResult<InventoryStacksResponse>> {
  const res = await apiFetch("/inventory/stacks");
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return {
      ok: false,
      status: res.status,
      message: errorMessage(body, "Stacks konnten nicht geladen werden."),
    };
  return { ok: true, status: res.status, data: body as InventoryStacksResponse };
}

export async function putInventoryStacks(
  stacks: InventoryStacks,
): Promise<ApiResult<InventoryStacksResponse>> {
  const res = await apiFetch("/inventory/stacks", {
    method: "PUT",
    body: JSON.stringify({ stacks }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return {
      ok: false,
      status: res.status,
      message: errorMessage(body, "Stacks konnten nicht gespeichert werden."),
    };
  return { ok: true, status: res.status, data: body as InventoryStacksResponse };
}

export async function equipItem(
  itemId: string,
): Promise<ApiResult<{ hero: Hero; items: InventoryItem[] }>> {
  return inventoryAction(`/inventory/${encodeURIComponent(itemId)}/equip`);
}

export async function unequipItem(
  itemId: string,
): Promise<ApiResult<{ hero: Hero; items: InventoryItem[] }>> {
  return inventoryAction(`/inventory/${encodeURIComponent(itemId)}/unequip`);
}

async function inventoryAction(
  path: string,
): Promise<ApiResult<{ hero: Hero; items: InventoryItem[] }>> {
  const res = await apiFetch(path, { method: "POST" });
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return { ok: false, status: res.status, message: errorMessage(body, "Aktion fehlgeschlagen.") };
  return { ok: true, status: res.status, data: body as { hero: Hero; items: InventoryItem[] } };
}

export async function fetchWallet(): Promise<import("@kleeblatt/shared").WalletResponse | null> {
  const res = await apiFetch("/wallet");
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function connectWallet(
  input: import("@kleeblatt/shared").WalletConnectRequest,
): Promise<import("@kleeblatt/shared").WalletConnectResponse | null> {
  const res = await apiFetch("/wallet/connect", { method: "POST", body: JSON.stringify(input) });
  if (!res.ok) return null;
  return res.json();
}

export async function disconnectWallet(): Promise<import("@kleeblatt/shared").WalletResponse | null> {
  const res = await apiFetch("/wallet/disconnect", { method: "POST" });
  if (!res.ok) return null;
  return res.json();
}

/** Full URL for Google OAuth start (top-level navigation, not XHR). */
export function googleLoginUrl(): string {
  return apiUrl("/auth/google");
}

export function devLoginUrl(): string {
  return apiUrl("/auth/dev-login");
}

export interface MatchResultResponse {
  matchId: string;
  xpGained: number;
  newLevel: number;
  xp: number;
  xpToNext: number | null;
  leveledUp: boolean;
  hero: Hero;
}

/** POST /match/result – XP + Level-Up server-authoritativ verrechnen. */
export async function submitMatchResult(input: {
  matchId: string;
  enemiesKilled: number;
  chestsOpened: number;
}): Promise<ApiResult<MatchResultResponse>> {
  const res = await apiFetch("/match/result", { method: "POST", body: JSON.stringify(input) });
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return {
      ok: false,
      status: res.status,
      message: errorMessage(body, "Match-Ergebnis konnte nicht gespeichert werden."),
    };
  return { ok: true, status: res.status, data: body as MatchResultResponse };
}

export async function fetchOnboardingStatus(): Promise<ApiResult<OnboardingStatus>> {
  const res = await apiFetch("/onboarding/status");
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return { ok: false, status: res.status, message: errorMessage(body, "Onboarding-Status konnte nicht geladen werden.") };
  return { ok: true, status: res.status, data: body as OnboardingStatus };
}

export async function fetchWalletBalance(): Promise<ApiResult<import("@kleeblatt/shared").WalletBalance>> {
  const res = await apiFetch("/wallet/balance");
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return { ok: false, status: res.status, message: errorMessage(body, "Wallet-Balance konnte nicht geladen werden.") };
  return { ok: true, status: res.status, data: body as import("@kleeblatt/shared").WalletBalance };
}

export async function walletAuth(address: string): Promise<ApiResult<{ ok: boolean; redirect: string }>> {
  const res = await apiFetch("/wallet/auth", { method: "POST", body: JSON.stringify({ address }) });
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return { ok: false, status: res.status, message: errorMessage(body, "Wallet-Login fehlgeschlagen.") };
  return { ok: true, status: res.status, data: body as { ok: boolean; redirect: string } };
}

export async function chooseOnboardingPath(path: OnboardingPath): Promise<ApiResult<OnboardingStatus>> {
  const res = await apiFetch("/onboarding/path", { method: "POST", body: JSON.stringify({ path }) });
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return { ok: false, status: res.status, message: errorMessage(body, "Pfad-Wahl fehlgeschlagen.") };
  return { ok: true, status: res.status, data: body as OnboardingStatus };
}

export async function completeOnboarding(): Promise<ApiResult<OnboardingStatus>> {
  const res = await apiFetch("/onboarding/complete", { method: "POST" });
  const body = await res.json().catch(() => null);
  if (!res.ok)
    return { ok: false, status: res.status, message: errorMessage(body, "Intro konnte nicht abgeschlossen werden.") };
  return { ok: true, status: res.status, data: body as OnboardingStatus };
}

/**
 * Connect wallet using Immutable SDK
 */
export async function connectImmutableWallet(
  input: import("@kleeblatt/shared").WalletConnectRequest,
): Promise<import("@kleeblatt/shared").WalletConnectResponse | null> {
  const res = await apiFetch("/wallet/connect-immutable", { method: "POST", body: JSON.stringify(input) });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Get deposit address using Immutable SDK
 */
export async function getImmutableDepositAddress(): Promise<string | null> {
  const res = await apiFetch("/wallet/deposit-address-immutable");
  if (!res.ok) return null;
  const data = await res.json();
  return data.depositAddress || null;
}

/**
 * Get deposit address for wallet
 */
export async function getWalletDepositAddress(): Promise<string | null> {
  const res = await apiFetch("/wallet/deposit-address");
  if (!res.ok) return null;
  const data = await res.json();
  return data.depositAddress || null;
}
