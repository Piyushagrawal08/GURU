"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { confirmPasswordReset } from "@/app/actions";
import { AuthError, AuthShell, primaryButton } from "@/components/AuthShell";

export default function ConfirmResetForm({
  tokenHash,
  code,
  linkError,
}: {
  tokenHash: string;
  code: string;
  linkError: string;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [hashError, setHashError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Supabase reports some link errors in the URL fragment, which the server never sees.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const err = hash.get("error_description");
    if (err) setHashError(err);
  }, []);

  const broken = linkError || hashError || (!tokenHash && !code);

  if (broken) {
    return (
      <AuthShell title="This link doesn't work">
        <AuthError>
          {linkError || hashError
            ? "This reset link has expired or was already used."
            : "This reset link is incomplete."}
        </AuthError>
        <Link href="/forgot-password" className={`${primaryButton} mt-6 block text-center`}>
          Send a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Click below to confirm it's you and choose a new password."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          const fd = new FormData();
          fd.set("token_hash", tokenHash);
          fd.set("code", code);
          start(async () => {
            const res = await confirmPasswordReset(fd);
            if (res && !res.ok) setMsg(res.error ?? "Something went wrong.");
          });
        }}
        className="space-y-4"
      >
        {msg && <AuthError>{msg}</AuthError>}
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Checking link…" : "Reset my password"}
        </button>
      </form>
      {msg && (
        <p className="mt-5 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Send a new link
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
