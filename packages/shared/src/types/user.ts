/** Auth / session user shapes (P1) */

import type { Hero } from "./hero.js";

export interface SessionUser {
  userId: string;
  email: string;
  displayName: string | null;
  picture: string | null;
  /** true for temporary "play as guest" accounts that can be upgraded later. */
  guest: boolean;
}

export interface MeResponse {
  userId: string;
  email: string;
  displayName: string | null;
  picture: string | null;
  /** null, solange kein Held erstellt wurde (P2) */
  hero: Hero | null;
  /** true for temporary guest accounts (see "Upgrade to Full Account"). */
  guest: boolean;
}
