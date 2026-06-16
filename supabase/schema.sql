-- ============================================================================
-- ADHD veidai — Supabase setup
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query →
-- paste everything below → Run. Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================================

-- 1) The people table -------------------------------------------------------
create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,              -- "Marius"
  role        text,                       -- "29 · dizainerė" (the line under the name)
  story       jsonb not null default '[]'::jsonb,  -- array of paragraphs
  photo_url   text,                       -- public URL of the uploaded photo (or null)
  fb          int  default 1,             -- pravatar fallback id used when photo_url is null
  sort_order  int  default 0,             -- lower shows first
  created_at  timestamptz default now()
);

-- 2) Row Level Security -----------------------------------------------------
-- Anyone may READ (the public gallery). Only a logged-in editor may write.
alter table public.people enable row level security;

drop policy if exists "people are publicly readable" on public.people;
create policy "people are publicly readable"
  on public.people for select
  to anon, authenticated
  using (true);

drop policy if exists "editors can insert" on public.people;
create policy "editors can insert"
  on public.people for insert
  to authenticated
  with check (true);

drop policy if exists "editors can update" on public.people;
create policy "editors can update"
  on public.people for update
  to authenticated
  using (true);

drop policy if exists "editors can delete" on public.people;
create policy "editors can delete"
  on public.people for delete
  to authenticated
  using (true);

-- 3) Storage bucket for photos ----------------------------------------------
-- Public read so the gallery can show images; only logged-in editors can write.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos are publicly readable" on storage.objects;
create policy "photos are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'photos');

drop policy if exists "editors can upload photos" on storage.objects;
create policy "editors can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');

drop policy if exists "editors can update photos" on storage.objects;
create policy "editors can update photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'photos');

drop policy if exists "editors can delete photos" on storage.objects;
create policy "editors can delete photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos');

-- ============================================================================
-- 4) Create the editor's login
--    Dashboard → Authentication → Users → "Add user" → enter the editor's
--    email + a password. (Turn OFF "Auto Confirm User" only if you want them to
--    confirm by email; for a single trusted editor, leaving it confirmed is fine.)
--    That email + password is what they type on the /admin login screen.
--
-- 5) (Optional) turn off public sign-ups so nobody else can create an account:
--    Dashboard → Authentication → Providers → Email → disable "Allow new users
--    to sign up".
-- ============================================================================
