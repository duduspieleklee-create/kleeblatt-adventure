import { getRequestListener } from "@hono/node-server";
import { createServer, type Server as HttpServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { runMigrationsIfAvailable } from "./db/migrate.js";
import { isDbAvailable } from "./db/client.js";
import { Server, Room, type Client } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Schema } from "@colyseus/schema";
import { IslandRoomState, ChatMessage } from "@kleeblatt/shared";

class IslandRoom extends Room {
  private names = new Map<string, string>();
  private lastMsg = new Map<string, number>();

  onCreate() {
    this.setState(new IslandRoomState());
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
      const clean = text.replace(/[\u0000-\u001F\u007F]/g, "");
      if (!clean) return;
      // c. Rate-limit: at most one message per 300ms per session.
      const now = Date.now();
      const last = this.lastMsg.get(client.sessionId) ?? 0;
      if (now - last < 300) return;
      this.lastMsg.set(client.sessionId, now);
      // d. Broadcast.
      const msg = new ChatMessage();
      msg.sessionId = client.sessionId;
      msg.name = this.names.get(client.sessionId) ?? "Guest";
      msg.text = clean;
      msg.ts = now;
      this.state.messages.push(msg);
      // e. Cap history at 50 messages.
      while (this.state.messages.length > 50) {
        this.state.messages.shift();
      }
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
const httpServer: HttpServer = createServer();

// Colyseus transport attaches to the SAME http.Server (WebSocket upgrade).
const transport = new WebSocketTransport({ server: httpServer });

const gameServer = new Server({
  transport,
  // Provide an express app so Colyseus mounts its matchmaking router on it and
  // falls back to that app for non-Colyseus routes. We then delegate that
  // fallback to Hono, keeping the existing REST API on the same port.
  express: () => {},
});
gameServer.define("island", IslandRoom);

// serverless() binds the matchmaking routes + WS upgrade listener to the
// existing http.Server WITHOUT calling listen() again.
await gameServer.serverless();

// Delegate every non-Colyseus request back through Hono's request listener.
const colyseusExpressApp = transport.getExpressApp();
colyseusExpressApp.use((_req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => {
  void honoListener(_req, res);
});

httpServer.listen(env.port, () => {
  console.info(
    `API listening on http://localhost:${env.port} (Hono + Colyseus, single port)`,
  );
});
