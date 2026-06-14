export type ItemType = "link" | "repo" | "pdf" | "image" | "note";

export interface Item {
  id: string;
  user_id: string;
  type: ItemType;
  title: string | null;
  url: string | null;
  description: string | null;
  /** Storage path inside the private bucket, for uploaded pdf/image items. */
  file_path: string | null;
  /** A signed, time-limited URL resolved at render time for file/preview. */
  file_url?: string | null;
  /** OpenGraph / favicon preview image for links. */
  image_url: string | null;
  domain: string | null;
  tags: string[];
  day: number | null;
  favorite: boolean;
  /** The user's own takeaway / highlight to revisit later. */
  highlight: string | null;
  created_at: string;
}

export interface DailyLog {
  user_id: string;
  day: number;
  reflection: string;
  updated_at: string;
}

export const TOTAL_DAYS = 21;

export const TYPE_META: Record<
  ItemType,
  { label: string; tw: string; dot: string }
> = {
  link: { label: "Link", tw: "text-indigo bg-indigo-soft", dot: "bg-indigo" },
  repo: { label: "Repo", tw: "text-violet bg-violet-soft", dot: "bg-violet" },
  pdf: { label: "PDF", tw: "text-coral-deep bg-coral-soft", dot: "bg-coral" },
  image: { label: "Image", tw: "text-mint bg-mint-soft", dot: "bg-mint" },
  note: { label: "Note", tw: "text-amber bg-amber-soft", dot: "bg-amber" },
};
