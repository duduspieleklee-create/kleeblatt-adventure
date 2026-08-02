# Security Policy – Kleeblattadventure

**Stand:** 3. August 2026  
**Plattform:** Immutable zkEVM (L2) + Web2 Game Backend

---

## Unterstützte Versionen

- Current `main` branch
- Latest release tag

## Schwachstellen melden

Bitte reporte Security-Vulnerabilities **nicht** in öffentlichen GitHub Issues.  
Kontaktiere das Entwicklungsteam direkt.

## Architektur-Sicherheitsmodell

### Web2 / Game Backend

| Prinzip | Umsetzung |
|---------|-----------|
| Keine Private Keys auf App-Servern | MPC-Provider (Turnkey/Dfns) verwaltet Keys – kein vollständiger Key existiert |
| Secrets nur in Server-Env | `.env` in `.gitignore`, nie committen |
| Session-Security | JWT in HttpOnly-Cookies, `sameSite: lax`, Secure-Flag in Prod |
| Input-Validierung | Zod/Valibot an allen API-Endpunkten |
| Rate-Limiting | Redis-basiert, besonders Auth und Claim-Endpunkte |
| CORS | Nur `WEB_URL` als erlaubter Origin |
| SQL-Injection | Parameterized Queries / ORM (Drizzle/Prisma) |

### Immutable zkEVM / Blockchain

| Prinzip | Umsetzung |
|---------|-----------|
| Custodial als Standard | Studio kontrolliert Keys über MPC-Provider |
| Claim to Self-Custody | Optionaler Exit mit 2FA + Policies |
| Idempotente Mint-Jobs | Gleiche Item-ID kann nicht doppelt gemintet werden |
| Gilden-Bank-Wallets | Custodial, Policy-geschützt |
| Kein direkter Fiat→Token→Cash-out | Shop verkauft nur Mint-Credits + Kosmetik |
| L2-Only | Keine native L1-Bridge, weniger Angriffsfläche |
| Event-Watcher | On-Chain-Events syncen zurück in Game-DB |

### MPC / Key-Management

| Prinzip | Umsetzung |
|---------|-----------|
| Provider-Abstraktion | Wallet-Service-Interface, Provider austauschbar |
| Keine Raw-Keys | MPC (Multi-Party Computation) – Key in Shares, nie rekonstruiert |
| Policies | Rate-Limits, Timelocks, 2FA für Claims |
| Provider-Wechsel | Durch `WALLET_PROVIDER` Env-Variable, kein Code-Change nötig |

Siehe: [05-wallet-und-mpc.md](./docs/architecture/05-wallet-und-mpc.md), [06-wallet-abstraktionsschicht.md](./docs/architecture/06-wallet-abstraktionsschicht.md)

### Realtime / WebSocket (später, M9+)

| Prinzip | Umsetzung |
|---------|-----------|
| WS-Auth | Gültige Session erforderlich, keine MPC-Keys im WS |
| Move-Validation | Serverseitig Speed/Bounds prüfen (Anti-Cheat) |
| Room-Kapazität | Begrenzt, Overflow in neue Instanz |
| Keine Economy im Move-Tick | Keine Item-Vergabe über Realtime-Messages |

## Entwicklung

### Code-Reviews

- Alle PRs müssen reviewed werden vor Merge
- Security-relevante Änderungen (Auth, Wallet, Claim) brauchen Extra-Review

### Dependency-Management

- Regelmäßige Updates von npm-Abhängigkeiten
- `npm audit` vor Release
- Keine ungeprüften neuen Dependencies ohne Lizenz-Check

### CI/CD

- Automated Security-Scans (CodeQL, Dependency-Scan)
- Secrets über GitHub Actions Encrypted Secrets, nie im Code
- Container-Images scannen

### Lokale Entwicklung

- `.env` niemals committen
- Keine echten Provider-Credentials in Dev (Mock-Adapter verwenden)
- Testnet für On-Chain-Tests, niemals Mainnet

## Best Practices für Entwickler

1. **Nie** Secrets hardcoden – immer Env-Variablen
2. Alle User-Inputs validieren (Zod/Valibot)
3. Principle of Least Privilege für Service-Rollen
4. Error-Messages nicht zu spezifisch (keine internen Details leaken)
5. Logs keine sensitiven Daten enthalten (keine Token-Adressen in Plaintext)
6. Bei neuen Endpunkten: Auth + Rate-Limit prüfen

## Verwandte Docs

- [02-architektur.md](./docs/architecture/02-architektur.md) – Systemarchitektur
- [05-wallet-und-mpc.md](./docs/architecture/05-wallet-und-mpc.md) – MPC-Modell
- [09-waehrungs-und-shop-architektur.md](./docs/architecture/09-waehrungs-und-shop-architektur.md) – Kein Token-Cash-out
- [15-game-backend-realtime.md](./docs/architecture/15-game-backend-realtime.md) – Realtime-Security
