/** Thin fetch helpers toward Game API */

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = API_URL.replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

export async function fetchHealth(): Promise<string> {
  const res = await fetch(apiUrl("/health"));
  const data = (await res.json()) as { status?: string };
  if (data.status === "ok") return "API online";
  return JSON.stringify(data);
}
