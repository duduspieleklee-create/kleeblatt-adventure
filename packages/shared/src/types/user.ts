/** Auth / session user shapes (P1) */

export interface SessionUser {
  userId: string;
  email: string;
  displayName: string | null;
  picture: string | null;
}

export interface MeResponse {
  userId: string;
  email: string;
  displayName: string | null;
  picture: string | null;
  /** null until P2 hero creation */
  hero: {
    heroName: string;
    class: "mage" | "ranged" | "melee";
    level: number;
    xp: number;
  } | null;
}
