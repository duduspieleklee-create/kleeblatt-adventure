/** User-Service: Postgres (falls erreichbar), sonst In-Memory (Prototyp-Fallback). */

import type { SessionUser } from "@kleeblatt/shared";
import { eq } from "drizzle-orm";
import { getDb, isDbAvailable } from "../db/client.js";
import { usersOldBackup as usersTable, type UserRow } from "../db/schema.js";
import { memPasswordHashes, memUsers } from "./memoryStore.js";
import { newId } from "../lib/ids.js";
import { verifyPassword } from "../lib/password.js";

function toSessionUser(row: UserRow): SessionUser {
  return {
    userId: row.id,
    email: row.email,
    displayName: row.displayName,
    picture: row.picture,
  };
}

/** Create a user that authenticates by email + password (never a Google id). */
export async function createEmailUser(input: {
  email: string;
  passwordHash: string;
}): Promise<SessionUser> {
  const userId = newId("usr");
  const displayName = input.email.split("@")[0] ?? null;

  if (await isDbAvailable()) {
    const db = getDb()!;
    const row: UserRow = {
      id: userId,
      email: input.email,
      displayName,
      picture: null,
      passwordHash: input.passwordHash,
      createdAt: new Date(),
    };
    await db.insert(usersTable).values(row);
    return toSessionUser(row);
  }

  const user: SessionUser = { userId, email: input.email, displayName, picture: null };
  memUsers.set(userId, user);
  memPasswordHashes.set(userId, input.passwordHash);
  return user;
}

/** Lookup a user by email (case-insensitive). Used for login + availability checks. */
export async function getUserByEmail(email: string): Promise<SessionUser | undefined> {
  const key = email.toLowerCase();

  if (await isDbAvailable()) {
    const db = getDb()!;
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    return rows[0] ? toSessionUser(rows[0]) : undefined;
  }

  for (const u of memUsers.values()) {
    if (u.email.toLowerCase() === key) return u;
  }
  return undefined;
}

/** Read the stored password hash for a user (null if none / Google-only account). */
export async function getPasswordHash(userId: string): Promise<string | null> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    const rows = await db
      .select({ passwordHash: usersTable.passwordHash })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    return rows[0]?.passwordHash ?? null;
  }
  return memPasswordHashes.get(userId) ?? null;
}

/**
 * Verify email + password credentials.
 * Returns the SessionUser on success, or null if the user is unknown,
 * has no password (Google-only), or the password doesn't match.
 */
export async function verifyEmailPassword(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const hash = await getPasswordHash(user.userId);
  if (!hash) return null;
  const ok = await verifyPassword(password, hash);
  return ok ? user : null;
}

export async function upsertGoogleUser(input: {
  googleId: string;
  email: string;
  displayName: string | null;
  picture: string | null;
}): Promise<SessionUser> {
  const userId = `usr_${input.googleId}`;

  if (await isDbAvailable()) {
    const db = getDb()!;
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const row: UserRow = {
      id: userId,
      email: input.email,
      displayName: input.displayName ?? existing[0]?.displayName ?? null,
      picture: input.picture ?? existing[0]?.picture ?? null,
      passwordHash: existing[0]?.passwordHash ?? null,
      createdAt: existing[0]?.createdAt ?? new Date(),
    };
    if (existing.length > 0) {
      await db
        .update(usersTable)
        .set({ email: row.email, displayName: row.displayName, picture: row.picture })
        .where(eq(usersTable.id, userId));
    } else {
      await db.insert(usersTable).values(row);
    }
    return toSessionUser(row);
  }

  const existing = memUsers.get(userId);
  const user: SessionUser = {
    userId,
    email: input.email,
    displayName: input.displayName ?? existing?.displayName ?? null,
    picture: input.picture ?? existing?.picture ?? null,
  };
  memUsers.set(userId, user);
  return user;
}

export async function getUser(userId: string): Promise<SessionUser | undefined> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    return rows[0] ? toSessionUser(rows[0]) : undefined;
  }
  return memUsers.get(userId);
}
