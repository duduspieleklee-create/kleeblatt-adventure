import { useCallback } from "react";

interface NeulingIntroProps {
  onComplete: () => void;
}

export function NeulingIntro({ onComplete }: NeulingIntroProps) {
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel intro-panel">
        <h2>Dein Account ist bereit</h2>
        <p>Seltene Items kannst du später optional sichern – musst du nicht.</p>
        <div className="intro-steps">
          <div className="intro-step">
            <span className="step-icon">⚔️</span>
            <div>
              <strong>WASD</strong> zum Bewegen, <strong>Maus</strong> zum Zielen
            </div>
          </div>
          <div className="intro-step">
            <span className="step-icon">🎯</span>
            <div>
              Besiege Gegner, sammle Loot und werde stärker
            </div>
          </div>
        </div>
        <button type="button" className="btn primary intro-cta" onClick={handleComplete}>
          Match starten
        </button>
      </div>
    </div>
  );
}