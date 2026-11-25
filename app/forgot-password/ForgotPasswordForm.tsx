"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/actions";
import { AuthError, AuthField, AuthShell, primaryButton } from "@/components/AuthShell";

const RESEND_WAIT = 60;

export default function ForgotPasswordForm({ expired }: { expired: boolean }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(
    expired ? "Your reset link has expired. Enter your email to get a new one." : null,
  );
  const [wait, setWait] = useState(0);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  function send(address: string) {
    setMsg(null);
    const fd = new FormData();
    fd.set("email", address);
    start(async () => {
      const res = await requestPasswordReset(fd);
      if (res.ok) {
        setSentTo(address.trim());
        setWait(RESEND_WAIT);
      } else {
        setMsg(res.error ?? "Something went wrong.");
      }
    });
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your inbox">
        <p className="text-sm text-ink-soft">
          We sent a password reset link to <strong className="text-ink">{sentTo}</strong>. Open
          it and click <em>Reset my password</em>. The link works once and expires in an hour.
        </p>
        <p className="mt-3 text-sm text-muted">Not there? Check your spam folder.</p>

        {msg && (
          <div className="mt-4">
            <AuthError>{msg}</AuthError>
          </div>
        )}

        <button
          type="button"
          disabled={pending || wait > 0}
          onClick={() => send(sentTo)}
          className={`${primaryButton} mt-6`}
        >
          {pending ? "Sending…" : wait > 0 ? `Resend link in ${wait}s` : "Resend link"}
        </button>
        <BackToSignIn />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a link to set a new one."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(email);
        }}
        className="space-y-4"
      >
        <AuthField
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {msg && <AuthError>{msg}</AuthError>}

        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Checking…" : "Send reset link"}
        </button>
      </form>
      <BackToSignIn />
    </AuthShell>
  );
}

function BackToSignIn() {
  return (
    <p className="mt-5 text-center text-sm">
      <Link href="/login" className="text-muted underline-offset-4 hover:text-ink hover:underline">
        ← Back to sign in
      </Link>
    </p>
  );
}
