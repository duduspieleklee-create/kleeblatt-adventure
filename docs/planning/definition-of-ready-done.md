# Definition of Ready / Done

**Stand:** 3. August 2026

---

## Definition of Ready (DoR)

Ein Ticket ist **startklar**, wenn alle folgenden Punkte erfüllt sind:

- [ ] Ticket hat einen klaren Titel und eine Beschreibung
- [ ] Akzeptanzkriterien sind formuliert (was muss funktionieren?)
- [ ] Bereich ist zugeordnet (`area:api`, `area:web`, `area:phaser`, `area:db`)
- [ ] Priorität ist gesetzt (`priority:blocker`, `high`, `medium`, `low`)
- [ ] Meilenstein (P0–P7) ist zugeordnet
- [ ] Abhängigkeiten zu anderen Tickets sind geklärt (oder "keine")
- [ ] Design-Entscheidungen sind getroffen oder als "offen" markiert
- [ ] Relevantes Doc ist verlinkt (z.B. `Ref: docs/architecture/24-api-contract.md`)

---

## Definition of Done (DoD)

Ein Ticket ist **fertig**, wenn alle folgenden Punkte erfüllt sind:

### Code

- [ ] Code folgt [CONTRIBUTING.md](../../CONTRIBUTING.md) Coding Standards
- [ ] TypeScript strict – keine `any` (außer begründet)
- [ ] Keine Secrets in Code/Commits
- [ ] Keine console.log in produktivem Code

### Tests

- [ ] Unit-Tests für Business-Logik geschrieben (Vitest)
- [ ] Bestehende Tests laufen grün
- [ ] `npm run build` erfolgreich

### API / DB

- [ ] API-Endpunkte entsprechen [24-api-contract.md](../architecture/24-api-contract.md)
- [ ] DB-Migration erstellt (falls Schema-Änderung)
- [ ] Input-Validierung mit Zod/Valibot

### Gameplay (falls Phaser-Ticket)

- [ ] Werte aus `game-config.json`, nicht hardcodiert
- [ ] gameBridge-Events entsprechen [14-phaser-react-bridge.md](../architecture/14-phaser-react-bridge.md)
- [ ] RuleEngine ist ohne Phaser testbar

### Demo / Verifikation

- [ ] Demo-Schritt aus [20-prototyp-checkliste.md](../architecture/20-prototyp-checkliste.md) funktioniert
- [ ] Manuell getestet (nicht nur "compilt")

### Dokumentation

- [ ] Docs aktualisiert falls nötig
- [ ] `game-config.json` aktualisiert falls Werte geändert
- [ ] PR-Beschreibung erklärt Was + Warum + Wie testen

### Merge

- [ ] CI Pipeline ist grün
- [ ] Mind. 1 Review erfolgt
- [ ] Zugehöriges Issue wird durch PR geschlossen (`Closes #N`)
