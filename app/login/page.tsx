"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { signIn, signUp } from "@/app/actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await (mode === "signin" ? signIn : signUp)(fd);
      if (res?.error) setMsg(res.error);
    });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-coral text-2xl shadow-lift">
            <span aria-hidden>🧠</span>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
            GURU
          </h1>
          <p className="mt-1 text-muted">an AI master</p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-7 shadow-soft">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-bg-tint p-1 text-sm font-medium">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setMsg(null);
                }}
                className={`rounded-lg py-2 transition ${
                  mode === m
                    ? "bg-surface text-ink shadow-soft"
                    : "text-muted hover:text-ink"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
            />

            {msg && (
              <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral-deep">
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-ink py-3 font-semibold text-bg transition hover:bg-coral-deep disabled:opacity-60"
            >
              {pending
                ? "Just a sec…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          Your vault is private — only you can see what you save.
        </p>
      </motion.div>
    </main>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>
      <input
        {...props}
        required
        className="w-full rounded-xl border border-line bg-bg/60 px-4 py-3 text-ink outline-none transition placeholder:text-faint focus:border-indigo focus:bg-surface"
      />
    </label>
  );
}
