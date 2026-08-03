/** Process env with defaults for local prototype */

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.API_PORT ?? process.env.PORT_API ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? process.env.WEB_URL ?? "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "",
} as const;
