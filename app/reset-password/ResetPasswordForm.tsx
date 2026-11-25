"use client";

import { useState, useTransition } from "react";
import { updatePassword } from "@/app/actions";
import { AuthError, AuthField, AuthShell, primaryButton } from "@/components/AuthShell";

export default function ResetPasswordForm({ email }: { email: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={email ? `For ${email}. You'll be signed out on your other devices.` : undefined}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          const fd = new FormData(e.currentTarget);
          if (fd.get("password") !== fd.get("confirm")) {
            setMsg("The two passwords don't match.");
            return;
          }
          start(async () => {
            const res = await updatePassword(fd);
            if (res && !res.ok) setMsg(res.error ?? "Something went wrong.");
          });
        }}
        className="space-y-4"
      >
        {/* Lets password managers save the new password against the right account. */}
        <input type="hidden" name="username" autoComplete="username" value={email} readOnly />
        <AuthField
          label="New password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={6}
        />
        <AuthField
          label="Confirm new password"
          name="confirm"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={6}
        />

        {msg && <AuthError>{msg}</AuthError>}

        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthShell>
  );
}
