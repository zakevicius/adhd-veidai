-- ============================================================================
-- ADHD veidai — split the single "role" line into separate age + profession.
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- The old `role` column is kept as a fallback; new entries use age + profession.
-- ============================================================================

alter table public.people add column if not exists age        text;
alter table public.people add column if not exists profession text;

-- If you already imported rows that only have `role` filled (e.g. "29 · dizainerė"),
-- this backfills age + profession from it. Harmless if there are none.
update public.people
set
  age = nullif(trim(split_part(role, '·', 1)), ''),
  profession = nullif(trim(split_part(role, '·', 2)), '')
where role is not null
  and age is null
  and profession is null
  and role like '%·%';

-- Rows whose role had no "·" (e.g. just "Vilnius") go into profession.
update public.people
set profession = role
where role is not null
  and age is null
  and profession is null
  and role not like '%·%';
