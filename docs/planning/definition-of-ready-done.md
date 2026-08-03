# Definition of Ready / Done

**Stand:** 3. August 2026  
**Owner:** kleeblatt-review (content + code review)

---

## Definition of Ready (DoR)

Ein Ticket ist **startklar**, wenn alle folgenden Punkte erfüllt sind:

- [ ] Ticket hat einen klaren Titel und eine Beschreibung
- [ ] Akzeptanzkriterien sind formuliert (was muss funktionieren?)
- [ ] Bereich ist zugeordnet (`area:api`, `area:web`, `area:phaser`, `area:db`)
- [ ] Priorität ist gesetzt (`priority:blocker`, `high`, `medium`, `low`)
- [ ] Meilenstein (MVP 1–MVP 13) ist zugeordnet
- [ ] Abhängigkeiten zu anderen Tickets sind geklärt (oder "keine")
- [ ] Design-Entscheidungen sind getroffen oder als "offen" markiert
- [ ] **Mind. 1 relevantes Doc ist verlinkt im Issue-Body** (`https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/XX-name.md`)
- [ ] **Milestone-Description enthält zentrale Doc-Verweise** (nicht nur im Issue)
- [ ] **Tigger hat das verlinkte Doc gelesen** (Bestätigung per Comment: `@tigger-read-doc`)
- [ ] Für Wallet/Auth-Tickets: [Doc 05 – Wallet & MPC](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/05-wallet-und-mpc.md) + [Doc 06 – Wallet Abstraction](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/06-wallet-abstraktionsschicht.md) gelesen

### Doc-Verlinkungs-Anforderungen (streng)
- Jedes Issue muss mindestens **1 spezifisches Doc** referenzieren, nicht nur generelle Docs
- Die Referenz muss **direkt im Issue-Body** stehen, nicht nur in Kommentaren
- Bei **API-Änderungen**: [Doc 24 – API Contract](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/24-api-contract.md) muss gelesen und referenziert sein
- Bei **Phaser/Gameplay-Änderungen**: [Doc 20 – Prototyp-Checkliste](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/20-prototyp-checkliste.md) + [Doc 14 – Phaser-React Bridge](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/14-phaser-react-bridge.md) müssen gelesen sein
- Bei **DB-Änderungen**: [Doc 23 – DB Schema](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/23-db-schema.md) muss gelesen sein
- Bei **Item/Inventory-Änderungen**: [Doc 03 – Item Lifecycle](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/03-item-lifecycle.md) muss gelesen sein
- Bei **Asset-Änderungen**: [Doc 22 – Asset Liste](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/22-asset-liste.md) muss gelesen sein

---

## Definition of Done (DoD)

Ein Ticket ist **fertig**, wenn alle folgenden Punkte erfüllt sind:

### Code

- [ ] Code folgt [CONTRIBUTING.md](../../CONTRIBUTING.md) Coding Standards
- [ ] TypeScript strict – keine `any` (außer begründet)
- [ ] Keine Secrets in Code/Commits
- [ ] Keine console.log in produktivem Code
- [ ] **Implementierung entspricht gelesenen Design-Docs** (Review prüft Alignment)

### Doc Alignment (neu - streng)

- [ ] **Alle im Issue referenzierten Docs wurden implementiert** (Review bestätigt)
- [ ] **Keine Abweichung von Doc-spezifizierten Werten/Verhalten** ohne Approval
- [ ] **Game Config Werte entsprechen [Doc 21 – Game Config](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/21-game-config.md)**
- [ ] **API-Endpunkte entsprechen exakt [Doc 24 – API Contract](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/24-api-contract.md)**
- [ ] **DB-Schema-Änderungen dokumentiert in [Doc 23 – DB Schema](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/23-db-schema.md)**

### Tests

- [ ] Unit-Tests für Business-Logik geschrieben (Vitest)
- [ ] Bestehende Tests laufen grün
- [ ] `npm run build` erfolgreich

### API / DB

- [ ] API-Endpunkte entsprechen [24-api-contract.md](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/24-api-contract.md)
- [ ] DB-Migration erstellt (falls Schema-Änderung)
- [ ] Input-Validierung mit Zod/Valibot

### Gameplay (falls Phaser-Ticket)

- [ ] Werte aus `game-config.json`, nicht hardcodiert
- [ ] gameBridge-Events entsprechen [14-phaser-react-bridge.md](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/14-phaser-react-bridge.md)
- [ ] RuleEngine ist ohne Phaser testbar

### Demo / Verifikation

- [ ] Demo-Schritt aus [20-prototyp-checkliste.md](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/20-prototyp-checkliste.md) funktioniert
- [ ] Manuell getestet (nicht nur "compilt")

### Dokumentation

- [ ] Docs aktualisiert falls nötig
- [ ] `game-config.json` aktualisiert falls Werte geändert
- [ ] **PR-Beschreibung erklärt Was + Warum + Wie getestet + Doc-Alignment**
- [ ] **PR-Beschreibung listet gelesene Docs auf**

### kleeblatt-review Scope (neu)

- [ ] **Code Review**: funktionale Korrektheit, TypeScript strict, Security, Performance
- [ ] **Content Review**: Alignment mit Design-Docs, Doc-Werte implementiert, keine unberechtigten Abweichungen
- [ ] **Demo-Verifikation**: Demo aus [Doc 20](https://github.com/duduspieleklee-create/kleeblatt-adventure/blob/main/docs/architecture/20-prototyp-checkliste.md) funktioniert

### Merge

- [ ] CI Pipeline ist grün
- [ ] Mind. 1 Review erfolgt (inkl. kleeblatt-review Content-Check)
- [ ] Zugehöriges Issue wird durch PR geschlossen (`Closes #N`)
