import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env.js";
import { loadSession, type AppVariables } from "./middleware/session.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { meRoutes } from "./routes/me.js";
import { heroRoutes } from "./routes/hero.js";
import { inventoryRoutes } from "./routes/inventory.js";
import { walletRoutes } from "./routes/wallet.js";
import { matchRoutes } from "./routes/match.js";
import { onboardingRoutes } from "./routes/onboarding.js";

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

  // Routen-Bündel: wird doppelt gemountet (siehe unten).
  const routes = new Hono<{ Variables: AppVariables }>();
  routes.route("/", healthRoutes);
  routes.route("/", authRoutes);
  routes.route("/", meRoutes);
  routes.route("/", heroRoutes);
  routes.route("/", inventoryRoutes);
  routes.route("/", walletRoutes);
  routes.route("/", matchRoutes);
  routes.route("/", onboardingRoutes);

  // Legacy-Root-Pfade (nginx proxied /health, /auth/*, /me am Root)
  // UND dokumentierte /api-Architektur (Web → /api/* → nginx → API,
  // siehe DEPLOYMENT.md) – so funktionieren alle Endpoints über /api.
  app.route("/", routes);
  app.route("/api", routes);

  return app;
}