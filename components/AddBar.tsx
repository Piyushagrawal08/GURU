"use client";

import { useState } from "react";
import { Sparkles, Paperclip } from "lucide-react";
import ComposeModal from "./ComposeModal";

export default function AddBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-4 text-left shadow-soft transition hover:border-line-strong hover:shadow-lift"
      >
        <Sparkles className="h-5 w-5 shrink-0 text-coral" />
        <span className="flex-1 text-[15px] text-faint">
          Paste a link, repo, or write a note…
        </span>
        <span className="hidden items-center gap-1.5 rounded-lg border border-line bg-bg/50 px-2.5 py-1.5 text-xs text-muted sm:flex">
          <Paperclip className="h-3.5 w-3.5" />
          Attach
        </span>
      </button>

      <ComposeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
