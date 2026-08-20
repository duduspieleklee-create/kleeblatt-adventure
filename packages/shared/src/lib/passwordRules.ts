/**
 * Shared password policy — single source of truth for the API (Zod validation)
 * and the React live-validator (status spinner). Keep both sides in sync.
 */

export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "digit", label: "One number", test: (p) => /[0-9]/.test(p) },
];

/** Returns whether the password satisfies every requirement. */
export function validatePassword(password: string): { valid: boolean; failed: string[] } {
  const failed = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password)).map((r) => r.id);
  return { valid: failed.length === 0, failed };
}

/** Pragmatic email shape check (Zod does the authoritative validation server-side). */
export function isEmailWellFormed(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
