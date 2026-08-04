import { useEffect, useRef } from "react";

interface LandingPageProps {
  onPlay: () => void;
}

const features = [
  {
    icon: "assets/ui/icon_swords.png",
    title: "Klassisches RPG",
    desc: "3 Heldenklassen, Skills, Loot und Level-System",
  },
  {
    icon: "assets/ui/icon_map.png",
    title: "Offene Welt",
    desc: "Erkunde Dörfer, Wälder und Höhlen",
  },
  {
    icon: "assets/ui/icon_backpack.png",
    title: "Inventar & Ausrüstung",
    desc: "Sammle Items, rüste dich aus, werde stärker",
  },
];

export function LandingPage({ onPlay }: LandingPageProps) {
  const smokeRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (smokeRef.current) {
        smokeRef.current.style.animation = "none";
        void smokeRef.current.offsetWidth;
        smokeRef.current.style.animation = "";
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-pixel">
      <div className="landing-pixel-bg" />

      {/* Animated smoke from hut chimney */}
      <img
        ref={smokeRef}
        src="assets/elements/smoke.png"
        alt=""
        className="landing-pixel-smoke"
      />

      {/* Campfire flicker */}
      <div className="landing-pixel-fire">
        <img src="assets/elements/fire.png" alt="" className="landing-pixel-fire-img" />
      </div>

      {/* Clouds */}
      <img src="assets/elements/cloud1.png" alt="" className="landing-pixel-cloud cloud-1" />
      <img src="assets/elements/cloud2.png" alt="" className="landing-pixel-cloud cloud-2" />

      {/* Goblin peeking */}
      <img
        src="assets/characters/goblin_hidden.png"
        alt=""
        className="landing-pixel-goblin"
      />

      {/* Wanderer sitting by fire */}
      <img
        src="assets/characters/wanderer_sitting.png"
        alt=""
        className="landing-pixel-wanderer"
      />

      <div className="landing-pixel-content">
        {/* Logo area */}
        <div className="landing-pixel-logo">
          <img
            src="assets/ui/logo_bird_right.png"
            alt=""
            className="landing-pixel-bird"
          />
          <h1 className="landing-pixel-title">Kleeblatt Adventure</h1>
        </div>

        <p className="landing-pixel-subtitle">
          Ein 2D-Browser-RPG mit offener Welt<br />
          und echter Ausrüstung.
        </p>

        {/* Start button */}
        <button type="button" className="landing-pixel-btn" onClick={onPlay}>
          <span className="landing-pixel-btn-inner">Abenteuer starten</span>
        </button>

        {/* Feature panels */}
        <div className="landing-pixel-features">
          {features.map((f) => (
            <div key={f.title} className="feature-panel">
              <img src={f.icon} alt="" className="feature-panel-icon" />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}