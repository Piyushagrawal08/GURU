import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * The server's secret Supabase key. Unlike the anon key in `env.ts`, this one
 * bypasses Row-Level Security, so it must never reach the browser: it is read
 * only from a non-`NEXT_PUBLIC_` env var, and this module is server-only.
 * Accepts the legacy `service_role` key or a new-style `sb_secret_…` key.
 */
export function getServiceKey(): string | null {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || null
  );
}

/** Admin Supabase client, or null when the secret key isn't configured. */
export function createAdminClient() {
  const key = getServiceKey();
  if (!key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
