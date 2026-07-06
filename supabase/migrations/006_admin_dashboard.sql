-- ============================================================
-- SmartGym — Supabase Migration 006: Admin Dashboard Schema & Security
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add is_admin column to profiles table
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- 2. Add is_premium column to routine_templates table
alter table public.routine_templates add column if not exists is_premium boolean not null default false;

-- 3. Add tempo and rpe columns to routine_template_exercises table
alter table public.routine_template_exercises add column if not exists tempo text;
alter table public.routine_template_exercises add column if not exists rpe integer;

-- 4. Create routine_template_day_exercises table (for day-based exercises in routine templates)
create table if not exists public.routine_template_day_exercises (
  id              uuid primary key default uuid_generate_v4(),
  day_id          uuid not null references public.routine_template_days(id) on delete cascade,
  template_id     uuid not null references public.routine_templates(id) on delete cascade,
  exercise_id     text not null,                        -- catalog exercise slug
  exercise_name   text not null,
  display_order   integer not null default 0,
  sets            integer not null default 3,
  reps            integer,
  weight          numeric(8,2),
  rest_seconds    integer,
  tempo           text,
  rpe             integer,
  note            text,
  created_at      timestamptz not null default now(),
  unique (day_id, display_order)
);

comment on table public.routine_template_day_exercises is
  'Exercises assigned to a specific day in a routine template. Managed by admins.';

-- Enable RLS on the new table
alter table public.routine_template_day_exercises enable row level security;

-- 5. Drop existing SELECT policies to re-create them with Admin override
drop policy if exists "catalog_exercises: public read" on public.catalog_exercises;
drop policy if exists "routine_templates: public read active" on public.routine_templates;
drop policy if exists "routine_template_exercises: public read active" on public.routine_template_exercises;
drop policy if exists "routine_template_days: public read active" on public.routine_template_days;

-- 6. Create active-or-admin SELECT policies
create policy "catalog_exercises: select active or admin"
  on public.catalog_exercises for select
  using (
    is_active = true
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "routine_templates: select active or admin"
  on public.routine_templates for select
  using (
    is_active = true
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "routine_template_exercises: select active or admin"
  on public.routine_template_exercises for select
  using (
    exists (
      select 1 from public.routine_templates t
      where t.id = template_id and (t.is_active = true or exists (
        select 1 from public.profiles where id = auth.uid() and is_admin = true
      ))
    )
  );

create policy "routine_template_days: select active or admin"
  on public.routine_template_days for select
  using (
    exists (
      select 1 from public.routine_templates t
      where t.id = template_id and (t.is_active = true or exists (
        select 1 from public.profiles where id = auth.uid() and is_admin = true
      ))
    )
  );

create policy "routine_template_day_exercises: select active or admin"
  on public.routine_template_day_exercises for select
  using (
    exists (
      select 1 from public.routine_templates t
      where t.id = template_id and (t.is_active = true or exists (
        select 1 from public.profiles where id = auth.uid() and is_admin = true
      ))
    )
  );

-- 7. Add WRITE policies for admins on public tables
-- catalog_exercises
create policy "catalog_exercises: admin write"
  on public.catalog_exercises for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- routine_templates
create policy "routine_templates: admin write"
  on public.routine_templates for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- routine_template_exercises
create policy "routine_template_exercises: admin write"
  on public.routine_template_exercises for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- routine_template_days
create policy "routine_template_days: admin write"
  on public.routine_template_days for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- routine_template_day_exercises
create policy "routine_template_day_exercises: admin write"
  on public.routine_template_day_exercises for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 8. Secure Profiles update policy (prevent regular users from elevating themselves to admin)
drop policy if exists "profiles: users can update own profile" on public.profiles;

create policy "profiles: users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      is_admin = (select is_admin from public.profiles where id = auth.uid())
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and is_admin = true
      )
    )
  );
