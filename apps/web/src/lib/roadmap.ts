/**
 * Roadmap & Patch-Log für die Web-UI.
 *
 * HIER PFLEGEN: "Nächste Schritte" und Änderungshistorie aktualisieren,
 * sobald sich der Projektstand ändert (siehe PR-/Merge-Log).
 */

export interface NextStep {
  title: string;
  detail: string;
  issue?: number;
}

export interface PatchLogEntry {
  date: string;
  title: string;
  changes: string[];
}

const ISSUE_BASE = "https://github.com/duduspieleklee-create/kleeblatt-adventure/issues/";

export function issueUrl(issue: number): string {
  return `${ISSUE_BASE}${issue}`;
}

/** Aktuelle nächste Schritte (Stand: 03.08.2026, nach P4 Phaser-Container) */
export const NEXT_STEPS: NextStep[] = [
  {
    title: "Phaser MatchScene: Map + Spieler + WASD",
    detail: "React-Phaser-Container + gameBridge, erste spielbare Scene.",
    issue: 43,
  },
  {
    title: "Basisangriff je Klasse + Bruiser-AI",
    detail: "RuleEngine-Stub, LMB-Angriff, erster Gegner-Typ mit FSM.",
    issue: 45,
  },
  {
    title: "HP, Tod & Respawn + React-HUD",
    detail: "HP-/Resource-Bars, Death-Delay, Respawn am Spawnpunkt.",
    issue: 48,
  },
  {
    title: "XP + Loot + Inventar-Erweiterung",
    detail: "XP-Gain + Level-Up, Lootkisten, Items anlegbar auf Held-Stats.",
    issue: 50,
  },
];

/** Änderungshistorie (neueste zuerst) – Stand: 03.08.2026 */
export const PATCH_LOG: PatchLogEntry[] = [
  {
    date: "03.08.2026",
    title: "PR #68 – P4 React-Page mit Phaser-Container",
    changes: [
      "createGame-Factory + Platzhalter-Scene, MatchPage mit Mount/Unmount, HomePage-Integration, CSS .game-container.",
      "Viewport 960x540 (game-config.json folgt), Vite-Chunk >500 kB dokumentiert.",
    ],
  },
  {
    date: "03.08.2026",
    title: "PR #66 – P3 Mock-Wallet",
    changes: [
      "Neue wallets-Tabelle (Drizzle) + Migration 0001: user_id PK, address, provider_ref, status (pending/ready).",
      "GET /wallet liefert stabile deterministische Mock-Adresse pro User (0x + 40 Hex), Postgres + In-Memory-Fallback.",
      "WalletResponse-Typ in packages/shared, Unit-Test (Format, Determinismus, Eindeutigkeit).",
    ],
  },
  {
    date: "03.08.2026",
    title: "Google-Login verifiziert (Produktion)",
    changes: [
      "GOOGLE_CLIENT_SECRET korrigiert – Login läuft durch, Auth-Fix aus PR #60 bestätigt (Issue #61 geschlossen).",
    ],
  },
  {
    date: "03.08.2026",
    title: "PR #63 – API-Routing (/api)",
    changes: [
      "Alle API-Endpoints zusätzlich unter /api gemountet (Dual-Mount), Web nutzt /api-Prefix – P2-Endpoints in Produktion erreichbar.",
    ],
  },
  {
    date: "03.08.2026",
    title: "PR #60 – P2 Held + Starter-Gear & Auth-Fix",
    changes: [
      "Held erstellen (Name + Klasse mage/ranged/melee), Starter-Gear aus game-config.json.",
      "Inventar-API + UI mit Anlegen/Ablegen (Slot- & Klassenregeln).",
      "Google-Login: Fehlergründe sichtbar (?auth=error&reason=…), CSRF-Schutz (OAuth state), GET /auth/status.",
      "DB-Schema (Drizzle) + Migration + Seed (item_templates), In-Memory-Fallback ohne Postgres.",
      "Prototyp-Checkliste P0–P2 abgehakt; CI-Formatcheck repariert (STRUCTURE.md).",
    ],
  },
  {
    date: "03.08.2026",
    title: "P1 – Auth & Fundament (davor)",
    changes: [
      "Google OAuth Login + JWT-Session (Cookie), /me.",
      "Monorepo (Turborepo), CI, Docker Compose (Postgres/Redis), Auto-Deploy game.kleeblatt.space.",
    ],
  },
];
