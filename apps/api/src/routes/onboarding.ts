/** Onboarding-Routen: Pfad-Wahl + Intro-Fortschritt (docs/architecture/11-onboarding-journey.md) */

import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { getOnboardingStatus, choosePath, completeIntro } from "../services/onboarding.js";
import type { OnboardingPath } from "@kleeblatt/shared";

export const onboardingRoutes = new Hono<{ Variables: AppVariables }>();

const pathSchema = z.object({
  path: z.enum(["casual", "expert"]),
});

/** GET /onboarding/status – aktuelles Onboarding des Users */
onboardingRoutes.get("/onboarding/status", requireAuth, async (c) => {
  const user = c.get("user")!;
  const status = await getOnboardingStatus(user.userId);
  return c.json(status);
});

/** POST /onboarding/path – Pfad-Wahl (einmalig, überschreibbar) */
onboardingRoutes.post("/onboarding/path", requireAuth, async (c) => {
  const user = c.get("user")!;
  const body = (await c.req.json().catch(() => null)) as unknown;

  const parsed = pathSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ungültiger Request-Body.";
    return c.json({ error: { code: "VALIDATION", message, retryable: false } }, 400);
  }

  const result = await choosePath(user.userId, parsed.data.path as OnboardingPath);
  return c.json(result);
});

/** POST /onboarding/complete – Intro als abgeschlossen markieren */
onboardingRoutes.post("/onboarding/complete", requireAuth, async (c) => {
  const user = c.get("user")!;
  const result = await completeIntro(user.userId);
  return c.json(result);
});