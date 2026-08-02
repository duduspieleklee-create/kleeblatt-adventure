# Risk Register

**Stand:** 3. August 2026  
**Bezug:** [16-developer-guide.md](../architecture/16-developer-guide.md) Abschnitt "Externe Blocker"

---

## Risiken für den Prototyp (P0–P7)

| ID | Risiko | Wahrscheinlichkeit | Impact | Mitigation | Status |
|----|--------|-------------------|--------|------------|--------|
| R1 | **Google OAuth Setup dauert länger als erwartet** | Mittel | Hoch (blockiert P1) | Frühestmöglich starten; Fallback: Dev-Login mit Dummy-E-Mail für P1, Google parallel | Offen |
| R2 | **Phaser + React Integration komplexer als gedacht** | Mittel | Hoch (blockiert P4) | gameBridge-Vertrag (Doc 14) ist definiert; Phaser in React-Container einbetten, saubere Event-Trennung | Mitigation aktiv |
| R3 | **Sprites/Assets noch nicht verfügbar** | Hoch | Mittel (blockiert P4 visuell) | Mit Platzhalter-Rechtecken (farbige Squares) starten; Assets parallel sammeln | Offen |
| R4 | **Combat-Balance fühlt sich nicht gut an** | Mittel | Niedrig (Prototyp) | Erste Werte aus `game-config.json`; Balance-Pass nach erstem Combat-Prototyp | Akzeptiert |
| R5 | **DB-Migration setup fehleranfällig** | Niedrig | Mittel | Drizzle/Prisma verwenden; Seed-Script automatisiert aus `game-config.json` | Mitigation aktiv |
| R6 | **XP-Kurve zu langsam für Demo** | Niedrig | Niedrig | `prototype_fast` Mode in Config; Level 3 nach ~10 Kills | Behoben |
| R7 | **Colyseus/Realtime zu früh integriert** | Niedrig | Mittel | Realtime ist Sprint 3+ (M9); Prototyp ist Single-Player | Akzeptiert |

---

## Risiken für später (M7–M10, nicht Prototyp)

| ID | Risiko | Wahrscheinlichkeit | Impact | Mitigation | Status |
|----|--------|-------------------|--------|------------|--------|
| R8 | **MPC-Provider Account verzögert** | Mittel | Hoch (blockiert M2 ohne Mock) | MockAdapter für Entwicklung; Turnkey-Account frühzeitig beantragen | Offen |
| R9 | **Immutable zkEVM Testnet unzuverlässig** | Niedrig | Hoch (blockiert M7) | Mock-Mint für UI/State; Testnet parallel testen | Offen |
| R10 | **Smart Contract Bugs** | Mittel | Hoch | Contract-Tests; Audit vor Mainnet | Später |
| R11 | **Fiat-PSP Integration (Stripe etc.)** | Mittel | Mittel | Mint-Credit-System ist simpler als direkter Token-Kauf; PSP erst nach stabilem M7 | Später |
| R12 | **Regulatorische Fragen (Mint-Credits, Custodial)** | Mittel | Mittel | Legal-Review DE/EU geplant; Custodial + Claim ist argumentierbar | Offen |
| R13 | **Phaser Performance bei vielen Sprites** | Niedrig | Mittel | Object Pooling für Enemies; 5–15 Enemies max im Prototyp | Akzeptiert |

---

## Top 3 aktuellste Risiken

1. **R1 – Google OAuth Setup** → Sofort starten, Fallback vorbereiten
2. **R3 – Assets fehlen** → Mit Platzhaltern arbeiten, Asset-Liste (Doc 22) abarbeiten
3. **R2 – Phaser/React Bridge** → gameBridge-Vertrag definiert, frühzeitig Proof-of-Concept machen

---

## Risk Review

- Wöchentliches Review im Sprint-Planning
- Neue Risiken als Issue mit Label `risk` anlegen
- Geschlossene Risiken als "Behoben" markieren, nicht löschen
