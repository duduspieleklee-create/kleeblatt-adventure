/** ID-Generierung: lesbare Präfixe (usr_, hero_, item_, ...) */

import { randomUUID } from "node:crypto";

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
