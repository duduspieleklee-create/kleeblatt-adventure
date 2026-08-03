# 26 – OAuth-Login: Fehlerbehebung & Diagnose

**Version:** 1.0
**Stand:** 3. August 2026
**Status:** Fix dokumentiert (Branch `feat/hero-starter-gear`)

---

## Symptom (Bug, gemeldet 03.08.2026)

Nach erfolgreichem Google-Login landet der Nutzer auf

```
https://game.kleeblatt.space/?auth=error
```

und ist **nicht eingeloggt** (UI zeigt „Nicht angemeldet").

**Betroffen:** Produktion (game.kleeblatt.space), P1 Auth.

---

## Analyse

Der Redirect `?auth=error` kommt **vom API-Callback** (`GET /auth/google/callback`).
Die Web-App wertet `?auth=` selbst nicht aus; „Nicht angemeldet" = `/me` liefert 401
(kein Session-Cookie).

Der Callback hat mehrere Fehlerpfade, die bisher **alle identisch** auf
`?auth=error` ohne Grund zeigten (Blackbox):

| Pfad                                            | Ursache (typisch)                                                                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `oauthError` (Google redirectet mit `?error=…`) | Nutzer abgebrochen, **redirect_uri_mismatch** (falsche/nicht registrierte Redirect-URI in Google Cloud Console), Consent abgelehnt |
| Token-Austausch `!ok`                           | **falsches GOOGLE_CLIENT_SECRET**, abgelaufene Credentials, redirect_uri weicht ab                                                 |
| Profil-Fetch `!ok`                              | Access-Token ungültig/abgelaufen, Netzwerk                                                                                         |
| Exception                                       | Server kann Google nicht erreichen (DNS/Firewall/Proxy), Timeout                                                                   |

Zusätzlich fehlte der OAuth-`state`-Parameter → **Login-CSRF-Schwachstelle**
(Angreifer kann Opfer in fremdes Konto zwingen).

---

## Fixes (in diesem Branch)

1. **OAuth `state` (CSRF-Schutz)**: zufälliger State, kurzlebiges httpOnly-Cookie
   (`kleeblatt_oauth_state`, 10 min, nur am Callback-Pfad), Verifikation im Callback.
   Mismatch → `?auth=error&reason=state`.
2. **Fehlergründe sichtbar**: Redirect jetzt mit `reason` (+ `detail`):
   `oauth`, `missing_code`, `state`, `token_exchange`, `profile`, `exception`.
3. **Web-UI**: zeigt verständliche deutsche Fehlermeldung je `reason`.
4. **`GET /auth/status`**: nicht-sekrete Auth-Konfiguration (clientIdSet,
   callbackUrl, webUrl, cookieSecure, nodeEnv) für Remote-Diagnose.
5. **Startup-Log**: API loggt Auth-Config-Summary (ohne Secrets) + DB-Modus.

---

## Diagnose-Leitfaden

1. `curl https://game.kleeblatt.space/auth/status` → Konfiguration prüfen
   (clientIdSet, callbackUrl exakt wie in Google Console registriert).
2. Login wiederholen → URL zeigt jetzt den Grund: `?auth=error&reason=…`
3. Server-Logs: `journalctl -u kleeblatt-api -n 100` (Google-Antworten werden geloggt).

### Häufigster Produktionsgrund

`reason=oauth` mit `detail=redirect_uri_mismatch` →
in der [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
unter **Authorized redirect URIs** exakt eintragen:

```
https://game.kleeblatt.space/auth/google/callback
```

(lokale Dev-URI `http://localhost:4000/auth/google/callback` zusätzlich lassen.)

`reason=token_exchange` → `GOOGLE_CLIENT_SECRET` (GitHub Secret `GOOGLE_CLIENT_SECRET`)
gegen das Secret der registrierten Client-ID prüfen.

---

## Tests

`apps/api/src/routes/auth.test.ts` deckt ab: Status, Start (State-Cookie),
alle Fehlerpfade (reason), CSRF-Blockade und Erfolgsfall (Session-Cookie) —
mit gemocktem `fetch`, ohne echte Google-Calls.
