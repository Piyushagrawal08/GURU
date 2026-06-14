"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, NotebookPen } from "lucide-react";
import { saveReflection } from "@/app/actions";
import { TOTAL_DAYS, type DailyLog, type Item } from "@/lib/types";
import ItemCard from "./ItemCard";
import AddBar from "./AddBar";

export default function Tracker({
  items,
  logs,
  onOpen,
}: {
  items: Item[];
  logs: DailyLog[];
  onOpen: (item: Item) => void;
}) {
  const [active, setActive] = useState(1);

  const byDay = useMemo(() => {
    const map = new Map<number, Item[]>();
    for (const it of items) {
      if (it.day == null) continue;
      const arr = map.get(it.day) ?? [];
      arr.push(it);
      map.set(it.day, arr);
    }
    return map;
  }, [items]);

  const logByDay = useMemo(
    () => new Map(logs.map((l) => [l.day, l.reflection])),
    [logs],
  );

  const touched = useMemo(() => {
    const s = new Set<number>();
    byDay.forEach((_, d) => s.add(d));
    logs.forEach((l) => {
      if (l.reflection.trim()) s.add(l.day);
    });
    return s;
  }, [byDay, logs]);

  const dayItems = byDay.get(active) ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              21-day sprint
            </h2>
            <p className="text-sm text-muted">
              {touched.size} of {TOTAL_DAYS} days active
            </p>
          </div>
          <ProgressRing value={touched.size / TOTAL_DAYS} />
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => {
            const count = byDay.get(d)?.length ?? 0;
            const isActive = d === active;
            const isTouched = touched.has(d);
            return (
              <button
                key={d}
                onClick={() => setActive(d)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${
                  isActive
                    ? "border-ink bg-ink text-bg shadow-lift"
                    : isTouched
                      ? "border-coral/30 bg-coral-soft text-coral-deep hover:border-coral"
                      : "border-line bg-bg/40 text-muted hover:border-line-strong"
                }`}
              >
                <span className="text-[10px] font-medium uppercase opacity-70">
                  Day
                </span>
                {d}
                {count > 0 && (
                  <span
                    className={`absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] ${
                      isActive ? "bg-bg text-ink" : "bg-coral text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="space-y-5"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink font-display text-lg font-semibold text-bg">
              {active}
            </span>
            <h3 className="font-display text-2xl font-semibold text-ink">
              Day {active}
            </h3>
          </div>

          <Reflection day={active} initial={logByDay.get(active) ?? ""} />

          <AddBar defaultDay={active} />

          {dayItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {dayItems.map((it) => (
                <ItemCard key={it.id} item={it} onOpen={onOpen} />
              ))}
            </div>
          ) : (
            <p className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-bg/40 px-5 py-8 text-center text-sm text-muted">
              Nothing saved for day {active} yet. Add a link, repo, PDF or note above.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Reflection({ day, initial }: { day: number; initial: string }) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const dirty = text !== initial;

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-soft">
      <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <NotebookPen className="h-4 w-4 text-coral" /> Daily reflection
      </label>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        rows={3}
        placeholder="What did you learn today? What clicked, what's still fuzzy?"
        className="w-full resize-none rounded-xl border border-line bg-bg/50 px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition placeholder:text-faint focus:border-coral focus:bg-surface"
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={() =>
            start(async () => {
              await saveReflection(day, text);
              setSaved(true);
            })
          }
          disabled={!dirty || pending}
          className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-1.5 text-sm font-semibold text-bg transition hover:bg-coral-deep disabled:opacity-40"
        >
          {saved && !dirty ? (
            <>
              <Check className="h-3.5 w-3.5" /> Saved
            </>
          ) : pending ? (
            "Saving…"
          ) : (
            "Save reflection"
          )}
        </button>
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-line)" strokeWidth="6" />
      <motion.circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="var(--color-coral)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - value) }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}
