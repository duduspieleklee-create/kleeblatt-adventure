import { useState, useCallback } from "react";
import { HERO_CLASS_OPTIONS, type HeroClass, type HeroResponse } from "@kleeblatt/shared";
import { createHero } from "../lib/api";
import type { MeState } from "../hooks/useMe";

interface AuthOverlayProps {
  meState: MeState;
  onAuthenticated: () => void;
  onHeroCreated: (hero: HeroResponse) => void;
  onClose?: () => void;
}

export function AuthOverlay({ meState, onHeroCreated, onClose }: AuthOverlayProps) {
  const [heroName, setHeroName] = useState("");
  const [selectedClass, setSelectedClass] = useState<HeroClass | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showLogin = meState.status !== "authenticated";

  const handleHeroCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedClass || heroName.trim().length < 2) {
        setError("Bitte Name (2–20 Zeichen) und Klasse wählen.");
        return;
      }
      setBusy(true);
      setError(null);
      const result = await createHero({ heroName: heroName.trim(), class: selectedClass });
      setBusy(false);
      if (result.ok) {
        onHeroCreated(result.data);
      } else {
        setError(result.message);
      }
    },
    [selectedClass, heroName, onHeroCreated],
  );

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button type="button" className="overlay-close" onClick={onClose}>
            ✕
          </button>
        )}

        {showLogin ? (
          <div className="auth-flow">
            <h2>Willkommen</h2>
            <p className="muted">Melde dich an, um dein Abenteuer zu beginnen.</p>
            <div className="auth-actions">
              <a className="btn primary" href="/api/auth/google" target="_self">
                Mit Google anmelden
              </a>
              {import.meta.env.DEV && (
                <a className="btn secondary" href="/api/auth/dev-login" target="_self">
                  Dev-Login
                </a>
              )}
            </div>
            {meState.status === "error" && (
              <p className="error">API nicht erreichbar. Bitte versuche es später erneut.</p>
            )}
          </div>
        ) : (
          <div className="hero-flow">
            <h2>Erschaffe deinen Helden</h2>
            <p className="muted">Wähle Name und Klasse – deine Reise beginnt.</p>

            <form onSubmit={handleHeroCreate} className="stack">
              <label>
                Heldenname
                <input
                  type="text"
                  value={heroName}
                  maxLength={20}
                  placeholder="z. B. Kleebart der Tapfere"
                  onChange={(e) => setHeroName(e.target.value)}
                  autoFocus
                />
              </label>

              <div className="class-grid">
                {HERO_CLASS_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`class-card${selectedClass === option.id ? " selected" : ""}`}
                    onClick={() => setSelectedClass(option.id)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </button>
                ))}
              </div>

              {error && <p className="error">{error}</p>}

              <button type="submit" className="btn primary" disabled={busy || !selectedClass}>
                {busy ? "Wird erstellt …" : "Held erschaffen"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}