import { Hono } from "hono";
import type { HealthResponse } from "@kleeblatt/shared";

export const healthRoutes = new Hono();

function healthBody(): HealthResponse {
  return {
    status: "ok",
    service: "kleeblatt-api",
    time: new Date().toISOString(),
  };
}

healthRoutes.get("/health", (c) => c.json(healthBody()));
healthRoutes.get("/api/health", (c) => c.json(healthBody()));
