import type { MeState } from "../hooks/useMe";
import { googleLoginUrl, devLoginUrl } from "../lib/api";

interface AuthCardProps {
  state: MeState;
  onLogout: () => void;
  showDevLogin?: boolean;
}

/** Fehlergründe aus dem OAuth-Callback (?auth=error&reason=…) lesbar machen. */
const AUTH_ERROR_REASONS: Record<string, string> = {
  oauth:
    "Google hat die Anmeldung abgelehnt (z. B. abgebrochen oder Redirect-URI nicht registriert).",
  missing_code: "OAuth-Callback ohne Code empfangen.",
  state: "Sicherheitsprüfung fehlgeschlagen – bitte erneut versuchen.",
  token_exchange: "Google-Token-Austausch fehlgeschlagen (Client-ID/Secret prüfen).",
  profile: "Google-Profil konnte nicht geladen werden.",
  exception: "Unerwarteter Fehler beim Login.",
};

function authErrorHint(): { reason: string; detail: string | null } | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("auth") !== "error") return null;
  return {
    reason: params.get("reason") ?? "unknown",
    detail: params.get("detail"),
  };
}

export function AuthCard({ state, onLogout, showDevLogin }: AuthCardProps) {
  const authError = authErrorHint();

  return (
    <section className="card">
      <h2>Konto (P1 Auth)</h2>
      {authError && (
        <p className="error">
          Anmeldung fehlgeschlagen: {AUTH_ERROR_REASONS[authError.reason] ?? "Unbekannter Grund"}
          {authError.detail ? <code> ({authError.detail})</code> : null}
        </p>
      )}
      {state.status === "loading" && <p>Session wird geprüft…</p>}
      {state.status === "error" && (
        <p className="hint">
          Fehler: {state.message}. API laufen? <code>npm run dev:api</code>
        </p>
      )}
      {state.status === "anonymous" && (
        <>
          <p>Nicht angemeldet.</p>
          <p className="actions">
            <a className="btn" href={googleLoginUrl()}>
              Mit Google anmelden
            </a>
            {showDevLogin && (
              <a className="btn secondary" href={devLoginUrl()}>
                Dev-Login
              </a>
            )}
          </p>
          <p className="hint">
            Benötigt <code>GOOGLE_CLIENT_ID</code> / <code>SECRET</code> in <code>.env</code>. Lokal
            ohne Google: <code>AUTH_DEV_BYPASS=true</code>.
          </p>
        </>
      )}
      {state.status === "authenticated" && (
        <>
          <p>
            Angemeldet als <strong>{state.me.displayName ?? state.me.email}</strong>
          </p>
          <p className="hint">
            userId: <code>{state.me.userId}</code>
            {state.me.hero ? ` · Held: ${state.me.hero.heroName}` : " · Noch kein Held (P2)"}
          </p>
          <p className="actions">
            <button type="button" className="btn secondary" onClick={onLogout}>
              Abmelden
            </button>
          </p>
        </>
      )}
    </section>
  );
}
