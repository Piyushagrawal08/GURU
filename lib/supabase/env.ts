/**
 * Public Supabase credentials, read once here so every client agrees.
 *
 * These values are *public by design*: the project URL and the anon
 * (publishable) key are shipped to the browser in every Supabase app, and the
 * database is protected by Row-Level Security — not by hiding these. So we fall
 * back to the project's known values when the host's env vars are missing or
 * mis-scoped, which keeps production working regardless of the deploy config.
 *
 * To point this app at a *different* Supabase project, set the env vars (or
 * edit the defaults below). The browser key is accepted under either name:
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
 */
const DEFAULT_SUPABASE_URL = "https://bcqoqpvkerbkxbccpxcm.supabase.co";
const DEFAULT_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcW9xcHZrZXJia3hiY2NweGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MDIzOTEsImV4cCI6MjA5Njk3ODM5MX0.ZrOJRKFW2mnFSYPvr0DvyfKONTv2_y40aMcm1WJnm4Y";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_SUPABASE_KEY;

/** True when both public credentials are present (always true via defaults). */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
