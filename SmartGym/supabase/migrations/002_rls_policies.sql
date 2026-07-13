-- ============================================================
-- SmartGym — Supabase Migration 002: Row Level Security
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Enable RLS on all user-data tables
alter table public.profiles           enable row level security;
alter table public.custom_exercises   enable row level security;
alter table public.routines           enable row level security;
alter table public.routine_exercises  enable row level security;
alter table public.routine_days       enable row level security;
alter table public.routine_day_exercises enable row level security;
alter table public.workout_sessions   enable row level security;
alter table public.workout_exercise_logs enable row level security;
alter table public.workout_set_logs   enable row level security;
alter table public.body_measures      enable row level security;
alter table public.exercise_prs       enable row level security;
alter table public.favorites          enable row level security;
alter table public.saved_programs     enable row level security;

-- catalog_exercises is public read, admin write
alter table public.catalog_exercises  enable row level security;

-- ============================================================
-- catalog_exercises — PUBLIC READ
-- ============================================================

create policy "catalog_exercises: public read"
  on public.catalog_exercises for select
  using (is_active = true);

-- Only service role (admins) can write catalog exercises
-- (No insert/update/delete policy for authenticated users)

-- ============================================================
-- profiles
-- ============================================================

create policy "profiles: users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- custom_exercises
-- ============================================================

create policy "custom_exercises: users can read own"
  on public.custom_exercises for select
  using (auth.uid() = user_id);

create policy "custom_exercises: users can insert own"
  on public.custom_exercises for insert
  with check (auth.uid() = user_id);

create policy "custom_exercises: users can update own"
  on public.custom_exercises for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "custom_exercises: users can delete own"
  on public.custom_exercises for delete
  using (auth.uid() = user_id);

-- ============================================================
-- routines
-- ============================================================

create policy "routines: users can read own"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "routines: users can insert own"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "routines: users can update own"
  on public.routines for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "routines: users can delete own"
  on public.routines for delete
  using (auth.uid() = user_id);

-- ============================================================
-- routine_exercises (inherits access via routine ownership)
-- ============================================================

create policy "routine_exercises: users can read own routines"
  on public.routine_exercises for select
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "routine_exercises: users can insert to own routines"
  on public.routine_exercises for insert
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "routine_exercises: users can update own routines"
  on public.routine_exercises for update
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "routine_exercises: users can delete from own routines"
  on public.routine_exercises for delete
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

-- ============================================================
-- routine_days
-- ============================================================

create policy "routine_days: users can manage own"
  on public.routine_days for all
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

-- ============================================================
-- routine_day_exercises
-- ============================================================

create policy "routine_day_exercises: users can manage own"
  on public.routine_day_exercises for all
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

-- ============================================================
-- workout_sessions
-- ============================================================

create policy "workout_sessions: users can read own"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "workout_sessions: users can insert own"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "workout_sessions: users can update own"
  on public.workout_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workout_sessions: users can delete own"
  on public.workout_sessions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- workout_exercise_logs
-- ============================================================

create policy "workout_exercise_logs: users can manage own"
  on public.workout_exercise_logs for all
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- workout_set_logs
-- ============================================================

create policy "workout_set_logs: users can manage own"
  on public.workout_set_logs for all
  using (
    exists (
      select 1 from public.workout_exercise_logs el
      join public.workout_sessions s on s.id = el.session_id
      where el.id = exercise_log_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- body_measures
-- ============================================================

create policy "body_measures: users can read own"
  on public.body_measures for select
  using (auth.uid() = user_id);

create policy "body_measures: users can insert own"
  on public.body_measures for insert
  with check (auth.uid() = user_id);

create policy "body_measures: users can update own"
  on public.body_measures for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "body_measures: users can delete own"
  on public.body_measures for delete
  using (auth.uid() = user_id);

-- ============================================================
-- exercise_prs
-- ============================================================

create policy "exercise_prs: users can manage own"
  on public.exercise_prs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- favorites
-- ============================================================

create policy "favorites: users can manage own"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- saved_programs
-- ============================================================

create policy "saved_programs: users can manage own"
  on public.saved_programs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
