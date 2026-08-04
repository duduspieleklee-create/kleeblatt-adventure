import { useCallback } from "react";
import type { OnboardingPath } from "@kleeblatt/shared";

interface OnboardingChoiceProps {
  onChoose: (path: OnboardingPath) => void;
}

export function OnboardingChoice({ onChoose }: OnboardingChoiceProps) {
  const handleChoose = useCallback(
    (path: OnboardingPath) => {
      onChoose(path);
    },
    [onChoose],
  );

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel onboarding-choice">
        <h2>Wie willst du starten?</h2>
        <p className="muted">Wähle deinen Einstieg – du kannst ihn später ändern.</p>

        <div className="choice-cards">
          <button
            type="button"
            className="choice-card casual"
            onClick={() => handleChoose("casual")}
          >
            <span className="choice-icon">🎮</span>
            <strong>Einfach spielen</strong>
            <span className="choice-desc">Wenig Erklärung, direkt ins Spiel</span>
          </button>

          <button
            type="button"
            className="choice-card expert"
            onClick={() => handleChoose("expert")}
          >
            <span className="choice-icon">🔑</span>
            <strong>Ownership kurz erklären</strong>
            <span className="choice-desc">Wallet, Sichern, Claim in 30 Sekunden</span>
          </button>
        </div>
      </div>
    </div>
  );
}