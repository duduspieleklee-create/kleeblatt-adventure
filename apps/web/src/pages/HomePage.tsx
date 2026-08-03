import { StatusCard } from "../components/StatusCard";
import { NextStepsCard } from "../components/NextStepsCard";
import { AuthCard } from "../components/AuthCard";
import { useHealth } from "../hooks/useHealth";
import { useMe } from "../hooks/useMe";

const showDevLogin = import.meta.env.DEV;

export function HomePage() {
  const health = useHealth();
  const { state, logout } = useMe();

  return (
    <div className="app">
      <header>
        <h1>Kleeblatt Adventure</h1>
        <p className="tag">Prototyp – P1 Auth</p>
      </header>
      <main>
        <StatusCard health={health} />
        <AuthCard state={state} onLogout={() => void logout()} showDevLogin={showDevLogin} />
        <NextStepsCard />
      </main>
    </div>
  );
}
