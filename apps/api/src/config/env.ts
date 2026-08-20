/** Process env with defaults for local prototype */

function requiredInProd(name: string, value: string | undefined): string {
  const v = value ?? "";
  if (!v && process.env.NODE_ENV === "production") {
    console.warn(`[env] ${name} is empty – auth will fail until set`);
  }
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.API_PORT ?? process.env.PORT_API ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? process.env.WEB_URL ?? "http://localhost:5173",
  webUrl: process.env.WEB_URL ?? "http://localhost:5173",
  apiUrl: process.env.API_URL ?? "http://localhost:4000",
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  sessionSecret: requiredInProd(
    "SESSION_SECRET",
    process.env.SESSION_SECRET ||
      (process.env.NODE_ENV === "production" ? "" : "dev-only-session-secret-change-me-32b"),
  ),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:4000/auth/google/callback",
  /** When true in development, enables GET /auth/dev-login (no Google). */
  authDevBypass: process.env.AUTH_DEV_BYPASS === "true",
  /** Supabase Auth (self-hosted) — used for Web3/SIWE authentication. */
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseAuthUrl: process.env.SUPABASE_AUTH_URL ?? "",
} as const;

export const sessionCookie = {
  name: "kleeblatt_session",
  ttlSeconds: 60 * 60 * 24 * 7, // 7 days
  sameSite: "Lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
