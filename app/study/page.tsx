import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STUDY_DOCS } from "@/lib/study";
import { getStudyCounts } from "@/lib/study-server";
import StudyIndex from "@/components/study/StudyIndex";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Study Library · GURU",
};

export default async function StudyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { counts, setupNeeded } = await getStudyCounts(supabase);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-7 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition hover:border-line-strong"
        >
          <ArrowLeft className="h-4 w-4" /> GURU
        </Link>
      </header>
      <StudyIndex docs={STUDY_DOCS} counts={counts} setupNeeded={setupNeeded} />
    </div>
  );
}
