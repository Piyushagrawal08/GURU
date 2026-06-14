/**
 * Public Supabase credentials, read once here so every client agrees.
 *
 * The browser key is accepted under either name: the newer
 * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or the legacy
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This keeps deploys working regardless of
 * which name the host's env vars use. Both `process.env.*` references stay
 * literal so Next can inline them into the client bundle at build time.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True when both public credentials are present. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
