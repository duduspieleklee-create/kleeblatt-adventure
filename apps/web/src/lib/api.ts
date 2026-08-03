/** Thin fetch helpers toward Game API (credentials for session cookie) */

import type { CreateHeroInput, Hero, HeroResponse, InventoryItem } from "@kleeblatt/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = API_URL.replace(/\/$/, "");
  return base ? `${base}${path}` : path;
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

/** Full URL for Google OAuth start (top-level navigation, not XHR). */
export function googleLoginUrl(): string {
  return apiUrl("/auth/google");
}

export function devLoginUrl(): string {
  return apiUrl("/auth/dev-login");
}
