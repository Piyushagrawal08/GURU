"use client";

import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paperclip, X, Hash, Sparkles } from "lucide-react";
import { addItem } from "@/app/actions";

export default function ComposeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const canSave = (text.trim().length > 0 || !!file) && !pending;

  function reset() {
    setTitle("");
    setText("");
    setTags("");
    setFile(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    if (!pending) {
      reset();
      onClose();
    }
  }

  function submit() {
    if (!canSave) return;
    setError(null);
    const fd = new FormData();
    fd.set("text", text);
    fd.set("tags", tags);
    if (title.trim()) fd.set("title", title.trim());
    if (file) fd.set("file", file);
    start(async () => {
      const res = await addItem(fd);
      if (res.ok) {
        reset();
        onClose();
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  const hint = file
    ? file.type.startsWith("image/")
      ? "Image ready to save"
      : "PDF ready to save"
    : /^https?:\/\//i.test(text.trim())
      ? "Looks like a link — I'll grab its title & preview"
      : text.trim()
        ? "Saving as a note"
        : "Paste a link or repo, drop a file, or jot a note…";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-lift sm:max-h-[88vh] sm:rounded-[var(--radius-card)]"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Sparkles className="h-4 w-4 text-coral" /> New note
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted transition hover:bg-bg-tint hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full bg-transparent font-display text-2xl font-semibold text-ink outline-none placeholder:text-faint"
              />

              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
                }}
                placeholder="Paste a link, repo, or write a note…"
                className="min-h-[45vh] w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint"
              />

              {file && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-bg-tint px-3 py-1.5 text-sm text-ink-soft">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="max-w-[220px] truncate">{file.name}</span>
                  <button
                    onClick={() => {
                      setFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-faint hover:text-coral-deep"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral-deep">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">
              <label className="flex items-center gap-1.5 rounded-lg border border-line bg-bg/50 px-2.5 py-1.5 text-sm text-ink-soft">
                <Hash className="h-3.5 w-3.5 text-muted" />
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tags, comma-separated"
                  className="w-40 bg-transparent outline-none placeholder:text-faint"
                />
              </label>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-bg/50 px-2.5 py-1.5 text-sm text-ink-soft transition hover:border-line-strong"
              >
                <Paperclip className="h-3.5 w-3.5 text-muted" />
                Attach PDF / image
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />

              <div className="ml-auto flex items-center gap-3">
                <span className="hidden text-xs text-faint md:block">
                  {hint}
                </span>
                <button
                  onClick={submit}
                  disabled={!canSave}
                  className="rounded-xl bg-ink px-5 py-2 text-sm font-semibold text-bg transition hover:bg-coral-deep disabled:opacity-40"
                >
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
