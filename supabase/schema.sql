-- ============================================================================
-- Beacon — database schema  (SAFE / ADDITIVE)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- This script ONLY creates new objects. It does NOT drop or delete anything,
-- and it does not touch any of your existing tables. It adds:
--   • table  public.items
--   • table  public.daily_logs
--   • storage bucket  'vault'  (private)
--   • row-level-security policies scoped to those objects only
-- Safe to re-run: everything is guarded with IF NOT EXISTS / existence checks.
-- ============================================================================

-- ---------- items ----------------------------------------------------------
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type        text not null check (type in ('link','repo','pdf','image','note')),
  title       text,
  url         text,
  description text,
  file_path   text,
  image_url   text,
  domain      text,
  tags        text[] not null default '{}',
  day         int,
  favorite    boolean not null default false,
  highlight   text,
  created_at  timestamptz not null default now()
);

create index if not exists items_user_created_idx on public.items (user_id, created_at desc);
create index if not exists items_user_day_idx    on public.items (user_id, day);
create index if not exists items_tags_idx        on public.items using gin (tags);

alter table public.items enable row level security;

-- ---------- daily_logs (21-day tracker reflections) ------------------------
create table if not exists public.daily_logs (
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  day        int  not null check (day between 1 and 366),
  reflection text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.daily_logs enable row level security;

-- ---------- storage bucket for uploaded pdf / image files ------------------
insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;

-- ---------- policies (created only if missing — no DROP needed) -------------
-- A small helper avoids repeating the existence check for every policy.
do $$
declare
  p record;
begin
  for p in
    select * from (values
      -- schema,   table,           name,                 command,  using_expr,                      check_expr
      ('public',  'items',       'items_select_own',   'select', 'auth.uid() = user_id',          null),
      ('public',  'items',       'items_insert_own',   'insert', null,                            'auth.uid() = user_id'),
      ('public',  'items',       'items_update_own',   'update', 'auth.uid() = user_id',          'auth.uid() = user_id'),
      ('public',  'items',       'items_delete_own',   'delete', 'auth.uid() = user_id',          null),
      ('public',  'daily_logs',  'daily_logs_all_own', 'all',    'auth.uid() = user_id',          'auth.uid() = user_id'),
      ('storage', 'objects',     'vault_select_own',   'select', 'bucket_id = ''vault'' and (storage.foldername(name))[1] = auth.uid()::text', null),
      ('storage', 'objects',     'vault_insert_own',   'insert', null, 'bucket_id = ''vault'' and (storage.foldername(name))[1] = auth.uid()::text'),
      ('storage', 'objects',     'vault_delete_own',   'delete', 'bucket_id = ''vault'' and (storage.foldername(name))[1] = auth.uid()::text', null)
    ) as t(sch, tbl, nm, cmd, using_expr, check_expr)
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = p.sch and tablename = p.tbl and policyname = p.nm
    ) then
      execute format(
        'create policy %I on %I.%I for %s%s%s',
        p.nm, p.sch, p.tbl, p.cmd,
        case when p.using_expr is not null then ' using (' || p.using_expr || ')' else '' end,
        case when p.check_expr is not null then ' with check (' || p.check_expr || ')' else '' end
      );
    end if;
  end loop;
end $$;
