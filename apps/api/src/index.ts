import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

const port = Number(process.env.API_PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(
  "*",
  cors({
    origin: corsOrigin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "kleeblatt-api",
    time: new Date().toISOString(),
  })
);

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    service: "kleeblatt-api",
    time: new Date().toISOString(),
  })
);

console.log(`API listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
