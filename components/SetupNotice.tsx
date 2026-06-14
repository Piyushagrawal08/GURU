export default function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-coral text-2xl shadow-lift">
        <span aria-hidden>🧠</span>
      </div>
      <h1 className="font-display text-4xl font-semibold text-ink">
        Almost there
      </h1>
      <p className="mt-2 text-muted">
        GURU needs a Supabase project to store your vault. Two quick steps:
      </p>

      <ol className="mt-7 space-y-4">
        {[
          {
            t: "Create a Supabase project",
            d: "At supabase.com → New project. Then open the SQL Editor and run the script in supabase/schema.sql.",
          },
          {
            t: "Add your keys",
            d: "Copy .env.local.example to .env.local and paste your Project URL + anon key (Project Settings → API). Restart the dev server.",
          },
        ].map((s, i) => (
          <li
            key={i}
            className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-soft"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-semibold text-bg">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-ink">{s.t}</p>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-sm text-faint">
        Full instructions live in <code className="text-ink-soft">README.md</code>.
      </p>
    </main>
  );
}
