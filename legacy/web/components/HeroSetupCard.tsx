import { useState } from "react";
import { HERO_CLASS_OPTIONS, type HeroClass, type HeroResponse } from "@kleeblatt/shared";
import { createHero } from "../lib/api";

interface HeroSetupCardProps {
  onCreated: (hero: HeroResponse) => void;
}

export function HeroSetupCard({ onCreated }: HeroSetupCardProps) {
  const [heroName, setHeroName] = useState("");
  const [selectedClass, setSelectedClass] = useState<HeroClass | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedClass || heroName.trim().length < 2) {
      setError("Bitte Name (2–20 Zeichen) und Klasse wählen.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await createHero({ heroName: heroName.trim(), class: selectedClass });
    setBusy(false);
    if (result.ok) {
      onCreated(result.data);
    } else {
      setError(result.message);
    }
  }

  return (
    <section className="card">
      <h2>Erschaffe deinen Helden</h2>
      <p className="tag">Wähle Name und Klasse – deine Reise beginnt.</p>

      <form onSubmit={(e) => void handleSubmit(e)} className="stack">
        <label>
          Heldenname
          <input
            type="text"
            value={heroName}
            maxLength={20}
            placeholder="z. B. Kleebart der Tapfere"
            onChange={(e) => setHeroName(e.target.value)}
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

        <button type="submit" className="primary" disabled={busy || !selectedClass}>
          {busy ? "Wird erstellt …" : "Held erschaffen"}
        </button>
      </form>
    </section>
  );
}
