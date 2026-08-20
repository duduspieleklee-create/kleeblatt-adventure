import { useState } from "react";
import { QuestPanel } from "./QuestPanel";
import { ChatWidget } from "./ChatWidget";
import type Phaser from "phaser";

interface ShortcutRailProps {
  /** Phaser game instance, forwarded to the ChatWidget for scale-aware sizing. */
  game: Phaser.Game | null;
}

/**
 * Left-edge floating shortcut rail. Item 1 = questbook 📖, Item 2 = chat 💬
 * directly BELOW it. The rail container is pointer-events:none so the Phaser
 * canvas keeps receiving game input; only the buttons and the open panels
 * capture pointer events.
 */
export function ShortcutRail({ game }: ShortcutRailProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);

  return (
    <div className="shortcut-rail">
      <div className="shortcut-rail-buttons">
        <button
          type="button"
          className="shortcut-btn"
          aria-label="Questbuch"
          aria-pressed={questsOpen}
          onClick={() => setQuestsOpen((v) => !v)}
          onMouseDown={(e) => e.preventDefault()}
        >
          📖
        </button>
        <button
          type="button"
          className="shortcut-btn"
          aria-label="Chat"
          aria-pressed={chatOpen}
          onClick={() => setChatOpen((v) => !v)}
          onMouseDown={(e) => e.preventDefault()}
        >
          💬
        </button>
      </div>

      {questsOpen && (
        <div className="shortcut-panel shortcut-panel-quests">
          <QuestPanel />
        </div>
      )}

      {chatOpen && <ChatWidget game={game} onClose={() => setChatOpen(false)} />}
    </div>
  );
}
