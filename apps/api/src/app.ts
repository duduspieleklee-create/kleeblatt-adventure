import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env.js";
import { healthRoutes } from "./routes/health.js";

export function createApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: env.corsOrigin,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.route("/", healthRoutes);

  return app;
}
