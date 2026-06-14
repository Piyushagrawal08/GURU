import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./lib/supabase/env";

/**
 * Next.js 16 renamed `middleware` to `proxy`. This keeps the Supabase auth
 * session fresh on every request by re-issuing cookies, so Server Components
 * always see a valid (or cleanly expired) session.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // If env isn't configured yet, don't crash every request — just pass through.
  if (!isSupabaseConfigured) {
    return response;
  }

  const supabase = createServerClient(
    SUPABASE_URL!,
    SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touch the session so expired access tokens get refreshed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
