/** Onboarding-Service: Pfad-Wahl + Intro-Fortschritt (docs/architecture/11-onboarding-journey.md) */

import { eq } from "drizzle-orm";
import { getDb, isDbAvailable } from "../db/client.js";
import { userOnboardings as onboardingTable } from "../db/schema.js";
import { memOnboardings } from "./memoryStore.js";
import type { OnboardingPath, OnboardingStatus } from "@kleeblatt/shared";

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    const rows = await db.select().from(onboardingTable).where(eq(onboardingTable.userId, userId)).limit(1);
    if (rows.length === 0) {
      return { path: null, introCompleted: false };
    }
    const row = rows[0]!;
    return {
      path: (row.path as OnboardingPath) ?? null,
      introCompleted: row.introCompleted,
    };
  }

  const mem = memOnboardings.get(userId);
  return mem ?? { path: null, introCompleted: false };
}

export async function choosePath(userId: string, path: OnboardingPath): Promise<OnboardingStatus> {
  const result: OnboardingStatus = { path, introCompleted: false };

  if (await isDbAvailable()) {
    const db = getDb()!;
    await db
      .insert(onboardingTable)
      .values({
        userId,
        path,
        introCompleted: false,
      })
      .onConflictDoUpdate({
        target: onboardingTable.userId,
        set: { path, updatedAt: new Date() },
      });
  } else {
    memOnboardings.set(userId, result);
  }

  return result;
}

export async function completeIntro(userId: string): Promise<OnboardingStatus> {
  const existing = await getOnboardingStatus(userId);
  const result: OnboardingStatus = { ...existing, introCompleted: true };

  if (await isDbAvailable()) {
    const db = getDb()!;
    await db
      .insert(onboardingTable)
      .values({
        userId,
        path: existing.path ?? "casual",
        introCompleted: true,
      })
      .onConflictDoUpdate({
        target: onboardingTable.userId,
        set: { introCompleted: true, updatedAt: new Date() },
      });
  } else {
    memOnboardings.set(userId, result);
  }

  return result;
}