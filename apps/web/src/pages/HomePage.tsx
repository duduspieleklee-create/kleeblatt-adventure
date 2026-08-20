import { useMe } from "../hooks/useMe";
import { TopBar } from "../components/TopBar";
import { DebugConsole } from "../components/DebugConsole";
import { GamePage } from "./GamePage";

/**
 * HomePage — minimal shell. All auth, character creation, and onboarding
 * now happen inside Phaser scenes (LoginScene, CharacterCreationScene).
 * React only provides the page container + optional TopBar (logout).
 */
export function HomePage() {
  const { state: meState, logout } = useMe();

  return (
    <div className="app-shell">
      {meState.status === "authenticated" && (
        <TopBar
          meState={meState}
          hero={null}
          walletAddress={undefined}
          onLogout={() => void logout()}
        />
      )}
      <div className="app-body game_wrapper">
        <GamePage />
      </div>
      <DebugConsole />
    </div>
  );
}
