import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function App() {
  const [health, setHealth] = useState<string>("…");

  useEffect(() => {
    const url = API_URL ? `${API_URL}/health` : "/health";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setHealth(d.status === "ok" ? "API online" : JSON.stringify(d)))
      .catch(() => setHealth("API nicht erreichbar (npm run dev:api?)"));
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Kleeblattadventure</h1>
        <p className="tag">Prototyp-Shell (React + Phaser folgt)</p>
      </header>
      <main>
        <section className="card">
          <h2>Status</h2>
          <p>
            Backend: <strong>{health}</strong>
          </p>
          <p className="hint">
            Docs: <code>docs/architecture/20-prototyp-checkliste.md</code>
          </p>
        </section>
        <section className="card muted">
          <h2>Als Nächstes</h2>
          <ol>
            <li>Auth (P1)</li>
            <li>Held erstellen (P2)</li>
            <li>Phaser MatchScene (P4)</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
