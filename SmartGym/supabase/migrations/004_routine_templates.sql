-- ============================================================
-- SmartGym — Supabase Migration 004: Routine Templates
-- Run AFTER 001_initial_schema.sql + 002_rls_policies.sql + 003_indexes.sql
--
-- Public, admin-managed workout routine TEMPLATES (Explore programs).
-- Kept 100% separate from user-owned `routines` so global templates stay
-- clean and never mix into a user's synced/offline data. Users clone a
-- template into their own `routines` row on save/start (done client-side).
--
-- Purely additive: does NOT touch routines / routine_exercises / workout_* /
-- catalog_exercises. Existing user data, sync, cache and offline are untouched.
-- Idempotent: safe to re-run (IF NOT EXISTS + guarded enum).
-- ============================================================

-- 1. Enum: training goal (new; reuses existing exercise_difficulty for level)
-- ────────────────────────────────────────────────────────────
do $$ begin
  create type public.routine_goal as enum (
    'strength', 'hypertrophy', 'endurance', 'fat_loss', 'mobility', 'general'
  );
exception when duplicate_object then null; end $$;

-- 2. Table: routine_templates  (one row per Explore program)
-- ────────────────────────────────────────────────────────────
create table if not exists public.routine_templates (
  id                  uuid primary key default uuid_generate_v4(),
  slug                text unique not null,             -- stable human key for upserts
  name                text not null,
  description         text,
  color               text not null default '#00FF9D',
  category            text,                             -- free-form grouping, e.g. 'beginner'
  goal                public.routine_goal,              -- training goal
  difficulty          public.exercise_difficulty,       -- reuse catalog enum
  estimated_duration  integer,                          -- minutes
  estimated_calories  integer,
  image_url           text,
  emoji               text,
  is_featured         boolean not null default false,   -- surfaced in "Featured Programs"
  is_active           boolean not null default true,    -- soft on/off switch
  sort_order          integer not null default 0,
  cms_version         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.routine_templates is
  'Public workout routine templates (Explore programs). Admin/CMS managed; users clone into their own routines.';

-- 3. Table: routine_template_exercises (flat list; mirrors routine_exercises)
-- ────────────────────────────────────────────────────────────
create table if not exists public.routine_template_exercises (
  id              uuid primary key default uuid_generate_v4(),
  template_id     uuid not null references public.routine_templates(id) on delete cascade,
  exercise_id     text not null,                        -- catalog slug/id (denormalized-friendly)
  exercise_name   text not null,                        -- denormalized for offline
  display_order   integer not null default 0,
  sets            integer not null default 3,
  reps            integer,
  weight          numeric(8,2),
  rest_seconds    integer,
  note            text,
  created_at      timestamptz not null default now(),
  unique (template_id, display_order)                   -- lets seeds upsert deterministically
);

comment on table public.routine_template_exercises is
  'Flat exercise list for a routine template. Order by display_order.';

-- 4. Table: routine_template_days (optional multi-day programs)
-- ────────────────────────────────────────────────────────────
create table if not exists public.routine_template_days (
  id            uuid primary key default uuid_generate_v4(),
  template_id   uuid not null references public.routine_templates(id) on delete cascade,
  name          text not null,
  day_order     integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (template_id, day_order)
);

-- 5. updated_at trigger (reuses handle_updated_at from 001)
-- ────────────────────────────────────────────────────────────
drop trigger if exists routine_templates_updated_at on public.routine_templates;
create trigger routine_templates_updated_at
  before update on public.routine_templates
  for each row execute function public.handle_updated_at();

-- 6. Indexes
-- ────────────────────────────────────────────────────────────
create index if not exists idx_routine_templates_active     on public.routine_templates (is_active);
create index if not exists idx_routine_templates_featured   on public.routine_templates (is_featured) where is_featured = true;
create index if not exists idx_routine_templates_category   on public.routine_templates (category);
create index if not exists idx_routine_templates_difficulty on public.routine_templates (difficulty);
create index if not exists idx_routine_templates_goal       on public.routine_templates (goal);
create index if not exists idx_routine_templates_sort       on public.routine_templates (sort_order);

create index if not exists idx_rte_template  on public.routine_template_exercises (template_id);
create index if not exists idx_rte_exercise  on public.routine_template_exercises (exercise_id);

create index if not exists idx_rtd_template  on public.routine_template_days (template_id);

-- 7. Row Level Security — public read of ACTIVE templates; writes service-role only
-- ────────────────────────────────────────────────────────────
alter table public.routine_templates          enable row level security;
alter table public.routine_template_exercises enable row level security;
alter table public.routine_template_days       enable row level security;

-- Public (incl. anonymous) can read active templates only.
create policy "routine_templates: public read active"
  on public.routine_templates for select
  using (is_active = true);

create policy "routine_template_exercises: public read active"
  on public.routine_template_exercises for select
  using (
    exists (
      select 1 from public.routine_templates t
      where t.id = template_id and t.is_active = true
    )
  );

create policy "routine_template_days: public read active"
  on public.routine_template_days for select
  using (
    exists (
      select 1 from public.routine_templates t
      where t.id = template_id and t.is_active = true
    )
  );

-- NO insert/update/delete policies are defined on purpose:
--   • anonymous  → no write (default deny)
--   • authenticated → no write (default deny)
--   • service_role → bypasses RLS, so seed/admin scripts still work
-- This is the same "public read, admin write" model as catalog_exercises.
