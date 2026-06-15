"use client";

import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paperclip, Sparkles, X, Hash } from "lucide-react";
import { addItem } from "@/app/actions";

export default function AddBar() {
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const canSave = (text.trim().length > 0 || !!file) && !pending;

  function reset() {
    setText("");
    setTags("");
    setFile(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function submit() {
    if (!canSave) return;
    setError(null);
    const fd = new FormData();
    fd.set("text", text);
    fd.set("tags", tags);
    if (file) fd.set("file", file);
    start(async () => {
      const res = await addItem(fd);
      if (res.ok) reset();
      else setError(res.error ?? "Something went wrong.");
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
    <motion.div
      layout
      className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-soft"
    >
      <div className="flex items-start gap-3">
        <div className="mt-2 hidden sm:block">
          <Sparkles className="h-5 w-5 text-coral" />
        </div>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            }}
            rows={open ? 3 : 1}
            placeholder="Paste a link, repo, or write a note…"
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint"
          />

          {file && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-bg-tint px-3 py-1.5 text-sm text-ink-soft">
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
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
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
                <span className="hidden text-xs text-faint md:block">{hint}</span>
                <button
                  onClick={submit}
                  disabled={!canSave}
                  className="rounded-xl bg-ink px-5 py-2 text-sm font-semibold text-bg transition hover:bg-coral-deep disabled:opacity-40"
                >
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-2 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral-deep">
                {error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
