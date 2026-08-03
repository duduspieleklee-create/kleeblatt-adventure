import type { SessionUser } from "@kleeblatt/shared";

/** In-memory user registry for P1 (replaced by Postgres in later phases). */
const users = new Map<string, SessionUser>();

export function upsertGoogleUser(input: {
  googleId: string;
  email: string;
  displayName: string | null;
  picture: string | null;
}): SessionUser {
  const userId = `usr_${input.googleId}`;
  const existing = users.get(userId);
  const user: SessionUser = {
    userId,
    email: input.email,
    displayName: input.displayName ?? existing?.displayName ?? null,
    picture: input.picture ?? existing?.picture ?? null,
  };
  users.set(userId, user);
  return user;
}

export function getUser(userId: string): SessionUser | undefined {
  return users.get(userId);
}
