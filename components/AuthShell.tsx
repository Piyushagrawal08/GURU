"use client";

import { motion } from "motion/react";

/** The GURU logo header + card used by the password-reset screens. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
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
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-1 mb-5 text-sm text-muted">{subtitle}</p>}
          {!subtitle && <div className="mb-5" />}
          {children}
        </div>
      </motion.div>
    </main>
  );
}

export function AuthField({
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

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral-deep">
      {children}
    </p>
  );
}

export const primaryButton =
  "w-full rounded-xl bg-ink py-3 font-semibold text-bg transition hover:bg-coral-deep disabled:opacity-60";
