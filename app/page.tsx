import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { DailyLog, Item } from "@/lib/types";
import Dashboard from "@/components/Dashboard";
import SetupNotice from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: itemRows }, { data: logRows }] = await Promise.all([
    supabase.from("items").select("*").order("created_at", { ascending: false }),
    supabase.from("daily_logs").select("*"),
  ]);

  const items = (itemRows ?? []) as Item[];

  // Resolve short-lived signed URLs for uploaded files in one batch.
  const filePaths = items
    .filter((i) => i.file_path)
    .map((i) => i.file_path as string);

  if (filePaths.length) {
    const { data: signed } = await supabase.storage
      .from("vault")
      .createSignedUrls(filePaths, 60 * 60 * 24 * 7);
    const byPath = new Map(
      (signed ?? []).map((s) => [s.path, s.signedUrl] as const),
    );
    for (const item of items) {
      if (item.file_path) item.file_url = byPath.get(item.file_path) ?? null;
    }
  }

  return (
    <Dashboard
      items={items}
      logs={(logRows ?? []) as DailyLog[]}
      email={user.email ?? ""}
    />
  );
}
