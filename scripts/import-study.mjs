#!/usr/bin/env node
/**
 * Sync the local "AI Study Library" folder into the app.
 *
 *   npm run study:import                      # default source folder
 *   npm run study:import -- "D:/some/folder"  # custom source folder
 *
 * - Copies ONLY the top-level *.html files (sub-folders, PDFs etc. are ignored)
 *   into content/study/<slug>.html. The local index page (ai-study-library.html)
 *   is skipped — the app's Study index replaces it.
 * - Rewrites links between guides (e.g. "Docker%20Field%20Guide.html") so they
 *   open the matching in-app reader page instead of a missing local file.
 * - Points local-only runtime scripts (e.g. /_runtime/mermaid-*.js) at a CDN.
 * - Writes content/study/manifest.json, which drives the Study index.
 * - Removes previously imported guides that no longer exist in the source.
 *
 * Highlights and notes are stored separately (Supabase) and anchored by the
 * quoted text, so re-importing an updated guide keeps them in place.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "content", "study");
const SRC =
  process.argv[2] || process.env.STUDY_SRC || "C:/Users/piyus/Desktop/AI Study Library";

// Files that exist only for local browsing (the app's Study index replaces them).
const EXCLUDE = new Set(["ai-study-library.html"]);

const MERMAID_CDN ="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js";

const slugify = (name) =>
  name
    .replace(/\.html?$/i, "")
    .replace(/\(\d+\)/g, "") // "Notes (1)" → "Notes"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function firstParagraph(html) {
  const body = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
  for (const m of body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = decode(m[1].replace(/<[^>]+>/g, ""));
    if (text.length > 60) return text.length > 220 ? `${text.slice(0, 217)}…` : text;
  }
  return "";
}

let entries;
try {
  entries = readdirSync(SRC, { withFileTypes: true });
} catch {
  console.error(`✖ Source folder not found: ${SRC}`);
  process.exit(1);
}

const files = entries
  .filter((e) => e.isFile() && /\.html?$/i.test(e.name) && !EXCLUDE.has(e.name.toLowerCase()))
  .map((e) => e.name)
  .sort((a, b) => a.localeCompare(b));

if (!files.length) {
  console.error(`✖ No .html files in ${SRC}`);
  process.exit(1);
}

const slugByName = new Map(files.map((f) => [f, slugify(f)]));
const seen = new Set();
for (const [f, s] of slugByName) {
  if (seen.has(s)) {
    console.error(`✖ Two files map to the same slug "${s}" (${f}). Rename one.`);
    process.exit(1);
  }
  seen.add(s);
}

mkdirSync(OUT, { recursive: true });

const manifest = [];
for (const file of files) {
  const slug = slugByName.get(file);
  const full = path.join(SRC, file);
  let html = readFileSync(full, "utf8");

  // 1) Links to sibling guides → in-app reader (open in the top window, not the frame).
  for (const [other, otherSlug] of slugByName) {
    const variants = new Set([other, encodeURI(other), other.replace(/ /g, "%20")]);
    for (const v of variants) {
      const re = new RegExp(`href="(?:\\./)?${escapeRe(v)}(#[^"]*)?"`, "g");
      html = html.replace(re, (_m, hash = "") => `href="/study/${otherSlug}${hash}" target="_top"`);
    }
  }

  // 2) Local-only runtime scripts → CDN.
  html = html.replace(/src="\/_runtime\/mermaid-[\d.]+(?:\.min)?\.js"/g, `src="${MERMAID_CDN}"`);
  const leftovers = html.match(/(?:src|href)="\/_runtime\/[^"]+"/g);
  if (leftovers) console.warn(`⚠ ${file}: unresolved local refs ${leftovers.join(", ")}`);

  writeFileSync(path.join(OUT, `${slug}.html`), html, "utf8");

  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "") || file.replace(/\.html?$/i, "");
  const description =
    decode(html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] ?? "") ||
    firstParagraph(html);

  manifest.push({
    slug,
    title,
    description,
    source: file,
    bytes: Buffer.byteLength(html, "utf8"),
    updatedAt: statSync(full).mtime.toISOString(),
  });
  console.log(`✔ ${file}  →  content/study/${slug}.html`);
}

// Drop guides that were removed from the source folder.
const keep = new Set(manifest.map((m) => `${m.slug}.html`));
for (const f of readdirSync(OUT)) {
  if (f.endsWith(".html") && !keep.has(f)) {
    rmSync(path.join(OUT, f));
    console.log(`✖ removed stale ${f}`);
  }
}

writeFileSync(path.join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`\n${manifest.length} guides imported. Commit content/study and push to publish.`);
