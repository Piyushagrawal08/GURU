"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  Copy,
  Eraser,
  ExternalLink,
  Highlighter,
  LocateFixed,
  MousePointer2,
  NotebookPen,
  Pencil,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  HIGHLIGHT_COLORS,
  HIGHLIGHT_SWATCH,
  type HighlightColor,
  type StudyAnnotation,
  type StudyDoc,
} from "@/lib/study";
import {
  HIGHLIGHT_CSS,
  MARK_ATTR,
  anchorFromRange,
  indexText,
  locate,
  marksFor,
  unwrap,
  wrapRange,
} from "@/lib/study-anchor";

type Mode = "select" | "pen" | "erase";
type Pop =
  | { kind: "selection"; x: number; y: number; below: boolean }
  | { kind: "mark"; id: string; x: number; y: number; below: boolean; editing: boolean };

const TABLE = "study_annotations";

export default function StudyViewer({
  doc,
  initial,
  setupNeeded,
  loadError,
}: {
  doc: StudyDoc;
  initial: StudyAnnotation[];
  setupNeeded: boolean;
  loadError?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  const [annotations, setAnnotations] = useState<StudyAnnotation[]>(initial);
  const [mode, setMode] = useState<Mode>("select");
  const [color, setColor] = useState<HighlightColor>("yellow");
  const [panel, setPanel] = useState(false);
  const [panelTab, setPanelTab] = useState<"highlights" | "notes">("highlights");
  const [pop, setPop] = useState<Pop | null>(null);
  const [orphans, setOrphans] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(
    loadError && !setupNeeded ? `Couldn't load your highlights: ${loadError}` : null,
  );

  const canEdit = !setupNeeded;

  // Refs so the listeners inside the iframe always see current values.
  const annRef = useRef(annotations);
  const modeRef = useRef(mode);
  const colorRef = useRef(color);
  const pendingRange = useRef<Range | null>(null);
  const mouseDown = useRef(false);
  useEffect(() => {
    annRef.current = annotations;
  }, [annotations]);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  const frameDoc = useCallback(() => frameRef.current?.contentDocument ?? null, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ---------- painting -------------------------------------------------------

  /** Wrap every stored highlight that isn't on the page yet. Idempotent. */
  const paintAll = useCallback(() => {
    const d = frameDoc();
    if (!d?.body) return;
    const idx = indexText(d);
    const missing = new Set<string>();
    const found: { a: StudyAnnotation; start: number; end: number }[] = [];
    for (const a of annRef.current) {
      if (a.kind !== "highlight" || marksFor(d, a.id).length) continue;
      const pos = locate(idx, a);
      if (pos) found.push({ a, ...pos });
      else missing.add(a.id);
    }
    // Positions were all measured on the same text, so wrap order doesn't matter.
    for (const { a, start, end } of found) {
      wrapRange(d, idx, start, end, {
        id: a.id,
        color: a.color ?? "yellow",
        hasNote: Boolean(a.note),
      });
    }
    setOrphans(missing);
    if (found.length)
      setOrder((o) => ({ ...o, ...Object.fromEntries(found.map((f) => [f.a.id, f.start])) }));
  }, [frameDoc]);

  // ---------- data operations -----------------------------------------------

  const createHighlight = useCallback(
    async (c: HighlightColor, withNote: boolean) => {
      const d = frameDoc();
      const sel = d?.defaultView?.getSelection();
      const range =
        pendingRange.current ?? (sel && sel.rangeCount && !sel.isCollapsed ? sel.getRangeAt(0) : null);
      pendingRange.current = null;
      if (!d || !range) return;
      if (!canEdit) {
        setToast("Run the database setup first (see the banner above).");
        return;
      }

      const idx = indexText(d);
      const anchor = anchorFromRange(idx, range);
      sel?.removeAllRanges();
      if (!anchor) {
        setPop(null);
        return;
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const ann: StudyAnnotation = {
        id,
        doc: doc.slug,
        kind: "highlight",
        color: c,
        quote: anchor.quote,
        prefix: anchor.prefix,
        suffix: anchor.suffix,
        start_offset: anchor.start,
        note: null,
        created_at: now,
        updated_at: now,
      };
      const marks = wrapRange(d, idx, anchor.start, anchor.start + anchor.quote.length, {
        id,
        color: c,
        hasNote: false,
      });
      setAnnotations((a) => [...a, ann]);
      setOrder((o) => ({ ...o, [id]: anchor.start }));

      if (withNote && marks[0]) {
        const r = marks[0].getBoundingClientRect();
        setPop({ kind: "mark", id, ...placeAt(r, hostRef.current), editing: true });
      } else {
        setPop(null);
      }

      const { error } = await supabase.from(TABLE).insert({
        id,
        doc: doc.slug,
        kind: "highlight",
        color: c,
        quote: ann.quote,
        prefix: ann.prefix,
        suffix: ann.suffix,
        start_offset: ann.start_offset,
      });
      if (error) {
        unwrap(d, id);
        setAnnotations((a) => a.filter((x) => x.id !== id));
        setPop(null);
        setToast(`Couldn't save highlight: ${error.message}`);
      }
    },
    [canEdit, doc.slug, frameDoc, supabase],
  );

  const updateAnnotation = useCallback(
    async (id: string, patch: { color?: HighlightColor; note?: string | null }) => {
      const d = frameDoc();
      if (d) {
        for (const m of marksFor(d, id)) {
          if (patch.color) m.dataset.c = patch.color;
          if (patch.note !== undefined) m.classList.toggle("has-note", Boolean(patch.note));
        }
      }
      const updated_at = new Date().toISOString();
      setAnnotations((a) => a.map((x) => (x.id === id ? { ...x, ...patch, updated_at } : x)));
      const { error } = await supabase
        .from(TABLE)
        .update({ ...patch, updated_at })
        .eq("id", id);
      if (error) setToast(`Couldn't save: ${error.message}`);
    },
    [frameDoc, supabase],
  );

  const deleteAnnotation = useCallback(
    async (id: string) => {
      const prev = annRef.current.find((a) => a.id === id);
      if (!prev) return;
      const d = frameDoc();
      if (d && prev.kind === "highlight") unwrap(d, id);
      setAnnotations((a) => a.filter((x) => x.id !== id));
      setPop((p) => (p?.kind === "mark" && p.id === id ? null : p));

      const { error } = await supabase.from(TABLE).delete().eq("id", id);
      if (error) {
        setToast(`Couldn't delete: ${error.message}`);
        annRef.current = [...annRef.current, prev];
        setAnnotations((a) => [...a, prev]);
        paintAll();
      }
    },
    [frameDoc, paintAll, supabase],
  );

  const addPageNote = useCallback(
    async (text: string) => {
      const note = text.trim();
      if (!note) return false;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const ann: StudyAnnotation = {
        id,
        doc: doc.slug,
        kind: "note",
        color: null,
        quote: null,
        prefix: null,
        suffix: null,
        start_offset: null,
        note,
        created_at: now,
        updated_at: now,
      };
      setAnnotations((a) => [...a, ann]);
      const { error } = await supabase.from(TABLE).insert({ id, doc: doc.slug, kind: "note", note });
      if (error) {
        setAnnotations((a) => a.filter((x) => x.id !== id));
        setToast(`Couldn't save note: ${error.message}`);
        return false;
      }
      return true;
    },
    [doc.slug, supabase],
  );

  const jumpTo = useCallback(
    (id: string) => {
      const d = frameDoc();
      if (!d) return;
      const marks = marksFor(d, id);
      if (!marks.length) return;
      marks[0].scrollIntoView({ behavior: "smooth", block: "center" });
      marks.forEach((m) => m.classList.add("guru-flash"));
      setTimeout(() => marks.forEach((m) => m.classList.remove("guru-flash")), 1600);
      if (window.matchMedia("(max-width: 1023px)").matches) setPanel(false);
    },
    [frameDoc],
  );

  // ---------- iframe wiring --------------------------------------------------

  const handleSelection = useCallback(() => {
    const d = frameDoc();
    const w = d?.defaultView;
    if (!d?.body || !w) return;
    const sel = w.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      pendingRange.current = null;
      setPop((p) => (p?.kind === "selection" ? null : p));
      return;
    }
    const range = sel.getRangeAt(0);
    if (!d.body.contains(range.commonAncestorContainer) || !range.toString().trim()) return;

    if (modeRef.current === "erase") {
      const ids = new Set<string>();
      d.querySelectorAll<HTMLElement>("mark.guru-hl").forEach((m) => {
        if (range.intersectsNode(m)) ids.add(m.getAttribute(MARK_ATTR) ?? "");
      });
      sel.removeAllRanges();
      ids.forEach((id) => id && deleteAnnotation(id));
      return;
    }
    if (modeRef.current === "pen") {
      void createHighlight(colorRef.current, false);
      return;
    }
    pendingRange.current = range.cloneRange();
    setPop({ kind: "selection", ...placeAt(range.getBoundingClientRect(), hostRef.current) });
  }, [createHighlight, deleteAnnotation, frameDoc]);

  // Keep the latest handlers reachable from listeners registered once per document.
  const live = useRef({ handleSelection, deleteAnnotation });
  useEffect(() => {
    live.current = { handleSelection, deleteAnnotation };
  }, [handleSelection, deleteAnnotation]);

  const setupFrame = useCallback(() => {
    const d = frameDoc();
    const w = d?.defaultView;
    if (!d?.body || !w || d.URL === "about:blank") return;
    setLoaded(true);

    if (!d.getElementById("guru-hl-style")) {
      const s = d.createElement("style");
      s.id = "guru-hl-style";
      s.textContent = HIGHLIGHT_CSS;
      (d.head ?? d.documentElement).appendChild(s);
    }
    d.documentElement.classList.toggle("guru-pen", modeRef.current === "pen");
    d.documentElement.classList.toggle("guru-erase", modeRef.current === "erase");
    paintAll();
    // Some guides render diagrams/content after load — catch anything that appeared late.
    setTimeout(paintAll, 1500);

    if (d.documentElement.dataset.guruInit) return;
    d.documentElement.dataset.guruInit = "1";

    let debounce: ReturnType<typeof setTimeout> | undefined;
    d.addEventListener("mousedown", () => {
      mouseDown.current = true;
    });
    const onUp = () => {
      mouseDown.current = false;
      setTimeout(() => live.current.handleSelection(), 10);
    };
    d.addEventListener("mouseup", onUp);
    d.addEventListener("touchend", onUp);
    // Touch devices adjust selections with handles — react once they settle.
    d.addEventListener("selectionchange", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (!mouseDown.current) live.current.handleSelection();
      }, 600);
    });
    d.addEventListener("scroll", () => setPop(null), true);
    d.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setPop(null);
    });
    d.addEventListener(
      "click",
      (e) => {
        const target = e.target as Element | null;
        if (!target?.closest) return;
        const link = target.closest<HTMLAnchorElement>("a[href]");
        // Outside links open in a new tab instead of replacing the guide.
        if (link && !link.getAttribute("target")) {
          try {
            if (new URL(link.href, d.baseURI).origin !== w.location.origin) {
              link.target = "_blank";
              link.rel = "noopener noreferrer";
            }
          } catch {
            /* ignore malformed hrefs */
          }
        }
        const mark = target.closest<HTMLElement>("mark.guru-hl");
        if (!mark) {
          setPop((p) => (p?.kind === "mark" ? null : p));
          return;
        }
        const id = mark.getAttribute(MARK_ATTR);
        if (!id) return;
        if (modeRef.current === "erase") {
          e.preventDefault();
          e.stopPropagation();
          void live.current.deleteAnnotation(id);
          return;
        }
        if (link) return; // let links behave like links
        const sel = w.getSelection();
        if (sel && !sel.isCollapsed) return;
        setPop({
          kind: "mark",
          id,
          ...placeAt(mark.getBoundingClientRect(), hostRef.current),
          editing: false,
        });
      },
      true,
    );
  }, [frameDoc, paintAll]);

  useEffect(() => {
    const f = frameRef.current;
    if (!f) return;
    f.addEventListener("load", setupFrame);
    // The frame may have finished loading before React hydrated.
    if (f.contentDocument?.readyState === "complete") setupFrame();
    return () => f.removeEventListener("load", setupFrame);
  }, [setupFrame]);

  const changeMode = (m: Mode) => {
    setMode(m);
    modeRef.current = m;
    setPop(null);
    const d = frameDoc();
    d?.documentElement.classList.toggle("guru-pen", m === "pen");
    d?.documentElement.classList.toggle("guru-erase", m === "erase");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPop(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------- derived --------------------------------------------------------

  const highlights = useMemo(
    () =>
      annotations
        .filter((a) => a.kind === "highlight")
        .sort((a, b) => (order[a.id] ?? Infinity) - (order[b.id] ?? Infinity)),
    [annotations, order],
  );
  const pageNotes = useMemo(
    () => annotations.filter((a) => a.kind === "note").sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [annotations],
  );
  const popAnn = pop?.kind === "mark" ? annotations.find((a) => a.id === pop.id) : undefined;

  const copyMarkdown = async () => {
    const lines = [`# ${doc.title} — my highlights & notes`, ""];
    if (highlights.length) {
      lines.push("## Highlights", "");
      for (const h of highlights) {
        lines.push(`> ${(h.quote ?? "").replace(/\n+/g, " ")}`);
        if (h.note) lines.push("", `📝 ${h.note}`);
        lines.push("");
      }
    }
    if (pageNotes.length) {
      lines.push("## Notes", "");
      for (const n of pageNotes) lines.push(`- ${n.note}`);
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setToast("Copied as Markdown.");
    } catch {
      setToast("Clipboard not available in this browser.");
    }
  };

  // ---------- render ---------------------------------------------------------

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur sm:gap-3 sm:px-4">
        <Link
          href="/study"
          className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink-soft transition hover:border-line-strong"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Library</span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base ${doc.accent}`}>
            {doc.emoji}
          </span>
          <h1 className="truncate font-display text-lg font-semibold text-ink">{doc.title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setPanel((p) => !p)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              panel ? "bg-ink text-bg" : "border border-line bg-surface text-ink-soft hover:border-line-strong"
            }`}
          >
            <NotebookPen className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
            {annotations.length > 0 && (
              <span
                className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] ${
                  panel ? "bg-bg/25 text-bg" : "bg-bg-tint text-muted"
                }`}
              >
                {annotations.length}
              </span>
            )}
          </button>
          <a
            href={`/api/study/${doc.slug}`}
            target="_blank"
            rel="noopener"
            title="Open the original guide in a new tab"
            className="hidden rounded-lg border border-line bg-surface p-2 text-ink-soft transition hover:border-line-strong sm:block"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      {setupNeeded && (
        <div className="shrink-0 border-b border-amber/40 bg-amber-soft px-4 py-2 text-sm text-ink-soft">
          <b>One-time setup needed for highlights &amp; notes:</b> in Supabase open{" "}
          <b>SQL Editor → New query</b>, paste <code>supabase/schema.sql</code> and click <b>Run</b> (safe to
          re-run). Reading works now; highlighting unlocks after that.
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        <div ref={hostRef} className="relative min-w-0 flex-1 bg-surface">
          <iframe
            ref={frameRef}
            src={`/api/study/${doc.slug}`}
            title={doc.title}
            className="h-full w-full border-0"
          />

          {!loaded && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-bg/70">
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="h-2 w-2 animate-ping rounded-full bg-coral" /> Opening {doc.title}…
              </div>
            </div>
          )}

          <AnimatePresence>
            {pop && (pop.kind === "selection" || popAnn) && (
              <Popover
                key={pop.kind === "mark" ? `m-${pop.id}` : "sel"}
                pop={pop}
                ann={popAnn}
                activeColor={color}
                canEdit={canEdit}
                onHighlight={(c, withNote) => void createHighlight(c, withNote)}
                onUpdate={(id, patch) => void updateAnnotation(id, patch)}
                onDelete={(id) => void deleteAnnotation(id)}
                onClose={() => setPop(null)}
              />
            )}
          </AnimatePresence>

          <ToolPill mode={mode} color={color} onMode={changeMode} onColor={setColor} disabled={!canEdit} />

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute left-1/2 top-3 z-40 -translate-x-1/2 rounded-xl bg-ink px-4 py-2 text-sm text-bg shadow-lift"
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {panel && (
            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-line bg-bg shadow-lift lg:static lg:w-[360px] lg:max-w-none lg:shadow-none"
            >
              <NotesPanel
                tab={panelTab}
                setTab={setPanelTab}
                highlights={highlights}
                pageNotes={pageNotes}
                orphans={orphans}
                canEdit={canEdit}
                onJump={jumpTo}
                onUpdate={(id, patch) => void updateAnnotation(id, patch)}
                onDelete={(id) => void deleteAnnotation(id)}
                onAddNote={addPageNote}
                onCopy={copyMarkdown}
                onClose={() => setPanel(false)}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Popover anchor point (relative to the iframe host) for a rect inside the frame. */
function placeAt(r: DOMRect, host: HTMLElement | null) {
  const width = host?.clientWidth ?? 800;
  const below = r.top < 90;
  return {
    x: Math.min(Math.max(r.left + r.width / 2, 150), Math.max(width - 150, 150)),
    y: below ? r.bottom : r.top,
    below,
  };
}

// ---------------------------------------------------------------------------

function ToolPill({
  mode,
  color,
  onMode,
  onColor,
  disabled,
}: {
  mode: Mode;
  color: HighlightColor;
  onMode: (m: Mode) => void;
  onColor: (c: HighlightColor) => void;
  disabled: boolean;
}) {
  const tools: { id: Mode; label: string; icon: typeof Highlighter }[] = [
    { id: "select", label: "Select", icon: MousePointer2 },
    { id: "pen", label: "Highlighter", icon: Highlighter },
    { id: "erase", label: "Eraser", icon: Eraser },
  ];
  return (
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-line bg-surface/95 p-1.5 shadow-lift backdrop-blur">
      {tools.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          disabled={disabled && id !== "select"}
          onClick={() => onMode(id)}
          title={
            id === "select"
              ? "Select text to get highlight options"
              : id === "pen"
                ? "Highlighter: every selection is highlighted instantly"
                : "Eraser: click or swipe over highlights to remove them"
          }
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40 ${
            mode === id ? "bg-ink text-bg" : "text-ink-soft hover:bg-bg-tint"
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden md:inline">{label}</span>
        </button>
      ))}
      <span className="mx-1 h-6 w-px bg-line" />
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => {
            onColor(c);
            if (mode === "erase") onMode("pen");
          }}
          disabled={disabled}
          aria-label={`${c} highlighter`}
          title={`${c[0].toUpperCase()}${c.slice(1)}`}
          className={`h-6 w-6 rounded-full border-2 transition disabled:opacity-40 ${
            color === c ? "scale-110 border-ink" : "border-transparent hover:scale-110"
          }`}
          style={{ background: HIGHLIGHT_SWATCH[c] }}
        />
      ))}
    </div>
  );
}

function Popover({
  pop,
  ann,
  activeColor,
  canEdit,
  onHighlight,
  onUpdate,
  onDelete,
  onClose,
}: {
  pop: Pop;
  ann?: StudyAnnotation;
  activeColor: HighlightColor;
  canEdit: boolean;
  onHighlight: (c: HighlightColor, withNote: boolean) => void;
  onUpdate: (id: string, patch: { color?: HighlightColor; note?: string | null }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(pop.kind === "mark" && pop.editing);
  const [draft, setDraft] = useState(ann?.note ?? "");
  // Keep the iframe's text selection alive while clicking popover buttons.
  const keep = (e: React.MouseEvent) => e.preventDefault();

  const current = pop.kind === "mark" ? (ann?.color ?? "yellow") : null;

  return (
    <div
      className="absolute z-30"
      style={{
        left: pop.x,
        top: pop.y,
        transform: pop.below ? "translate(-50%, 10px)" : "translate(-50%, calc(-100% - 10px))",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.14 }}
        className="rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
      >
        <div className="flex items-center gap-1">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c}
              onMouseDown={keep}
              disabled={!canEdit}
              onClick={() =>
                pop.kind === "selection" ? onHighlight(c, false) : onUpdate(pop.id, { color: c })
              }
              aria-label={`Highlight ${c}`}
              className={`h-7 w-7 rounded-full border-2 transition hover:scale-110 disabled:opacity-40 ${
                (current ?? activeColor) === c && pop.kind === "mark" ? "border-ink" : "border-transparent"
              }`}
              style={{ background: HIGHLIGHT_SWATCH[c] }}
            />
          ))}
          <span className="mx-0.5 h-6 w-px bg-line" />
          <button
            onMouseDown={keep}
            disabled={!canEdit}
            onClick={() => (pop.kind === "selection" ? onHighlight(activeColor, true) : setEditing((v) => !v))}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-soft hover:bg-bg-tint disabled:opacity-40"
          >
            <StickyNote className="h-3.5 w-3.5" />
            {pop.kind === "mark" && ann?.note ? "Edit note" : "Note"}
          </button>
          {pop.kind === "mark" && (
            <button
              onClick={() => onDelete(pop.id)}
              title="Remove highlight"
              className="rounded-lg p-1.5 text-coral-deep hover:bg-coral-soft"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onMouseDown={keep} onClick={onClose} className="rounded-lg p-1.5 text-faint hover:text-ink">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {pop.kind === "mark" && !editing && ann?.note && (
          <p className="max-w-72 whitespace-pre-wrap px-2 pb-1 pt-2 text-sm text-ink-soft">{ann.note}</p>
        )}

        {pop.kind === "mark" && editing && (
          <div className="w-72 p-1 pt-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  onUpdate(pop.id, { note: draft.trim() || null });
                  onClose();
                }
              }}
              rows={4}
              placeholder="Why does this matter? (Ctrl+Enter to save)"
              className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-indigo"
            />
            <div className="mt-1.5 flex justify-end gap-1.5">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdate(pop.id, { note: draft.trim() || null });
                  onClose();
                }}
                className="flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-bg"
              >
                <Check className="h-3.5 w-3.5" /> Save note
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function NotesPanel({
  tab,
  setTab,
  highlights,
  pageNotes,
  orphans,
  canEdit,
  onJump,
  onUpdate,
  onDelete,
  onAddNote,
  onCopy,
  onClose,
}: {
  tab: "highlights" | "notes";
  setTab: (t: "highlights" | "notes") => void;
  highlights: StudyAnnotation[];
  pageNotes: StudyAnnotation[];
  orphans: Set<string>;
  canEdit: boolean;
  onJump: (id: string) => void;
  onUpdate: (id: string, patch: { note?: string | null }) => void;
  onDelete: (id: string) => void;
  onAddNote: (text: string) => Promise<boolean>;
  onCopy: () => void;
  onClose: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (a: StudyAnnotation) => {
    setEditingId(a.id);
    setDraft(a.note ?? "");
  };
  const saveEdit = (id: string) => {
    onUpdate(id, { note: draft.trim() || null });
    setEditingId(null);
  };

  const editor = (id: string) => (
    <div className="mt-2">
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-indigo"
      />
      <div className="mt-1 flex justify-end gap-1.5">
        <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs font-semibold text-muted hover:text-ink">
          Cancel
        </button>
        <button onClick={() => saveEdit(id)} className="rounded-lg bg-ink px-3 py-1 text-xs font-semibold text-bg">
          Save
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2.5">
        {(["highlights", "notes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              tab === t ? "bg-ink text-bg" : "text-ink-soft hover:bg-bg-tint"
            }`}
          >
            {t === "highlights" ? `Highlights (${highlights.length})` : `Notes (${pageNotes.length})`}
          </button>
        ))}
        <button onClick={onCopy} title="Copy all as Markdown" className="ml-auto rounded-lg p-2 text-muted hover:bg-bg-tint hover:text-ink">
          <Copy className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-bg-tint hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
        {tab === "highlights" ? (
          highlights.length === 0 ? (
            <Empty
              icon="🖍️"
              title="No highlights yet"
              text="Select any text in the guide and pick a colour — or switch on the Highlighter in the toolbar below."
            />
          ) : (
            highlights.map((h) => (
              <div key={h.id} className="group rounded-xl border border-line bg-surface p-3 shadow-soft">
                <div className="flex gap-2.5">
                  <span
                    className="w-1 shrink-0 rounded-full"
                    style={{ background: HIGHLIGHT_SWATCH[h.color ?? "yellow"] }}
                  />
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => onJump(h.id)}
                      disabled={orphans.has(h.id)}
                      className="line-clamp-4 text-left text-sm italic text-ink-soft hover:text-ink disabled:cursor-default"
                    >
                      “{h.quote}”
                    </button>
                    {orphans.has(h.id) && (
                      <p className="mt-1 text-[11px] font-medium text-coral-deep">
                        Not found in the current version of this guide.
                      </p>
                    )}
                    {editingId === h.id
                      ? editor(h.id)
                      : h.note && (
                          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-amber-soft px-2.5 py-1.5 text-sm text-ink">
                            {h.note}
                          </p>
                        )}
                  </div>
                </div>
                {editingId !== h.id && (
                  <div className="mt-2 flex justify-end gap-0.5 opacity-70 transition group-hover:opacity-100">
                    {!orphans.has(h.id) && (
                      <IconBtn title="Jump to highlight" onClick={() => onJump(h.id)}>
                        <LocateFixed className="h-3.5 w-3.5" />
                      </IconBtn>
                    )}
                    {canEdit && (
                      <IconBtn title={h.note ? "Edit note" : "Add note"} onClick={() => startEdit(h)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </IconBtn>
                    )}
                    {canEdit && (
                      <IconBtn title="Remove highlight" danger onClick={() => onDelete(h.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    )}
                  </div>
                )}
              </div>
            ))
          )
        ) : (
          <>
            {canEdit && (
              <div className="rounded-xl border border-line bg-surface p-2.5 shadow-soft">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  placeholder="Write a note about this guide…"
                  className="w-full resize-none bg-transparent px-1 text-sm text-ink outline-none placeholder:text-faint"
                />
                <div className="flex justify-end">
                  <button
                    disabled={!newNote.trim() || saving}
                    onClick={async () => {
                      setSaving(true);
                      if (await onAddNote(newNote)) setNewNote("");
                      setSaving(false);
                    }}
                    className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-bg disabled:opacity-40"
                  >
                    Add note
                  </button>
                </div>
              </div>
            )}
            {pageNotes.length === 0 ? (
              <Empty icon="📝" title="No notes yet" text="Jot down summaries, questions or things to try for this guide." />
            ) : (
              pageNotes.map((n) => (
                <div key={n.id} className="group rounded-xl border border-line bg-surface p-3 shadow-soft">
                  {editingId === n.id ? (
                    editor(n.id)
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-sm text-ink">{n.note}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-faint">
                          {new Date(n.updated_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {canEdit && (
                          <div className="flex gap-0.5 opacity-70 transition group-hover:opacity-100">
                            <IconBtn title="Edit note" onClick={() => startEdit(n)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </IconBtn>
                            <IconBtn title="Delete note" danger onClick={() => onDelete(n.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconBtn>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </>
  );
}

function IconBtn({
  title,
  danger,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition ${
        danger ? "text-coral-deep hover:bg-coral-soft" : "text-muted hover:bg-bg-tint hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-4 py-10 text-center">
      <div className="text-2xl">{icon}</div>
      <p className="mt-1 font-display text-base font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-60 text-xs text-muted">{text}</p>
    </div>
  );
}
