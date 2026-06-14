import type { ItemType } from "./types";

export interface LinkMeta {
  title: string | null;
  description: string | null;
  image_url: string | null;
  domain: string | null;
  type: Extract<ItemType, "link" | "repo">;
}

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function pickMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    // Handle both attribute orders: content before or after property/name.
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`,
        "i",
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return decodeEntities(m[1].trim());
    }
  }
  return null;
}

/**
 * Fetch a URL and extract OpenGraph/title/favicon metadata. Best-effort:
 * on any failure it still returns sensible defaults derived from the URL.
 */
export async function fetchLinkMeta(rawUrl: string): Promise<LinkMeta> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      title: rawUrl,
      description: null,
      image_url: null,
      domain: null,
      type: "link",
    };
  }

  const domain = url.hostname.replace(/^www\./, "");
  const isRepo =
    /(^|\.)(github|gitlab|bitbucket)\.com$/.test(url.hostname) ||
    /huggingface\.co$/.test(url.hostname);

  const fallback: LinkMeta = {
    title: domain + url.pathname.replace(/\/$/, ""),
    description: null,
    image_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    domain,
    type: isRepo ? "repo" : "link",
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        // Pretend to be a browser so sites return real OG markup.
        "user-agent":
          "Mozilla/5.0 (compatible; BeaconBot/1.0; +https://beacon.app)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok || !ct.includes("text/html")) return fallback;

    // Only read the first chunk — <head> is all we need.
    const html = (await res.text()).slice(0, 250_000);

    const ogTitle = pickMeta(html, ["og:title", "twitter:title"]);
    const htmlTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
    const title = ogTitle ?? (htmlTitle ? decodeEntities(htmlTitle.trim()) : null);

    let image = pickMeta(html, ["og:image", "twitter:image", "twitter:image:src"]);
    if (image && image.startsWith("/")) {
      image = new URL(image, url.origin).toString();
    }

    return {
      title: title || fallback.title,
      description: pickMeta(html, ["og:description", "description", "twitter:description"]),
      image_url: image || fallback.image_url,
      domain,
      type: isRepo ? "repo" : "link",
    };
  } catch {
    return fallback;
  }
}
