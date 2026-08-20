/** Password hashing with Node's built-in scrypt (no extra dependencies). */

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;
const SCHEME = "scrypt";

/**
 * Hash a plaintext password. Format: `scrypt$<saltHex>$<hashHex>`.
 * The salt is unique per password, so identical passwords produce different hashes.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `${SCHEME}$${salt}$${derived.toString("hex")}`;
}

/** Constant-time verification of a password against a stored hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== SCHEME || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  if (expected.length === 0) return false;
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
