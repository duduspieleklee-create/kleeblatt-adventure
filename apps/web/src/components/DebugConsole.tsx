import { useState, useEffect, useRef, useCallback } from "react";
import { gameBridge } from "@kleeblatt/shared";

type LogLevel = "info" | "warn" | "error" | "event" | "action";

interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  msg: string;
}

let logCounter = 0;

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "#8fa88f",
  warn: "#ccaa00",
  error: "#ff4444",
  event: "#44aacc",
  action: "#cc88ff",
};

const LEVEL_BG: Record<LogLevel, string> = {
  info: "transparent",
  warn: "#ccaa0018",
  error: "#ff444418",
  event: "#44aacc18",
  action: "#cc88ff18",
};

export function DebugConsole() {
  const [open, setOpen] = useState(false);
  const [verbose, setVerbose] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<LogEntry[]>([]);

  const addLog = useCallback((level: LogLevel, msg: string) => {
    const entry: LogEntry = {
      id: logCounter++,
      time: new Date().toISOString().slice(11, 19) + "." + String(new Date().getMilliseconds()).padStart(3, "0"),
      level,
      msg,
    };
    logsRef.current = [...logsRef.current.slice(-499), entry];
    setLogs(logsRef.current);
  }, []);

  useEffect(() => {
    /* eslint-disable no-console */
    const origError = console.error;
    const origWarn = console.warn;
    const origLog = console.log;

    console.error = (...args: unknown[]) => {
      addLog("error", args.map(String).join(" "));
      origError.apply(console, args);
    };
    console.warn = (...args: unknown[]) => {
      addLog("warn", args.map(String).join(" "));
      origWarn.apply(console, args);
    };
    if (verbose) {
      console.log = (...args: unknown[]) => {
        addLog("info", args.map(String).join(" "));
        origLog.apply(console, args);
      };
    } else {
      console.log = origLog;
    }

    addLog("info", "Debug console active" + (verbose ? " [VERBOSE]" : ""));

    const eventNames = [
      "player:hp", "player:resource", "player:level", "player:death", "player:respawn",
      "enemy:died", "enemy:damaged", "loot:received", "match:started", "match:ended",
      "skill:cooldown", "skill:used", "chest:opened",
      "match:start", "match:exit", "loadout:update", "pause", "resume",
    ] as const;

    const handlers: Record<string, (p: unknown) => void> = {};
    eventNames.forEach((name) => {
      handlers[name] = (payload) => {
        const tag = name.includes(":") && ["match:start", "match:exit", "loadout:update", "pause", "resume"].includes(name) ? "action" : "event";
        addLog(tag as LogLevel, `${name}: ${JSON.stringify(payload).slice(0, 200)}`);
      };
      gameBridge.on(name, handlers[name]);
    });

    addLog("info", `Listening to ${eventNames.length} gameBridge events`);

    return () => {
      console.error = origError;
      console.warn = origWarn;
      console.log = origLog;
      eventNames.forEach((name) => {
        gameBridge.off(name, handlers[name]);
      });
    };
    /* eslint-enable no-console */
  }, [verbose, addLog]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, open]);

  const filteredLogs = verbose ? logs : logs.filter((l) => l.level !== "info");

  return (
    <div className={`debug-console ${open ? "debug-console-open" : ""}`}>
      <button className="debug-console-toggle" onClick={() => setOpen(!open)}>
        <span className="debug-toggle-icon">{open ? "▼" : "▶"}</span>
        Debug ({logs.length})
        {verbose && <span className="debug-verbose-badge">VERBOSE</span>}
      </button>

      {open && (
        <div className="debug-console-body">
          <div className="debug-toolbar">
            <label className="debug-toggle-label">
              <input
                type="checkbox"
                checked={verbose}
                onChange={(e) => setVerbose(e.target.checked)}
              />
              Verbose (all logs)
            </label>
            <button
              type="button"
              className="debug-clear-btn"
              onClick={() => {
                logsRef.current = [];
                setLogs([]);
              }}
            >
              Clear
            </button>
          </div>
          <div className="debug-log-scroll" ref={scrollRef}>
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`debug-entry debug-entry-${log.level}`}
              >
                <span className="debug-time">{log.time}</span>
                <span
                  className="debug-tag"
                  style={{ color: LEVEL_COLORS[log.level], background: LEVEL_BG[log.level] }}
                >
                  [{log.level}]
                </span>
                <span className="debug-msg" style={{ color: LEVEL_COLORS[log.level] }}>
                  {log.msg}
                </span>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="debug-empty">
                {verbose ? "No logs yet." : "No warnings or errors. Enable verbose for all logs."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}