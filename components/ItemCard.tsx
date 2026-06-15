"use client";

import { useTransition } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Star,
  Link as LinkIcon,
  GitBranch,
  FileText,
  ImageIcon,
  StickyNote,
  Quote,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { toggleFavorite } from "@/app/actions";
import { TYPE_META, type Item, type ItemType } from "@/lib/types";

const ICONS: Record<ItemType, typeof LinkIcon> = {
  link: LinkIcon,
  repo: GitBranch,
  pdf: FileText,
  image: ImageIcon,
  note: StickyNote,
};

const dateFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d);
}

export default function ItemCard({
  item,
  onOpen,
}: {
  item: Item;
  onOpen: (item: Item) => void;
}) {
  const [pending, start] = useTransition();
  const meta = TYPE_META[item.type];
  const Icon = ICONS[item.type];

  const preview =
    item.type === "image" ? item.file_url : item.image_url || item.file_url;
  const href = item.url ?? item.file_url ?? null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      onClick={() => onOpen(item)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-soft transition-shadow hover:shadow-lift"
    >
      {preview && item.type !== "note" && (
        <div className="relative aspect-[2/1] overflow-hidden bg-bg-tint">
          <Image
            src={preview}
            alt=""
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 280px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.tw}`}
          >
            <Icon className="h-2.5 w-2.5" />
            {meta.label}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              start(() => {
                toggleFavorite(item.id, !item.favorite);
              });
            }}
            disabled={pending}
            aria-label={item.favorite ? "Remove bookmark" : "Bookmark"}
            className="rounded-full p-1 text-faint transition hover:bg-amber-soft hover:text-amber"
          >
            <Star
              className={`h-3.5 w-3.5 ${item.favorite ? "fill-amber text-amber" : ""}`}
            />
          </button>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
          {item.title || "Untitled"}
        </h3>

        {item.type === "note" && item.description && (
          <p className="line-clamp-2 text-xs text-muted">{item.description}</p>
        )}

        {item.highlight && (
          <p className="flex gap-1.5 rounded-lg bg-bg-tint px-2 py-1.5 text-[11px] italic text-ink-soft">
            <Quote className="h-3 w-3 shrink-0 text-coral" />
            <span className="line-clamp-2">{item.highlight}</span>
          </p>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md bg-bg-tint px-1.5 py-0.5 text-[10px] font-medium text-muted"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1 text-[11px] text-faint">
          {formatDate(item.created_at) && (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-soft px-1.5 py-0.5 font-semibold text-indigo">
              <CalendarDays className="h-2.5 w-2.5" />
              {formatDate(item.created_at)}
            </span>
          )}
          {item.domain && <span className="truncate">{item.domain}</span>}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto inline-flex items-center gap-1 text-muted opacity-0 transition group-hover:opacity-100 hover:text-indigo"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}
