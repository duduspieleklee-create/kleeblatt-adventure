/**
 * XP-Kurve + Level-Up – pure Funktionen (kein Phaser/kein I/O, unit-testbar).
 *
 * Quelle der Kurve: game-config.json → xpCurve (mode: prototype_fast,
 * type: threshold_table). Die Default-Kurve hier ist ein Spiegel davon;
 * Caller können eine eigene Kurve übergeben (single source of truth bleibt
 * game-config.json, z. B. via loadGameConfig im API-Service).
 */

export interface XpCurveLevel {
  level: number;
  /** XP, die zum nächsten Level fehlen (null = Max-Level). */
  xpToNext: number | null;
  /** Kumulierte Gesamt-XP ab Level 1. */
  totalXp: number;
  unlocks?: string[];
}

export interface XpState {
  level: number;
  /** XP innerhalb des aktuellen Levels (nicht kumuliert). */
  xp: number;
}

export interface ApplyXpResult {
  level: number;
  xp: number;
  xpToNext: number | null;
  leveledUp: boolean;
}

/** Spiegel von game-config.json → xpCurve (10 Level, Prototyp). */
export const DEFAULT_XP_CURVE: readonly XpCurveLevel[] = [
  { level: 1, xpToNext: 60, totalXp: 0 },
  { level: 2, xpToNext: 90, totalXp: 60 },
  { level: 3, xpToNext: 150, totalXp: 150 },
  { level: 4, xpToNext: 250, totalXp: 300 },
  { level: 5, xpToNext: 400, totalXp: 550 },
  { level: 6, xpToNext: 600, totalXp: 950 },
  { level: 7, xpToNext: 850, totalXp: 1550 },
  { level: 8, xpToNext: 1150, totalXp: 2400 },
  { level: 9, xpToNext: 1600, totalXp: 3550 },
  { level: 10, xpToNext: null, totalXp: 5050 },
];

/**
 * Wendet gewonnene XP an und liefert das neue Level (inkl. Multi-Level-Jumps).
 *
 * @param state  aktueller Stand (level + XP innerhalb des Levels)
 * @param gained gewonnene XP (negativ/NaN wird auf 0 geklemmt)
 * @param curve  XP-Kurve (Default: DEFAULT_XP_CURVE)
 */
export function applyXp(
  state: XpState,
  gained: number,
  curve: readonly XpCurveLevel[] = DEFAULT_XP_CURVE,
): ApplyXpResult {
  const safeGained = Number.isFinite(gained) && gained > 0 ? Math.floor(gained) : 0;

  const maxEntry = curve[curve.length - 1];
  if (!maxEntry) {
    // Leere Kurve: Level unverändert, XP addieren.
    return { level: state.level, xp: state.xp + safeGained, xpToNext: null, leveledUp: false };
  }
  if (state.level > maxEntry.level) {
    // Über der Kurve: kein weiteres Level-Up, XP trotzdem addieren.
    return {
      level: state.level,
      xp: state.xp + safeGained,
      xpToNext: null,
      leveledUp: false,
    };
  }

  const levelEntry = curve.find((entry) => entry.level === state.level);
  const baseTotal = levelEntry ? levelEntry.totalXp : 0;
  const total = baseTotal + Math.max(0, state.xp) + safeGained;

  // Höchstes Level, dessen totalXp-Schwelle erreicht/überschritten ist.
  let newEntry = curve[0]!;
  for (const entry of curve) {
    if (entry.totalXp <= total) {
      newEntry = entry;
    }
  }

  return {
    level: newEntry.level,
    xp: total - newEntry.totalXp,
    xpToNext: newEntry.xpToNext,
    leveledUp: newEntry.level > state.level,
  };
}
