import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for Web3/SIWE authentication.
 *
 * Auth endpoints are proxied through Caddy: /auth/v1/* → Supabase Kong gateway.
 * The client URL points to the same origin so cookies and CORS work seamlessly.
 *
 * Email/password and Google OAuth continue to use the existing Hono JWT
 * session system via /api/* — this client is only for wallet-based auth
 * (signInWithWeb3) and identity linking (linkIdentity).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabaseClient] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — Web3 auth unavailable",
  );
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
