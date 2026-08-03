import { StatusCard } from "../components/StatusCard";
import { NextStepsCard } from "../components/NextStepsCard";
import { useHealth } from "../hooks/useHealth";

export function HomePage() {
  const health = useHealth();

  return (
    <div className="app">
      <header>
        <h1>Kleeblatt Adventure</h1>
        <p className="tag">Prototyp-Shell (React + Phaser folgt)</p>
      </header>
      <main>
        <StatusCard health={health} />
        <NextStepsCard />
      </main>
    </div>
  );
}
