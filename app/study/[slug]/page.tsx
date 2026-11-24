import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudyDoc } from "@/lib/study";
import { getStudyAnnotations } from "@/lib/study-server";
import StudyViewer from "@/components/study/StudyViewer";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/study/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = getStudyDoc(slug);
  return { title: doc ? `${doc.title} · GURU` : "Study · GURU" };
}

export default async function StudyDocPage(props: PageProps<"/study/[slug]">) {
  const { slug } = await props.params;
  const doc = getStudyDoc(slug);
  if (!doc) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { annotations, setupNeeded, error } = await getStudyAnnotations(supabase, doc.slug);

  return (
    <StudyViewer
      // Remount when switching guides so highlight state never leaks across docs.
      key={doc.slug}
      doc={doc}
      initial={annotations}
      setupNeeded={setupNeeded}
      loadError={error}
    />
  );
}
