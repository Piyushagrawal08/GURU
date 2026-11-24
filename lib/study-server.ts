import type { createClient } from "@/lib/supabase/server";
import type { StudyAnnotation, StudyCounts } from "@/lib/study";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * True when the error means the `study_annotations` table hasn't been created
 * yet (supabase/schema.sql not re-run), rather than a transient failure.
 */
function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /study_annotations/i.test(error.message ?? "")
  );
}

/** Highlight / note counts per guide for the signed-in user. */
export async function getStudyCounts(
  supabase: Supabase,
): Promise<{ counts: StudyCounts; setupNeeded: boolean }> {
  const { data, error } = await supabase.from("study_annotations").select("doc, kind");
  const counts: StudyCounts = {};
  if (error) return { counts, setupNeeded: isMissingTable(error) };
  for (const row of data ?? []) {
    const c = (counts[row.doc] ??= { highlights: 0, notes: 0 });
    if (row.kind === "highlight") c.highlights += 1;
    else c.notes += 1;
  }
  return { counts, setupNeeded: false };
}

/** Every highlight + note the signed-in user has on one guide. */
export async function getStudyAnnotations(
  supabase: Supabase,
  doc: string,
): Promise<{ annotations: StudyAnnotation[]; setupNeeded: boolean; error?: string }> {
  const { data, error } = await supabase
    .from("study_annotations")
    .select("*")
    .eq("doc", doc)
    .order("created_at", { ascending: true });
  if (error) {
    return {
      annotations: [],
      setupNeeded: isMissingTable(error),
      error: error.message,
    };
  }
  return { annotations: (data ?? []) as StudyAnnotation[], setupNeeded: false };
}
