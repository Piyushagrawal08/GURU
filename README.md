# 🔆 Beacon — your personal learning vault

A private, multi-device place to save everything from your AI learning journey:
links, GitHub/HF repos, PDFs, images and notes — each one taggable, searchable,
bookmarkable, and pinnable to a day of your **21-day sprint**.

Built with Next.js 16 (App Router) + Supabase (Postgres, Storage, Auth), styled
with a warm, animated light theme. Deploys free to Vercel and works on any device.

---

## What it does

- **Save anything** — paste a URL/repo (it auto-fetches the title + preview
  image), upload a PDF or image, or jot a raw note. Everything becomes a card.
- **Tags + search** — tag items (`#agents`, `#rag`, `#day3`), full-text search
  across titles/notes/tags, and filter by type.
- **21-day tracker** — assign items to a day, see progress at a glance, and write
  a daily reflection.
- **Bookmarks + highlights** — star items to revisit, and add your own takeaway
  on each one for future reference.

---

## Setup (about 10 minutes, one time)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project** (free tier is fine).
2. When it's ready, open **SQL Editor → New query**, paste the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**. This creates
   the tables, security rules, and the private file-storage bucket.

### 2. Add your keys locally

1. In Supabase: **Project Settings → API**. Copy the **Project URL** and the
   **anon public** key.
2. In this folder, copy the example env file and fill it in:
   ```bash
   cp .env.local.example .env.local
   ```
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, click **Create account**, and you're in.

> **Tip — skip the email confirmation step:** In Supabase go to
> **Authentication → Sign In / Providers → Email** and turn **Confirm email**
> off. Then sign-up logs you straight in. (Leave it on if you prefer
> email verification.)

### 4. Turn on "Forgot password" (one-time setup)

The sign-in page has a **Forgot password?** link. It checks that the email has
an account, then emails a one-time reset link. It needs four things:

1. **Database function.** Re-run [`supabase/schema.sql`](./supabase/schema.sql)
   in the SQL Editor (it's safe to re-run). This adds `email_exists`, which
   only the server's secret key can call.
2. **Secret key.** In **Project Settings → API**, copy the `service_role`
   (or `sb_secret_…`) key and add it to `.env.local` and to Vercel:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   Never prefix it with `NEXT_PUBLIC_`, and never commit it.
3. **Email template.** **Authentication → Email Templates → Reset Password**,
   replace the body with:
   ```html
   <h2>Reset your GURU password</h2>
   <p>Click below to choose a new password. The link works once and expires in 1 hour.</p>
   <p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Reset my password</a></p>
   <p>If you didn't ask for this, you can ignore this email.</p>
   ```
4. **Allowed URLs.** **Authentication → URL Configuration → Redirect URLs**, add
   `http://localhost:3000/**` and `https://<your-vercel-domain>/**`. Without
   this, the email link falls back to the Site URL and won't work.

Optional but recommended: Supabase's built-in email sender only sends a few
emails per hour, so set up custom SMTP (for example Resend) under
**Authentication → Emails → SMTP Settings** before real users rely on it.

---

## Deploy to Vercel (so it's live on every device)

1. Push this `beacon` folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Under **Environment Variables**, add the values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (secret, needed for Forgot password)
4. **Deploy.** You'll get a public URL like `https://beacon-xyz.vercel.app`.
5. Back in Supabase → **Authentication → URL Configuration**, set the **Site URL**
   to your Vercel URL (so auth links/redirects point at production).

Open the URL on your phone, laptop, anywhere — same vault, always in sync.

---

## How it's built

```
app/
  page.tsx          Server component: auth gate + loads items, signs file URLs
  login/page.tsx    Email/password auth screen
  forgot-password/  Request a reset link (checks the email has an account)
  auth/confirm/     Where the emailed reset link lands ("Reset my password" button)
  reset-password/   Set the new password (only after a valid link)
  actions.ts        Server Actions: add / favorite / highlight / delete / auth / password reset
components/          Dashboard, AddBar, ItemCard, ItemModal, Tracker, SetupNotice
lib/
  supabase/         Browser + server Supabase clients
  metadata.ts       Fetches OpenGraph title/description/preview for links
  types.ts          Shared types + the type→colour design tokens
proxy.ts            Keeps the Supabase session fresh (Next 16 renamed middleware)
supabase/schema.sql Tables, row-level security, storage bucket + policies
```

**Security:** every table uses Row-Level Security so you only ever see your own
rows; uploaded files live in a **private** bucket under a per-user folder and are
served through short-lived signed URLs.

---

## Ideas for later (this grows with you)

- Browser extension / share target to save the current page in one tap
- AI auto-summary & auto-tagging of saved links and PDFs
- Spaced-repetition "revisit" reminders for highlights
- Weekly digest of what you saved
- Collections / boards beyond the 21-day structure
- Full-text PDF search

---

Made for a 21-day AI learning sprint. Happy building. 🔆
