"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X, Trash2, ExternalLink, Quote, Check, CalendarDays } from "lucide-react";
import {
  deleteItem,
  updateHighlight,
  updateItemFields,
} from "@/app/actions";
import { TYPE_META, type Item } from "@/lib/types";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function ItemModal({
  item,
  onClose,
}: {
  item: Item | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {item && <ModalBody key={item.id} item={item} onClose={onClose} />}
    </AnimatePresence>
  );
}

function ModalBody({ item, onClose }: { item: Item; onClose: () => void }) {
  const meta = TYPE_META[item.type];
  const [highlight, setHighlight] = useState(item.highlight ?? "");
  const [tags, setTags] = useState(item.tags.join(", "));
  const [saved, setSaved] = useState(false);
  const savedOn =
    item.created_at && !Number.isNaN(new Date(item.created_at).getTime())
      ? dateFmt.format(new Date(item.created_at))
      : null;
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();

  const href = item.url ?? item.file_url ?? null;
  const preview =
    item.type === "image" ? item.file_url : item.image_url || item.file_url;

  function save() {
    start(async () => {
      await Promise.all([
        updateHighlight(item.id, highlight),
        updateItemFields(item.id, {
          tags: tags.split(","),
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-surface shadow-lift sm:rounded-[var(--radius-card)]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.tw}`}
          >
            {meta.label}
          </span>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted transition hover:bg-bg-tint hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {preview && item.type !== "note" && (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-bg-tint">
              <Image
                src={preview}
                alt=""
                fill
                sizes="512px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <h2 className="font-display text-2xl font-semibold leading-tight text-ink">
            {item.title || "Untitled"}
          </h2>

          {item.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {item.description}
            </p>
          )}

          {href && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-bg/50 px-4 py-2.5 text-sm font-medium text-indigo transition hover:border-indigo"
            >
              {item.type === "pdf"
                ? "Open PDF"
                : item.type === "image"
                  ? "View full image"
                  : "Open original"}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {/* Highlight / takeaway */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Quote className="h-3.5 w-3.5 text-coral" /> Your takeaway
            </label>
            <textarea
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              rows={3}
              placeholder="What's worth remembering here? Why did you save it?"
              className="w-full resize-none rounded-xl border border-line bg-bg/50 px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-faint focus:border-coral focus:bg-surface"
            />
          </div>

          {/* Tags */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              Tags
            </span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="agents, rag, vectors"
              className="w-full rounded-xl border border-line bg-bg/50 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:bg-surface"
            />
          </label>

          {savedOn && (
            <p className="flex items-center gap-1.5 text-xs text-faint">
              <CalendarDays className="h-3.5 w-3.5" /> Saved on {savedOn}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={save}
              disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-coral-deep disabled:opacity-50"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : pending ? (
                "Saving…"
              ) : (
                "Save changes"
              )}
            </button>

            <button
              onClick={() => {
                if (!confirm("Delete this item permanently?")) return;
                startDelete(async () => {
                  await deleteItem(item.id);
                  onClose();
                });
              }}
              disabled={deleting}
              className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-coral-soft hover:text-coral-deep"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
