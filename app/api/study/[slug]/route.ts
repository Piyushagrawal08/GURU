import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudyDoc } from "@/lib/study";

/**
 * Serves the raw HTML of one imported study guide to signed-in users only.
 * The reader page (/study/[slug]) loads this into a same-origin iframe so it
 * can layer highlights and notes on top.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/study/[slug]">) {
  const { slug } = await ctx.params;

  // Only serve slugs from the manifest (also blocks any path traversal).
  const doc = getStudyDoc(slug);
  if (!doc) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Please sign in to GURU first.", { status: 401 });

  try {
    const html = await readFile(
      path.join(process.cwd(), "content", "study", `${doc.slug}.html`),
      "utf8",
    );
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch {
    return new Response("Guide file missing — re-run `npm run study:import`.", { status: 500 });
  }
}
