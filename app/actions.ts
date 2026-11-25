"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearResetPass, grantResetPass, hasResetPass } from "@/lib/password-reset";
import { fetchLinkMeta } from "@/lib/metadata";

export type ActionResult = { ok: boolean; error?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/)
        .map((t) => t.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

function parseDay(raw: FormDataEntryValue | null): number | null {
  if (!raw || typeof raw !== "string" || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

const looksLikeUrl = (s: string) => /^https?:\/\/\S+$/i.test(s.trim());

/**
 * Unified "save anything" action. Accepts:
 *  - a file (pdf/image)  → uploaded to private storage
 *  - a URL               → link/repo, with fetched OG metadata
 *  - free text           → a note
 */
export async function addItem(formData: FormData): Promise<ActionResult> {
  let supabase, user;
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { ok: false, error: "Please sign in again." };
  }

  const tags = parseTags(formData.get("tags"));
  const day = parseDay(formData.get("day"));
  const forced = formData.get("kind"); // "note" forces a note
  const file = formData.get("file");
  const text = (formData.get("text") as string | null)?.trim() ?? "";
  const titleInput = (formData.get("title") as string | null)?.trim() || null;

  try {
    // 1) File upload (image or pdf)
    if (file instanceof File && file.size > 0) {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      const isImage = file.type.startsWith("image/");
      if (!isPdf && !isImage) {
        return { ok: false, error: "Only images and PDFs can be uploaded." };
      }
      if (file.size > 25 * 1024 * 1024) {
        return { ok: false, error: "File is larger than 25 MB." };
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("vault")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };

      const { error } = await supabase.from("items").insert({
        type: isPdf ? "pdf" : "image",
        title: titleInput ?? file.name,
        description: text || null,
        file_path: path,
        tags,
        day,
      });
      if (error) return { ok: false, error: error.message };

      revalidatePath("/");
      return { ok: true };
    }

    if (!text) return { ok: false, error: "Nothing to save yet." };

    // 2) URL → link / repo
    if (forced !== "note" && looksLikeUrl(text)) {
      const meta = await fetchLinkMeta(text);
      const { error } = await supabase.from("items").insert({
        type: meta.type,
        title: titleInput ?? meta.title,
        url: text,
        description: meta.description,
        image_url: meta.image_url,
        domain: meta.domain,
        tags,
        day,
      });
      if (error) return { ok: false, error: error.message };

      revalidatePath("/");
      return { ok: true };
    }

    // 3) Free text → note
    const firstLine = text.split("\n")[0].slice(0, 80);
    const { error } = await supabase.from("items").insert({
      type: "note",
      title: titleInput ?? firstLine,
      description: text,
      tags,
      day,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save." };
  }
}

export async function toggleFavorite(id: string, value: boolean): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("items").update({ favorite: value }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function updateHighlight(id: string, highlight: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("items")
    .update({ highlight: highlight.trim() || null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function updateItemFields(
  id: string,
  fields: {
    title?: string;
    description?: string;
    tags?: string[];
    day?: number | null;
  },
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const patch: Record<string, unknown> = {};
  if (fields.title !== undefined) patch.title = fields.title.trim() || null;
  if (fields.description !== undefined)
    patch.description = fields.description.trim() || null;
  if (fields.tags !== undefined)
    patch.tags = Array.from(
      new Set(fields.tags.map((t) => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean)),
    ).slice(0, 12);
  if (fields.day !== undefined) patch.day = fields.day;
  const { error } = await supabase.from("items").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();

  // Clean up the stored file (if any) before removing the row.
  const { data: row } = await supabase
    .from("items")
    .select("file_path")
    .eq("id", id)
    .single();
  if (row?.file_path) {
    await supabase.storage.from("vault").remove([row.file_path]);
  }

  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function saveReflection(day: number, reflection: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("daily_logs")
    .upsert(
      { user_id: user.id, day, reflection, updated_at: new Date().toISOString() },
      { onConflict: "user_id,day" },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

// ---------- auth ----------------------------------------------------------

export async function signIn(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  redirect("/");
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  // If email confirmation is disabled, a session is returned immediately.
  if (data.session) redirect("/");
  return { ok: true, error: "Check your inbox to confirm your email, then sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- forgot password (email reset link) ----------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

/** The site's own origin, so the emailed link comes back to this deployment. */
async function siteOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Step 1: check that an account exists for this email, then have Supabase
 * email it a one-time reset link.
 */
export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const admin = createAdminClient();
  if (!admin) {
    console.error("requestPasswordReset: SUPABASE_SERVICE_ROLE_KEY is not set");
    return { ok: false, error: "Password reset isn't set up yet. Please try again later." };
  }

  const { data: exists, error: lookupErr } = await admin.rpc("email_exists", {
    p_email: email,
  });
  if (lookupErr) {
    console.error("requestPasswordReset: email_exists failed:", lookupErr.message);
    return { ok: false, error: "Couldn't check that email right now. Please try again." };
  }
  if (!exists) {
    return {
      ok: false,
      error: "No account found with this email. Check for typos or create an account.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/confirm`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Step 2: runs when the user clicks "Reset my password" on the page the email
 * link opens. Verifying here (on click, not on page load) stops email link
 * scanners from using up the one-time token.
 */
export async function confirmPasswordReset(formData: FormData): Promise<ActionResult> {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const code = String(formData.get("code") ?? "");
  const supabase = await createClient();

  let userId: string | undefined;
  if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });
    if (error) return { ok: false, error: "This reset link has expired or was already used." };
    userId = data.user?.id;
  } else if (code) {
    // Supabase's default email template sends a PKCE code instead.
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return {
        ok: false,
        error:
          "This reset link has expired, was already used, or was opened in a different browser.",
      };
    }
    userId = data.user?.id;
  } else {
    return { ok: false, error: "This reset link is incomplete. Request a new one." };
  }

  if (!userId) return { ok: false, error: "Couldn't verify this reset link." };
  await grantResetPass(userId);
  redirect("/reset-password");
}

/** Step 3: save the new password, sign out other devices, open the app. */
export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD) {
    return { ok: false, error: `Use at least ${MIN_PASSWORD} characters.` };
  }
  if (password !== confirm) {
    return { ok: false, error: "The two passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await hasResetPass(user.id))) {
    return {
      ok: false,
      error: "Your reset link has expired. Request a new one from the sign-in page.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  await supabase.auth.signOut({ scope: "others" });
  await clearResetPass();
  redirect("/");
}