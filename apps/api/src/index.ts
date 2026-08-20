import { getRequestListener } from "@hono/node-server";
import { createServer, type Server as HttpServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { runMigrationsIfAvailable } from "./db/migrate.js";
import { isDbAvailable } from "./db/client.js";
import { Server, Room, type Client } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import type { ChatMessage } from "@kleeblatt/shared";

class IslandRoom extends Room {
  private names = new Map<string, string>();
  private lastMsg = new Map<string, number>();
  private backlog: ChatMessage[] = [];

  onCreate() {
    // No schema state: chat is relayed via messages (robust against
    // @colyseus/schema version skew). Player/sync state can be added later
    // with a pinned schema.
    this.onMessage("chat", (client: Client, message: unknown) => {
      // a. Guard: must be an object with a string `text`.
      if (
        typeof message !== "object" ||
        message === null ||
        typeof (message as { text?: unknown }).text !== "string"
      ) {
        return;
      }
      // b. Validate + trim + cap length, then strip control chars.
      const text = ((message as { text: string }).text).trim().slice(0, 200);
      const clean = text.replace(/[\u0000-\u001f\u007f]/g, "");
      if (!clean) return;
      // c. Rate-limit: at most one message per 300ms per session.
      const now = Date.now();
      const last = this.lastMsg.get(client.sessionId) ?? 0;
      if (now - last < 300) return;
      this.lastMsg.set(client.sessionId, now);
      // d. Build + store + broadcast.
      const msg: ChatMessage = {
        sessionId: client.sessionId,
        name: this.names.get(client.sessionId) ?? "Guest",
        text: clean,
        ts: now,
      };
      this.backlog.push(msg);
      while (this.backlog.length > 50) this.backlog.shift();
      this.broadcast("chat", msg);
    });

    // Backlog is requested explicitly (after the client has registered its
    // "history" handler) to avoid a race where onJoin's push arrives before
    // the client is listening. See MultiplayerManager.connect().
    this.onMessage("requestHistory", (client: Client) => {
      client.send("history", this.backlog);
    });
  }

  onJoin(client: Client, options?: { name?: unknown }) {
    const raw = options?.name;
    const name =
      typeof raw === "string" && raw.trim()
        ? raw.trim().slice(0, 24)
        : `Guest-${client.sessionId.slice(0, 4)}`;
    this.names.set(client.sessionId, name);
    console.info(
      `[colyseus] client joined island room: ${client.sessionId} as ${name}`,
    );
  }

  onLeave(client: Client) {
    this.names.delete(client.sessionId);
    this.lastMsg.delete(client.sessionId);
  }
}

const app = createApp();

// Migrationen anwenden, falls Postgres erreichbar (Prototyp: sonst In-Memory).
await runMigrationsIfAvailable();

// Auth-Startup-Summary (keine Secrets) – hilft bei Produktions-Diagnose.
console.info(
  `[auth] googleConfigured=${Boolean(env.googleClientId && env.googleClientSecret)} ` +
    `callbackUrl=${env.googleCallbackUrl} webUrl=${env.webUrl} cookieSecure=${env.nodeEnv === "production"} db=${(await isDbAvailable()) ? "postgres" : "memory"}`,
);

// Build Hono's Node request listener so we control HTTP dispatch order.
const honoListener = getRequestListener(app.fetch);

// Single HTTP server shared by Hono (REST) and Colyseus (matchmaking + WS).
// No second port: Colyseus attaches to this exact server instance.
// Register Hono as the default request handler FIRST, so Colyseus.attach()
// can wrap it and forward every non-/matchmake request back to Hono.
const httpServer: HttpServer = createServer();
httpServer.on("request", honoListener);

// Colyseus transport attaches to the SAME http.Server (WebSocket upgrade).
const transport = new WebSocketTransport({ server: httpServer });

const gameServer = new Server({ transport });
gameServer.define("island", IslandRoom);

// NOTE: Server's constructor calls attach() internally using `transport.server`
// (our httpServer). attach() wraps the Hono request listener registered above
// and forwards every non-/matchmake request back to Hono. Do NOT call
// gameServer.attach() again here — that would run without a `transport` and throw.
// Non-/matchmake traffic is delegated back to the Hono listener registered above.

httpServer.listen(env.port, () => {
  console.info(
    `API listening on http://localhost:${env.port} (Hono + Colyseus, single port)`,
  );
});
