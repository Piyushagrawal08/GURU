"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Library, Star, Tag, TrendingUp, Clock } from "lucide-react";
import { TYPE_META, type Item, type ItemType } from "@/lib/types";

const TYPES: ItemType[] = ["link", "repo", "pdf", "image", "note"];

const TYPE_BAR: Record<ItemType, string> = {
  link: "bg-indigo",
  repo: "bg-violet",
  pdf: "bg-coral",
  image: "bg-mint",
  note: "bg-amber",
};

const dayKeyFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

export default function Insights({ items }: { items: Item[] }) {
  const stats = useMemo(() => {
    const byType = new Map<ItemType, number>();
    const tagCounts = new Map<string, number>();
    const byDate = new Map<string, number>();
    let favorites = 0;
    let latest: string | null = null;

    for (const it of items) {
      byType.set(it.type, (byType.get(it.type) ?? 0) + 1);
      if (it.favorite) favorites += 1;
      for (const t of it.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      if (it.created_at) {
        const key = it.created_at.slice(0, 10); // YYYY-MM-DD
        byDate.set(key, (byDate.get(key) ?? 0) + 1);
        if (!latest || it.created_at > latest) latest = it.created_at;
      }
    }

    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Last 14 calendar days, oldest → newest.
    const today = new Date();
    const timeline: { key: string; label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      timeline.push({ key, label: dayKeyFmt.format(d), count: byDate.get(key) ?? 0 });
    }

    return {
      total: items.length,
      favorites,
      byType,
      topTags,
      uniqueTags: tagCounts.size,
      timeline,
      latest,
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-bg/40 px-6 py-16 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-coral-soft text-2xl">
          📊
        </div>
        <p className="font-display text-xl font-semibold text-ink">
          No data to visualize yet
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Save some links, repos, PDFs or notes and your insights will appear here.
        </p>
      </div>
    );
  }

  const maxTimeline = Math.max(1, ...stats.timeline.map((d) => d.count));
  const maxType = Math.max(1, ...TYPES.map((t) => stats.byType.get(t) ?? 0));
  const maxTag = Math.max(1, ...stats.topTags.map(([, c]) => c));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Library} label="Total resources" value={stats.total} tint="bg-indigo-soft text-indigo" />
        <StatTile icon={Star} label="Bookmarked" value={stats.favorites} tint="bg-amber-soft text-amber" />
        <StatTile icon={Tag} label="Unique tags" value={stats.uniqueTags} tint="bg-violet-soft text-violet" />
        <StatTile
          icon={Clock}
          label="Last added"
          value={
            stats.latest
              ? dayKeyFmt.format(new Date(stats.latest))
              : "—"
          }
          tint="bg-mint-soft text-mint"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Activity timeline */}
        <Panel title="Activity — last 14 days" icon={TrendingUp}>
          <div className="flex h-40 items-end gap-1.5">
            {stats.timeline.map((d) => (
              <div key={d.key} className="group flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-muted opacity-0 transition group-hover:opacity-100">
                  {d.count}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.count / maxTimeline) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`w-full rounded-t-md ${d.count > 0 ? "bg-coral" : "bg-line"}`}
                  style={{ minHeight: d.count > 0 ? 4 : 2 }}
                />
                <span className="text-[9px] text-faint">{d.label.split(" ")[1]}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* By type */}
        <Panel title="Breakdown by type" icon={Library}>
          <div className="space-y-3">
            {TYPES.map((t) => {
              const count = stats.byType.get(t) ?? 0;
              return (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-14 text-xs font-medium text-ink-soft">
                    {TYPE_META[t].label}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg-tint">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxType) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${TYPE_BAR[t]}`}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-semibold text-ink">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Top tags */}
      {stats.topTags.length > 0 && (
        <Panel title="Top tags" icon={Tag}>
          <div className="space-y-2.5">
            {stats.topTags.map(([tag, count]) => (
              <div key={tag} className="flex items-center gap-3">
                <span className="w-28 truncate text-xs font-medium text-ink-soft">
                  #{tag}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg-tint">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxTag) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-indigo"
                  />
                </div>
                <span className="w-6 text-right text-xs font-semibold text-ink">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </motion.div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Library;
  label: string;
  value: string | number;
  tint: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-soft">
      <div className={`mb-2 grid h-8 w-8 place-items-center rounded-lg ${tint}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-display text-2xl font-semibold leading-none text-ink">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Library;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-soft">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon className="h-4 w-4 text-coral" />
        {title}
      </h3>
      {children}
    </div>
  );
}
