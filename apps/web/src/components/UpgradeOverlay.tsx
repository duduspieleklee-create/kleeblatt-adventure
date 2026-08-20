import { useEffect, useState, type FormEvent } from "react";
import type { MeResponse } from "@kleeblatt/shared";
import { PASSWORD_REQUIREMENTS, validatePassword } from "@kleeblatt/shared";
import { checkEmailAvailable, upgradeAccount } from "../lib/api";
import { StatusSpinner, type SpinnerState } from "./StatusSpinner";
import "../styles/auth.css";

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

interface UpgradeOverlayProps {
  /** Close the overlay without upgrading (e.g. the X / cancel button). */
  onClose: () => void;
  /** Called after a successful upgrade with the new full-account session user. */
  onUpgraded: (me: MeResponse) => void;
}

export function UpgradeOverlay({ onClose, onUpgraded }: UpgradeOverlayProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailState, setEmailState] = useState<SpinnerState>("idle");
  const [pwValid, setPwValid] = useState(false);
  const [confirmValid, setConfirmValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounced email-availability check.
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailState(trimmed ? "invalid" : "idle");
      return;
    }
    setEmailState("checking");
    const handle = setTimeout(async () => {
      try {
        const res = await checkEmailAvailable(trimmed);
        setEmailState(res.available && res.valid ? "valid" : "invalid");
      } catch {
        setEmailState("invalid");
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [email]);

  // Password policy (shared rules).
  useEffect(() => {
    setPwValid(validatePassword(password).valid);
  }, [password]);

  // Confirm must match password and meet the policy.
  useEffect(() => {
    setConfirmValid(confirm.length > 0 && confirm === password && pwValid);
  }, [confirm, password, pwValid]);

  const canSubmit = emailState === "valid" && pwValid && confirmValid && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await upgradeAccount(email.trim().toLowerCase(), password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onUpgraded(result.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const pwSpinner: SpinnerState = password.length === 0 ? "idle" : pwValid ? "valid" : "invalid";
  const confirmSpinner: SpinnerState =
    confirm.length === 0 ? "idle" : confirmValid ? "valid" : "invalid";

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          aria-label="Close"
          disabled={submitting}
        >
          ×
        </button>

        <h1 className="auth-brand">Upgrade to Full Account</h1>
        <p className="auth-intro">
          Your progress is stored only temporarily. Create a permanent account with an
          email and password to keep it — the same secure sign-up used for registration.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            <span>Email</span>
            <span className="auth-field">
              <input
                className="auth-input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <StatusSpinner state={emailState} />
            </span>
            {emailState === "invalid" && email.trim().length > 0 && (
              <span className="auth-hint auth-hint-bad">Email already taken or invalid</span>
            )}
          </label>

          <label className="auth-label">
            <span>Password</span>
            <span className="auth-field">
              <input
                className="auth-input"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <StatusSpinner state={pwSpinner} />
            </span>
          </label>

          <label className="auth-label">
            <span>Confirm Password</span>
            <span className="auth-field">
              <input
                className="auth-input"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <StatusSpinner state={confirmSpinner} />
            </span>
          </label>

          <ul className="auth-reqs">
            {PASSWORD_REQUIREMENTS.map((req) => {
              const met = req.test(password);
              return (
                <li key={req.id} className={met ? "auth-req met" : "auth-req"}>
                  {req.label}
                </li>
              );
            })}
          </ul>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={!canSubmit}>
            {submitting ? "Upgrading…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
