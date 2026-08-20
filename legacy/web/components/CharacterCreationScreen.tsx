import { useState } from "react";
import { HERO_CLASS_OPTIONS, type HeroClass, type HeroResponse } from "@kleeblatt/shared";
import { createHero } from "../lib/api";

interface CharacterCreationScreenProps {
  onCreated: (hero: HeroResponse) => void;
  onCancel: () => void;
}

export function CharacterCreationScreen({ onCreated, onCancel }: CharacterCreationScreenProps) {
  const [heroName, setHeroName] = useState("");
  const [selectedClass, setSelectedClass] = useState<HeroClass | null>(null);
  const [customization, setCustomization] = useState({
    hairStyle: "short",
    skinTone: "medium",
    clothing: "basic"
  });
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
    
    // In a real implementation, we would send the customization options to the backend
    // For now, we'll just proceed with the basic hero creation
    const result = await createHero({ 
      heroName: heroName.trim(), 
      class: selectedClass 
    });
    setBusy(false);
    if (result.ok) {
      onCreated(result.data);
    } else {
      setError(result.message);
    }
  }

  const handleHairStyleChange = (style: string) => {
    setCustomization(prev => ({ ...prev, hairStyle: style }));
  };

  const handleSkinToneChange = (tone: string) => {
    setCustomization(prev => ({ ...prev, skinTone: tone }));
  };

  const handleClothingChange = (clothing: string) => {
    setCustomization(prev => ({ ...prev, clothing: clothing }));
  };

  return (
    <div className="character-creation-screen">
      <div className="card">
        <h2>Charakter erstellen</h2>
        <p className="tag">Wähle Name, Klasse und passe dein Aussehen an</p>

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

          <div className="customization-section">
            <h3>Aussehen anpassen</h3>
            
            <div className="customization-option">
              <label>Haarstil</label>
              <div className="hair-style-options">
                {['short', 'long', 'curly', 'bald'].map(style => (
                  <button
                    key={style}
                    type="button"
                    className={`hair-style${customization.hairStyle === style ? " selected" : ""}`}
                    onClick={() => handleHairStyleChange(style)}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="customization-option">
              <label>Skin-Ton</label>
              <div className="skin-tone-options">
                {['light', 'medium', 'dark'].map(tone => (
                  <button
                    key={tone}
                    type="button"
                    className={`skin-tone${customization.skinTone === tone ? " selected" : ""}`}
                    onClick={() => handleSkinToneChange(tone)}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="customization-option">
              <label>Kleidung</label>
              <div className="clothing-options">
                {['basic', 'armored', 'robed', 'casual'].map(clothing => (
                  <button
                    key={clothing}
                    type="button"
                    className={`clothing${customization.clothing === clothing ? " selected" : ""}`}
                    onClick={() => handleClothingChange(clothing)}
                  >
                    {clothing.charAt(0).toUpperCase() + clothing.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="button-group">
            <button type="button" className="secondary" onClick={onCancel}>
              Abbrechen
            </button>
            <button type="submit" className="primary" disabled={busy || !selectedClass}>
              {busy ? "Wird erstellt …" : "Held erschaffen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}