import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasResetPass } from "@/lib/password-reset";
import ResetPasswordForm from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

/** Only reachable right after opening a valid reset link. */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await hasResetPass(user.id))) redirect("/forgot-password?expired=1");

  return <ResetPasswordForm email={user.email ?? ""} />;
}
