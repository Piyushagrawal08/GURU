import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // The study guides are read from disk by the /api/study/[slug] route, so make
  // sure the serverless bundle ships them.
  outputFileTracingIncludes: {
    "/api/study/*": ["./content/study/**/*"],
  },
  images: {
    // Favicons / OpenGraph preview images come from arbitrary domains, and
    // uploaded files are served (via signed URLs) from the Supabase host.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
    ],
  },
};

export default nextConfig;
