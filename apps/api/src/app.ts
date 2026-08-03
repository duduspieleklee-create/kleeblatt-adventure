import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env.js";
import { loadSession, type AppVariables } from "./middleware/session.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { meRoutes } from "./routes/me.js";

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use(
    "*",
    cors({
      origin: env.corsOrigin,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.use("*", loadSession);

  app.route("/", healthRoutes);
  app.route("/", authRoutes);
  app.route("/", meRoutes);

  return app;
}
