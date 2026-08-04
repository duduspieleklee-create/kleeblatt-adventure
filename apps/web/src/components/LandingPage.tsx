import { useEffect, useRef } from "react";

interface LandingPageProps {
  onPlay: () => void;
}

const features = [
  { icon: "⚔️", title: "Klassisches RPG", desc: "3 Heldenklassen, Skills, Loot und Level-System" },
  { icon: "🗺️", title: "Offene Welt", desc: "Erkunde Dörfer, Wälder und Höhlen" },
  { icon: "🎒", title: "Inventar & Ausrüstung", desc: "Sammle Items, rüste dich aus, werde stärker" },
];

export function LandingPage({ onPlay }: LandingPageProps) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bgRef.current) return;
    const el = bgRef.current;
    const handleScroll = () => {
      const y = window.scrollY;
      el.style.transform = `translateY(${y * 0.3}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing">
      <div className="landing-bg" ref={bgRef}>
        <div className="landing-tiles" />
        <div className="landing-vignette" />
      </div>

      <div className="landing-content">
        <div className="landing-hero">
          <h1 className="landing-title">Kleeblatt Adventure</h1>
          <p className="landing-subtitle">Ein 2D-Browser-RPG mit offener Welt und echter Ausrüstung.</p>
        </div>

        <button type="button" className="btn-play" onClick={onPlay}>
          <span className="btn-play-icon">▶</span>
          Abenteuer starten
        </button>

        <div className="landing-features">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}