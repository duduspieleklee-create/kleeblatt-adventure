## Review (Kleeblatt-Prüfer)

**Was geprüft:** PR #66 – feat(api): P3 Mock-Wallet – wallets-Tabelle, stabile Mock-Adresse, GET /wallet  
Diff gelesen, CI-Status geprüft (Prettier fehlschlägt), Checkliste CONTRIBUTING/DoD abgearbeitet.

---

### Stärken
- **Architektur sauber:** Dünner Handler in `routes/wallet.ts` → Logik in `services/wallets.ts` (Single Responsibility)
- **TypeScript strict:** Keine `any`, saubere Typen (`WalletView`, `WalletResponse` in shared), `import type` für Typ-Imports
- **Deterministische Mock-Adresse:** `mockAddressFor(userId)` ist stabil, eindeutig, Format `0x` + 40 Hex — gut getestet (3 Tests: Format, Determinismus, Eindeutigkeit)
- **DB-Migration vorhanden:** `apps/api/drizzle/0001_black_spot.sql` erstellt `wallets`-Tabelle mit FK zu `users`, Snapshot & Journal aktualisiert
- **In-Memory-Fallback:** `memoryStore.ts` erweitert um `memWallets` Map — funktioniert ohne Postgres
- **API-Vertrag eingehalten:** GET `/wallet` liefert exakt `{ address, status, provider }` wie in `24-api-contract.md` §2.7 definiert
- **Shared-Types exportiert:** `WalletStatus`, `WalletResponse` in `packages/shared/src/types/wallet.ts` und über `index.ts` re-exportiert
- **Keine Secrets** im Diff, kein `console.log` in Produktivcode

---

### Probleme/Fragen

| Datei/Zeile | Problem | Schwere |
|-------------|---------|---------|
| `apps/api/src/services/wallets.ts`, `apps/api/src/services/memoryStore.ts` | **Prettier formatting fails** (CI rot). `npm run format:check` meldet Style-Issues in beiden Dateien. | 🔴 Blocker (CI muss grün) |
| `apps/api/src/routes/wallet.ts:12` | Keine Fehlerbehandlung für `getOrCreateWallet`. Wenn DB wirft, landet es im globalen `errorHandler` (ok), aber Rückgabe ist immer 200. Ein `try/catch` + `c.json({ error: ... }, 500)` wäre expliziter und konsistenter mit anderen Routes (siehe `hero.ts`, `inventory.ts`). | 🟡 Mittel |
| `apps/api/src/routes/wallet.ts` | Kein `validateBody`/`validateQuery` Middleware — bei GET ohne Body ok, aber für Konsistenz könnte man die Middleware-Kette (`requireAuth` → Handler) belassen. Nicht blockierend. | 💬 Hinweis |
| Tests job | CI zeigt "Tests: skipping" — Vitest läuft nicht (vermutlich `test:api` Script fehlt oder Test-Datei nicht gematcht). `wallets.test.ts` liegt richtig, aber Job wird übersprungen. | 🟡 Mittel |

---

### Sensible Bereiche ⚠️
- **DB-Migration:** `apps/api/drizzle/0001_black_spot.sql` (neue Tabelle `wallets` + FK) — **sensibel: ja**
- Keine `.github/workflows` Änderungen, keine Secrets, keine `game-config.json` Änderungen.

---

### Konklusion: 🔴 Request-Changes

**Grund:** CI (Prettier) ist rot. Das muss vor Merge behoben werden (`npm run format:write` in `apps/api`).  
Zusätzlich: Fehlerbehandlung im Handler nachziehen (klein), Tests-Job prüfen (warum skipping?).

> **Hinweis zur Genehmigung:** Formales `gh pr review --approve` ist wegen GitHub-Self-Approval-Regel nicht möglich (PR-Autor = gh-Konto). Diese Zeile „Konklusion: ✅ Approve / 🔴 Request-Changes“ ist das offizielle Verdict-Signal für main.