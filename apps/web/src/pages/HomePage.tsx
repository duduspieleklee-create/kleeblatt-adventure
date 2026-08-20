import { useMe } from "../hooks/useMe";
import { TopBar } from "../components/TopBar";
import { GamePage } from "./GamePage";

/**
 * HomePage — minimal shell. All gameplay UI (quests, dialog, menus) runs
 * inside Phaser scenes. React only renders the TopBar (user info + logout)
 * and the Phaser game container.
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
      <div className="app-body game-wrapper">
        <GamePage />
      </div>
    </div>
  );
}
