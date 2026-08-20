import { useEffect, useState, type FormEvent } from "react";
import type { MeResponse } from "@kleeblatt/shared";
import { PASSWORD_REQUIREMENTS, validatePassword } from "@kleeblatt/shared";
import { checkEmailAvailable, login, register } from "../lib/api";
import { signInWithWalletAndExchange, WalletAuthError } from "../game/utils/walletAuth";
import { StatusSpinner, type SpinnerState } from "./StatusSpinner";
import "../styles/auth.css";

type Mode = "login" | "register";

interface AuthOverlayProps {
  /** Called after a successful login/registration with the session user. */
  onAuthenticated: (me: MeResponse) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthOverlay({ onAuthenticated }: AuthOverlayProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailState, setEmailState] = useState<SpinnerState>("idle");
  const [pwValid, setPwValid] = useState(false);
  const [confirmValid, setConfirmValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounced email-availability check (registration only).
  useEffect(() => {
    if (mode !== "register") {
      setEmailState("idle");
      return;
    }
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
  }, [email, mode]);

  // Password policy (shared rules).
  useEffect(() => {
    setPwValid(validatePassword(password).valid);
  }, [password]);

  // Confirm must match password and meet the policy.
  useEffect(() => {
    setConfirmValid(confirm.length > 0 && confirm === password && pwValid);
  }, [confirm, password, pwValid]);

  const canSubmitLogin = email.trim().length > 0 && password.length > 0 && !submitting;
  const canSubmitRegister = emailState === "valid" && pwValid && confirmValid && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result =
        mode === "login"
          ? await login(email.trim(), password)
          : await register(email.trim().toLowerCase(), password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onAuthenticated(result.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const pwSpinner: SpinnerState = password.length === 0 ? "idle" : pwValid ? "valid" : "invalid";
  const confirmSpinner: SpinnerState =
    confirm.length === 0 ? "idle" : confirmValid ? "valid" : "invalid";

  async function handleWalletLogin(): Promise<void> {
    setError(null);
    setSubmitting(true);
    try {
      const me = await signInWithWalletAndExchange();
      onAuthenticated(me);
    } catch (err) {
      setError(err instanceof WalletAuthError ? err.message : "Wallet login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <h1 className="auth-brand">Kleeblatt Adventure</h1>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("register");
              setError(null);
            }}
          >
            Register
          </button>
        </div>

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
              {mode === "register" && <StatusSpinner state={emailState} />}
            </span>
            {mode === "register" && emailState === "invalid" && email.trim().length > 0 && (
              <span className="auth-hint auth-hint-bad">Email already taken or invalid</span>
            )}
          </label>

          <label className="auth-label">
            <span>Password</span>
            <span className="auth-field">
              <input
                className="auth-input"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === "register" && <StatusSpinner state={pwSpinner} />}
            </span>
          </label>

          {mode === "register" && (
            <>
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
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={mode === "login" ? !canSubmitLogin : !canSubmitRegister}
          >
            {submitting ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        <div className="auth-alt">
          <button
            type="button"
            className="auth-wallet"
            onClick={() => void handleWalletLogin()}
            disabled={submitting}
          >
            Connect Wallet
          </button>
          <a className="auth-google" href="/api/auth/google">
            Continue with Google
          </a>
        </div>
      </div>
    </div>
  );
}
