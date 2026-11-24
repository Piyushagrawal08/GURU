# Study Library

Your local AI study guides (the HTML files from `Desktop/AI Study Library`),
hosted inside GURU so you can read, highlight and take notes on any device.

## Where things are

| What | Where |
| --- | --- |
| Index of all guides | **Study** tab on the dashboard, or `/study` |
| Reader for one guide | `/study/<slug>` (e.g. `/study/rag-field-guide`) |
| Raw guide HTML (signed-in only) | `/api/study/<slug>` |
| Imported guide files | `content/study/*.html` + `content/study/manifest.json` |
| Highlights & notes | Supabase table `study_annotations` (per user, RLS) |
| Card emoji / colour per guide | `lib/study.ts` → `STYLE` |

## Using the reader

- **Select** (default): select text → pick a colour, or **Note** to highlight + annotate.
- **Highlighter**: every selection is highlighted instantly in the chosen colour.
- **Eraser**: click a highlight (or swipe a selection across several) to remove it.
- Click any highlight to recolour it, add/edit its note, or delete it.
- **Notes** panel: every highlight in page order (click to jump), plus free-form
  page notes. The copy button exports everything as Markdown.

Highlights are anchored by the quoted text plus a little surrounding context, so
they survive re-importing an edited guide. A highlight whose text was removed
shows as "Not found in the current version" in the panel.

## One-time database setup

Run `supabase/schema.sql` in **Supabase → SQL Editor → New query → Run**. It is
additive and safe to re-run; it creates the `study_annotations` table and policy.
Until then the guides are readable but highlighting is disabled (a banner says so).

## Adding or updating guides

1. Generate/update the HTML in `Desktop/AI Study Library` (top-level `.html` only;
   sub-folders, PDFs and the local index `ai-study-library.html` are ignored).
2. `npm run study:import` (or `npm run study:import -- "D:/other/folder"`).
3. Commit `content/study` and push — Vercel redeploys automatically.

The import rewrites links between guides to the in-app reader and swaps
local-only scripts (e.g. `/_runtime/mermaid-*.js`) for a CDN copy. New guides get
a default 📘 card; give them an emoji/colour in `lib/study.ts` if you like.

> Note: the GitHub repo is public, so the guide files in `content/study` are
> visible there. On the website they are only served to signed-in users.
