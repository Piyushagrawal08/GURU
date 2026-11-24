"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Highlighter, Search, StickyNote } from "lucide-react";
import type { StudyCounts, StudyDoc } from "@/lib/study";

const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function StudyIndex({
  docs,
  counts,
  setupNeeded,
}: {
  docs: StudyDoc[];
  counts: StudyCounts;
  setupNeeded?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => `${d.title} ${d.description}`.toLowerCase().includes(q));
  }, [docs, query]);

  const totals = useMemo(() => {
    let highlights = 0;
    let notes = 0;
    for (const c of Object.values(counts)) {
      highlights += c.highlights;
      notes += c.notes;
    }
    return { highlights, notes };
  }, [counts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Study Library</h2>
          <p className="text-sm text-muted">
            {docs.length} guides · {totals.highlights} highlights · {totals.notes} notes — open a guide to
            read, highlight and take notes.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 shadow-soft sm:w-72">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a guide…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
        </div>
      </div>

      {setupNeeded && (
        <div className="rounded-xl border border-amber/40 bg-amber-soft px-4 py-2.5 text-sm text-ink-soft">
          Guides are ready to read. To turn on <b>highlights &amp; notes</b>, run{" "}
          <code>supabase/schema.sql</code> once in the Supabase SQL Editor.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d, i) => {
          const c = counts[d.slug];
          return (
            <motion.div
              key={d.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: Math.min(i * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className={d.featured && !query ? "sm:col-span-2 lg:col-span-3" : ""}
            >
              <Link
                href={`/study/${d.slug}`}
                className={`group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-soft transition-shadow hover:shadow-lift ${
                  d.featured && !query ? "bg-gradient-to-br from-indigo-soft/60 via-surface to-coral-soft/50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${d.accent}`}>
                    {d.emoji}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold leading-snug text-ink">{d.title}</h3>
                    {d.featured && (
                      <span className="mt-0.5 inline-block rounded-md bg-indigo-soft px-1.5 py-0.5 text-[11px] font-semibold text-indigo">
                        All guides in one · cross-guide search
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted">{d.description}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-faint">
                  <span className="flex items-center gap-1" title="Highlights">
                    <Highlighter className="h-3.5 w-3.5" /> {c?.highlights ?? 0}
                  </span>
                  <span className="flex items-center gap-1" title="Notes">
                    <StickyNote className="h-3.5 w-3.5" /> {c?.notes ?? 0}
                  </span>
                  <span>Updated {dateFmt.format(new Date(d.updatedAt))}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-ink-soft transition group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">No guide matches “{query}”.</p>
      )}
    </div>
  );
}
