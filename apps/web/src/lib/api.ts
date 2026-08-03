/** Thin fetch helpers toward Game API (credentials for session cookie) */

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
      ...(init?.headers ?? {}),
    },
  });
}

export async function fetchHealth(): Promise<string> {
  const res = await apiFetch("/health");
  const data = (await res.json()) as { status?: string };
  if (data.status === "ok") return "API online";
  return JSON.stringify(data);
}

export async function fetchMe(): Promise<
  | { ok: true; data: import("@kleeblatt/shared").MeResponse }
  | { ok: false; status: number }
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

/** Full URL for Google OAuth start (top-level navigation, not XHR). */
export function googleLoginUrl(): string {
  return apiUrl("/auth/google");
}

export function devLoginUrl(): string {
  return apiUrl("/auth/dev-login");
}
