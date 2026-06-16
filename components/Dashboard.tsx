"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, LogOut, Library, BarChart3, Star, Layers, Sparkles } from "lucide-react";
import { signOut } from "@/app/actions";
import {
  TYPE_META,
  type Item,
  type ItemType,
} from "@/lib/types";
import AddBar from "./AddBar";
import ItemCard from "./ItemCard";
import ItemModal from "./ItemModal";
import Insights from "./Insights";
import ClaudeSkills from "./ClaudeSkills";

type Tab = "library" | "insights" | "skills" | "bookmarks";
const TYPES: ItemType[] = ["link", "repo", "pdf", "image", "note"];

export default function Dashboard({
  items,
  email,
}: {
  items: Item[];
  email: string;
}) {
  const [tab, setTab] = useState<Tab>("library");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ItemType | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [open, setOpen] = useState<Item | null>(null);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items)
      for (const t of it.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (tab === "bookmarks" && !it.favorite) return false;
      if (type && it.type !== type) return false;
      if (tag && !it.tags.includes(tag)) return false;
      if (q) {
        const hay = [it.title, it.description, it.domain, it.highlight, ...it.tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, tab, type, tag, query]);

  const favCount = items.filter((i) => i.favorite).length;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      {/* Header */}
      <header className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-coral text-xl shadow-soft">
            <span aria-hidden>🧠</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-none text-ink">
              GURU
            </h1>
            <p className="text-xs text-muted">an AI master</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:block">{email}</span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition hover:border-line-strong"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Tabs tab={tab} setTab={setTab} counts={{ all: items.length, fav: favCount }} />
      </div>

      {tab === "insights" ? (
        <Insights items={items} />
      ) : tab === "skills" ? (
        <ClaudeSkills />
      ) : (
        <div className="space-y-6">
          <AddBar />

          {/* Search + filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-soft">
              <Search className="h-4 w-4 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles, notes, tags…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-xs text-faint hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip active={!type} onClick={() => setType(null)}>
                All types
              </Chip>
              {TYPES.map((t) => (
                <Chip key={t} active={type === t} onClick={() => setType(type === t ? null : t)}>
                  <span className={`h-2 w-2 rounded-full ${TYPE_META[t].dot}`} />
                  {TYPE_META[t].label}
                </Chip>
              ))}
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {tag && (
                  <Chip active onClick={() => setTag(null)}>
                    #{tag} ✕
                  </Chip>
                )}
                {allTags
                  .filter((t) => t !== tag)
                  .slice(0, 14)
                  .map((t) => (
                    <button
                      key={t}
                      onClick={() => setTag(t)}
                      className="rounded-md bg-bg-tint px-2 py-0.5 text-xs font-medium text-muted transition hover:bg-indigo-soft hover:text-indigo"
                    >
                      #{t}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((it) => (
                  <ItemCard key={it.id} item={it} onOpen={setOpen} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState hasItems={items.length > 0} tab={tab} />
          )}
        </div>
      )}

      <ItemModal item={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Tabs({
  tab,
  setTab,
  counts,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  counts: { all: number; fav: number };
}) {
  const defs: { id: Tab; label: string; icon: typeof Library; badge?: number }[] = [
    { id: "library", label: "Library", icon: Layers, badge: counts.all },
    { id: "insights", label: "Insights", icon: BarChart3 },
    { id: "skills", label: "Claude Skills", icon: Sparkles },
    { id: "bookmarks", label: "Bookmarks", icon: Star, badge: counts.fav },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {defs.map(({ id, label, icon: Icon, badge }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === id
              ? "bg-ink text-bg shadow-soft"
              : "border border-line bg-surface text-ink-soft hover:border-line-strong"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
          {badge != null && badge > 0 && (
            <span
              className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] ${
                tab === id ? "bg-bg/25 text-bg" : "bg-bg-tint text-muted"
              }`}
            >
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-ink text-bg"
          : "border border-line bg-surface text-ink-soft hover:border-line-strong"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ hasItems, tab }: { hasItems: boolean; tab: Tab }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-bg/40 px-6 py-16 text-center"
    >
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-coral-soft text-2xl">
        {tab === "bookmarks" ? "⭐" : "🌱"}
      </div>
      <p className="font-display text-xl font-semibold text-ink">
        {tab === "bookmarks"
          ? "No bookmarks yet"
          : hasItems
            ? "Nothing matches that filter"
            : "Your vault is empty"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        {tab === "bookmarks"
          ? "Tap the star on any card to keep it here for quick revisiting."
          : hasItems
            ? "Try clearing the search or filters."
            : "Paste your first link, repo, PDF or note above to get started."}
      </p>
    </motion.div>
  );
}
