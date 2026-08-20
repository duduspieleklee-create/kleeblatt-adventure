/**
 * Lightweight local player-name resolution for the multiplayer layer.
 *
 * There is no session context wired into the Phaser layer yet (auth lives in
 * React via `useMe` / `MeResponse`). To keep T3 free of UI/React imports and
 * resilient, we cache a generated guest name and allow the React/UI layer (T4)
 * to inject the authenticated display name via `setSessionPlayerName`.
 */

let cachedName: string | null = null;

/**
 * Override the local player name (e.g. from the authenticated session).
 * Call this before `MultiplayerManager.connect` for a stable identity.
 */
export function setSessionPlayerName(name: string): void {
  cachedName = name;
}

/**
 * Returns the resolved local player name. Uses an injected session name if one
 * was set, otherwise a stable per-session `Guest-xxxx` fallback.
 */
export function getSessionPlayerName(): string {
  if (cachedName && cachedName.trim().length > 0) return cachedName;
  cachedName = `Guest-${Math.random().toString(36).slice(2, 6)}`;
  return cachedName;
}
