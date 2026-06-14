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
        <div className="relative aspect-[16/9] overflow-hidden bg-bg-tint">
          <Image
            src={preview}
            alt=""
            fill
            sizes="(max-width:768px) 100vw, 360px"
            className={
              item.type === "image"
                ? "object-cover transition-transform duration-500 group-hover:scale-105"
                : "object-cover transition-transform duration-500 group-hover:scale-105"
            }
            unoptimized
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.tw}`}
          >
            <Icon className="h-3 w-3" />
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
              className={`h-4 w-4 ${item.favorite ? "fill-amber text-amber" : ""}`}
            />
          </button>
        </div>

        <h3 className="line-clamp-2 font-semibold leading-snug text-ink">
          {item.title || "Untitled"}
        </h3>

        {item.type === "note" && item.description && (
          <p className="line-clamp-3 text-sm text-muted">{item.description}</p>
        )}

        {item.highlight && (
          <p className="flex gap-1.5 rounded-lg bg-bg-tint px-2.5 py-2 text-xs italic text-ink-soft">
            <Quote className="h-3 w-3 shrink-0 text-coral" />
            <span className="line-clamp-2">{item.highlight}</span>
          </p>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-md bg-bg-tint px-2 py-0.5 text-[11px] font-medium text-muted"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1 text-xs text-faint">
          {item.day != null && (
            <span className="rounded-md bg-indigo-soft px-2 py-0.5 font-semibold text-indigo">
              Day {item.day}
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
