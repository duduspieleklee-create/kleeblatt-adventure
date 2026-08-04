/** User-Service: Postgres (falls erreichbar), sonst In-Memory (Prototyp-Fallback). */

import type { SessionUser } from "@kleeblatt/shared";
import { eq } from "drizzle-orm";
import { getDb, isDbAvailable } from "../db/client.js";
import { users as usersTable, type UserRow } from "../db/schema.js";
import { memUsers } from "./memoryStore.js";

function toSessionUser(row: UserRow): SessionUser {
  return {
    userId: row.id,
    email: row.email,
    displayName: row.displayName,
    picture: row.picture,
  };
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
