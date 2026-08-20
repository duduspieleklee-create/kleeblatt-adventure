/** Input-Validierung (Zod) – siehe CONTRIBUTING.md / DoD: „Input validation with Zod or Valibot" */

import { z } from "zod";
import { PASSWORD_MIN_LENGTH, validatePassword } from "@kleeblatt/shared";

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

/** Email: trimmed, lowercased, must be a valid address. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address.");

/** Registration payload: valid email + a password that meets the shared policy. */
export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .refine(
      (value) => validatePassword(value).valid,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include uppercase, lowercase, and a number.`,
    ),
});

/** Login payload: valid email + any non-empty password (verified against the hash). */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
