import { useCallback } from "react";

interface ExperteIntroProps {
  onComplete: () => void;
}

const bullets = [
  "An deinem Login hängt eine sichere Embedded Wallet – du musst keinen Seed verwalten.",
  "Seltene Items kannst du optional on-chain sichern (NFT).",
  "Gesicherte Items kannst du zum Spielen aktivieren und später auf eine eigene Wallet claimen.",
  "Im Shop gibt es Item-Sicherungen & Kosmetik – keine frei auszahlbaren Token-Pakete.",
  "Token verdienst du vor allem im Spiel und über die Wirtschaft.",
];

export function ExperteIntro({ onComplete }: ExperteIntroProps) {
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel intro-panel">
        <h2>Dein Account ist bereit</h2>
        <ul className="intro-bullets">
          {bullets.map((b, i) => (
            <li key={i}>
              <span className="bullet-icon">✓</span>
              {b}
            </li>
          ))}
        </ul>
        <button type="button" className="btn primary intro-cta" onClick={handleComplete}>
          Ins Spiel
        </button>
      </div>
    </div>
  );
}