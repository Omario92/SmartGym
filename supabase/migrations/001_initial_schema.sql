-- ============================================================
-- SmartGym — Supabase Migration 001: Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy text search

-- ============================================================
-- ENUMS
-- ============================================================

create type muscle_group as enum (
  'chest', 'back', 'shoulders', 'arms',
  'legs', 'core', 'glutes', 'cardio', 'full_body'
);

create type equipment_type as enum (
  'barbell', 'dumbbell', 'machine', 'cable',
  'bodyweight', 'kettlebell', 'resistance_band', 'smith_machine', 'other'
);

create type exercise_type as enum ('strength', 'cardio', 'flexibility');

create type exercise_difficulty as enum ('beginner', 'intermediate', 'advanced');

create type exercise_source as enum ('default', 'cms', 'custom', 'cloud');

create type routine_source as enum ('user', 'default', 'explore', 'imported', 'ai');

create type sync_status as enum ('local', 'synced', 'dirty', 'deleted', 'conflict');

-- ============================================================
-- TABLE: profiles
-- Extends auth.users — one row per authenticated user
-- ============================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  display_name text,
  avatar_url  text,
  provider    text,
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lbs')),
  is_premium  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'User profile data extending auth.users. Created automatically on sign-up.';

-- ============================================================
-- TABLE: catalog_exercises
-- Public exercise library managed by admins (CMS-backed)
-- ============================================================

create table if not exists public.catalog_exercises (
  id                  uuid primary key default uuid_generate_v4(),
  slug                text unique not null,
  name                text not null,
  description         text,
  muscle_group        muscle_group not null,
  secondary_muscles   muscle_group[] not null default '{}',
  category            text,
  equipment           equipment_type not null,
  type                exercise_type not null default 'strength',
  difficulty          exercise_difficulty not null default 'intermediate',
  instructions        text[] not null default '{}',
  tips                text[] not null default '{}',
  -- Media (CDN URLs)
  image_url           text,
  gif_url             text,
  video_url           text,
  -- Rich media array (Supabase Storage paths or CDN URLs)
  media               jsonb not null default '[]',
  -- Stats
  calories_per_minute numeric(5,2),
  is_popular          boolean not null default false,
  is_active           boolean not null default true,
  -- CMS source tracking
  cms_version         text,
  cms_updated_at      timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.catalog_exercises is
  'Public exercise library. Populated from Google Sheets CMS via Apps Script sync.';

-- ============================================================
-- TABLE: custom_exercises
-- User-created exercises stored per user
-- ============================================================

create table if not exists public.custom_exercises (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  description     text,
  muscle_group    muscle_group not null,
  secondary_muscles muscle_group[] not null default '{}',
  equipment       equipment_type not null default 'other',
  type            exercise_type not null default 'strength',
  difficulty      exercise_difficulty not null default 'intermediate',
  instructions    text[] not null default '{}',
  tips            text[] not null default '{}',
  -- Media
  image_url       text,
  gif_url         text,
  video_url       text,
  media           jsonb not null default '[]',
  -- Personal notes
  notes           text,
  -- Soft delete
  is_archived     boolean not null default false,
  deleted_at      timestamptz,
  -- Sync
  local_id        text, -- client-side UUID before cloud assignment
  sync_status     sync_status not null default 'synced',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.custom_exercises is
  'User-created custom exercises. Private to each user.';

-- ============================================================
-- TABLE: routines
-- User workout routines
-- ============================================================

create table if not exists public.routines (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  name                text not null,
  description         text,
  color               text not null default '#00FF9D',
  category            text,
  estimated_duration  integer, -- minutes
  difficulty          exercise_difficulty,
  source              routine_source not null default 'user',
  image_url           text,
  -- Soft delete
  deleted_at          timestamptz,
  -- Sync
  local_id            text,
  sync_status         sync_status not null default 'synced',
  last_performed_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.routines is
  'User workout routines. Supports flat exercise lists and day-based programs.';

-- ============================================================
-- TABLE: routine_exercises
-- Flat exercise list for a routine (primary structure)
-- ============================================================

create table if not exists public.routine_exercises (
  id              uuid primary key default uuid_generate_v4(),
  routine_id      uuid not null references public.routines(id) on delete cascade,
  exercise_id     text not null, -- may be catalog UUID or custom exercise UUID
  exercise_name   text not null, -- denormalized for offline access
  display_order   integer not null default 0,
  sets            integer not null default 3,
  reps            integer,
  weight          numeric(8,2),
  rest_seconds    integer,
  note            text,
  created_at      timestamptz not null default now()
);

comment on table public.routine_exercises is
  'Flat exercise list for a routine. Order by display_order.';

-- ============================================================
-- TABLE: routine_days
-- Optional day-based structure for multi-day programs
-- ============================================================

create table if not exists public.routine_days (
  id          uuid primary key default uuid_generate_v4(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  name        text not null, -- e.g. "Push Day", "Monday"
  day_order   integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TABLE: routine_day_exercises
-- Exercises assigned to a specific day in a routine
-- ============================================================

create table if not exists public.routine_day_exercises (
  id              uuid primary key default uuid_generate_v4(),
  day_id          uuid not null references public.routine_days(id) on delete cascade,
  routine_id      uuid not null references public.routines(id) on delete cascade,
  exercise_id     text not null,
  exercise_name   text not null,
  display_order   integer not null default 0,
  sets            integer not null default 3,
  reps            integer,
  weight          numeric(8,2),
  rest_seconds    integer,
  note            text
);

-- ============================================================
-- TABLE: workout_sessions
-- Completed workout history records
-- ============================================================

create table if not exists public.workout_sessions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  routine_id      uuid references public.routines(id) on delete set null,
  routine_name    text not null,
  started_at      timestamptz not null,
  finished_at     timestamptz,
  duration        integer, -- seconds
  total_volume    numeric(12,2),
  total_sets      integer,
  note            text,
  -- Soft delete
  deleted_at      timestamptz,
  -- Sync
  local_id        text,
  sync_status     sync_status not null default 'synced',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABLE: workout_exercise_logs
-- Exercises performed in a session
-- ============================================================

create table if not exists public.workout_exercise_logs (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id     text not null,
  exercise_name   text not null,
  rest_seconds    integer,
  display_order   integer not null default 0,
  session_note    text
);

-- ============================================================
-- TABLE: workout_set_logs
-- Individual sets within an exercise log
-- ============================================================

create table if not exists public.workout_set_logs (
  id              uuid primary key default uuid_generate_v4(),
  exercise_log_id uuid not null references public.workout_exercise_logs(id) on delete cascade,
  set_order       integer not null default 0,
  weight          numeric(8,2) not null default 0,
  reps            integer not null default 0,
  completed       boolean not null default false,
  rpe             numeric(3,1), -- 1-10 rating
  note            text,
  completed_at    timestamptz
);

-- ============================================================
-- TABLE: body_measures
-- Body measurement log per user
-- ============================================================

create table if not exists public.body_measures (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  -- Measurements (stored in metric; client converts to imperial)
  weight      numeric(7,2), -- kg
  body_fat    numeric(5,2), -- %
  chest       numeric(6,2), -- cm
  waist       numeric(6,2),
  hips        numeric(6,2),
  arms        numeric(6,2),
  thighs      numeric(6,2),
  calves      numeric(6,2),
  shoulders   numeric(6,2),
  neck        numeric(6,2),
  unit        text not null default 'metric' check (unit in ('metric', 'imperial')),
  note        text,
  -- Soft delete
  deleted_at  timestamptz,
  -- Sync
  local_id    text,
  sync_status sync_status not null default 'synced',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- TABLE: exercise_prs
-- Personal Records per exercise per user (1RM estimates)
-- ============================================================

create table if not exists public.exercise_prs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  exercise_id     text not null, -- catalog or custom exercise ID
  one_rm          numeric(8,2) not null,
  achieved_at     timestamptz not null,
  weight          numeric(8,2) not null,
  reps            integer not null,
  formula         text not null default 'epley',
  best_set_date   timestamptz,
  -- Soft delete
  deleted_at      timestamptz,
  -- Sync
  local_id        text,
  sync_status     sync_status not null default 'synced',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- One PR record per user per exercise
  unique (user_id, exercise_id)
);

-- ============================================================
-- TABLE: favorites
-- Exercise IDs favorited by users
-- ============================================================

create table if not exists public.favorites (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  exercise_id text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, exercise_id)
);

-- ============================================================
-- TABLE: saved_programs
-- Explore programs saved by users
-- ============================================================

create table if not exists public.saved_programs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  program_id  text not null, -- CMS program ID or UUID
  name        text not null,
  description text,
  image_url   text,
  source      text not null default 'explore',
  -- Full routine snapshot (offline-capable)
  routine_snapshot jsonb not null default '{}',
  saved_at    timestamptz not null default now(),
  unique (user_id, program_id)
);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger to all tables with updated_at
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'custom_exercises', 'routines',
    'workout_sessions', 'body_measures', 'exercise_prs'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.handle_updated_at()',
      t
    );
  end loop;
end;
$$;

-- ============================================================
-- TRIGGER: auto-create profile on user sign-up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
