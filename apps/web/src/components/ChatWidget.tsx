import { useEffect, useRef, useState } from "react";
import { gameBridge } from "../lib/gameBridge";
import type Phaser from "phaser";

interface ChatMessage {
  name: string;
  text: string;
  ts: number;
}

interface ChatWidgetProps {
  /** Phaser game instance, used to drive scale-aware sizing (T5). */
  game: Phaser.Game | null;
  /** Called when the panel should close (Escape, blur, or close button). */
  onClose: () => void;
}

const MAX_MESSAGES = 50;

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Floating chat panel. Receives messages through the cross-layer `gameBridge`
 * ("chat:message") and sends through "chat:send". Sizing is driven by the
 * Phaser ScaleManager resize (T5): the canvas displaySize is written to the
 * `--chat-w` / `--chat-h` CSS custom properties on the widget root, and the
 * CSS clamps the panel against those (not the viewport).
 */
export function ChatWidget({ game, onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Receive incoming chat messages (cap to last MAX_MESSAGES).
  useEffect(() => {
    const handler = (payload: { name: string; text: string; ts: number }) => {
      setMessages((prev) => {
        const next = [...prev, { name: payload.name, text: payload.text, ts: payload.ts }];
        return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
      });
    };
    gameBridge.on("chat:message", handler);
    return () => gameBridge.off("chat:message", handler);
  }, []);

  // T5: scale-aware sizing — subscribe to the Phaser ScaleManager resize and
  // write the letterboxed canvas displaySize into CSS custom properties.
  useEffect(() => {
    if (!game) return;
    const updateSize = () => {
      const root = rootRef.current;
      if (!root) return;
      const ds = game.scale.displaySize;
      root.style.setProperty("--chat-w", String(ds.width));
      root.style.setProperty("--chat-h", String(ds.height));
    };
    updateSize();
    game.scale.on("resize", updateSize);
    return () => {
      game.scale.off("resize", updateSize);
    };
  }, [game]);

  // Auto-scroll to bottom when new messages arrive.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    gameBridge.emit("chat:send", { text });
    setDraft("");
  };

  return (
    <div className="chat-widget" ref={rootRef}>
      <div className="chat-widget-header">
        <span className="chat-widget-title">Chat</span>
        <button
          type="button"
          className="chat-widget-close"
          onClick={onClose}
          aria-label="Chat schließen"
        >
          ×
        </button>
      </div>

      <div className="chat-widget-list" ref={listRef}>
        {messages.length === 0 ? (
          <p className="chat-widget-empty">Noch keine Nachrichten</p>
        ) : (
          messages.map((m, i) => (
            <div key={`${m.ts}-${i}`} className="chat-widget-msg">
              <span className="chat-widget-name">{m.name}</span>
              <span className="chat-widget-time">{formatTime(m.ts)}</span>
              <span className="chat-widget-text">{m.text}</span>
            </div>
          ))
        )}
      </div>

      <input
        className="chat-widget-input"
        type="text"
        value={draft}
        placeholder="Nachricht senden…"
        maxLength={200}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            send();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
        onBlur={onClose}
      />
    </div>
  );
}
