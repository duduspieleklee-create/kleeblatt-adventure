/** Input-Validierung (Zod) – siehe CONTRIBUTING.md / DoD: „Input validation with Zod or Valibot" */

import { z } from "zod";

export const createHeroSchema = z.object({
  heroName: z
    .string()
    .min(2, "Heldenname muss 2–20 Zeichen lang sein.")
    .max(20, "Heldenname muss 2–20 Zeichen lang sein.")
    // Unicode letters + numbers + spaces (German umlauts etc.)
    .regex(/^[\p{L}\p{N} ]+$/u, "Heldenname: nur Buchstaben, Zahlen und Leerzeichen erlaubt.")
    .transform((value) => value.trim()),
  class: z.enum(["mage", "ranged", "melee"], {
    message: "Ungültige Klasse: mage | ranged | melee",
  }),
});

export type CreateHeroBody = z.infer<typeof createHeroSchema>;
