-- ============================================================
-- SmartGym — Supabase Migration 003: Indexes
-- Run AFTER 001 and 002
-- ============================================================

-- ── catalog_exercises ─────────────────────────────────────────────────────────

create index if not exists idx_catalog_exercises_muscle_group
  on public.catalog_exercises (muscle_group);

create index if not exists idx_catalog_exercises_equipment
  on public.catalog_exercises (equipment);

create index if not exists idx_catalog_exercises_difficulty
  on public.catalog_exercises (difficulty);

create index if not exists idx_catalog_exercises_is_popular
  on public.catalog_exercises (is_popular) where is_popular = true;

-- Full-text search on exercise name
create index if not exists idx_catalog_exercises_name_trgm
  on public.catalog_exercises using gin (name gin_trgm_ops);

-- ── custom_exercises ──────────────────────────────────────────────────────────

create index if not exists idx_custom_exercises_user_id
  on public.custom_exercises (user_id);

create index if not exists idx_custom_exercises_user_not_deleted
  on public.custom_exercises (user_id) where deleted_at is null;

-- ── routines ──────────────────────────────────────────────────────────────────

create index if not exists idx_routines_user_id
  on public.routines (user_id);

create index if not exists idx_routines_user_not_deleted
  on public.routines (user_id) where deleted_at is null;

create index if not exists idx_routines_user_updated
  on public.routines (user_id, updated_at desc);

-- ── routine_exercises ─────────────────────────────────────────────────────────

create index if not exists idx_routine_exercises_routine_id
  on public.routine_exercises (routine_id, sort_order);

create index if not exists idx_routine_exercises_exercise_id
  on public.routine_exercises (exercise_id);

-- ── routine_days ─────────────────────────────────────────────────────────────

create index if not exists idx_routine_days_routine_id
  on public.routine_days (routine_id, day_order);

-- ── routine_day_exercises ────────────────────────────────────────────────────

create index if not exists idx_routine_day_exercises_day_id
  on public.routine_day_exercises (day_id, display_order);

-- ── workout_sessions ─────────────────────────────────────────────────────────

create index if not exists idx_workout_sessions_user_id
  on public.workout_sessions (user_id);

-- Most common query: user's sessions sorted newest first
create index if not exists idx_workout_sessions_user_started
  on public.workout_sessions (user_id, started_at desc) where deleted_at is null;


-- ── workout_exercise_logs ────────────────────────────────────────────────────

create index if not exists idx_workout_exercise_logs_session_id
  on public.workout_exercise_logs (session_id, sort_order);

create index if not exists idx_workout_exercise_logs_exercise_id
  on public.workout_exercise_logs (exercise_id);

-- ── workout_set_logs ─────────────────────────────────────────────────────────

create index if not exists idx_workout_set_logs_exercise_log_id
  on public.workout_set_logs (exercise_log_id, sort_order);

-- ── body_measures ────────────────────────────────────────────────────────────

create index if not exists idx_body_measures_user_date
  on public.body_measures (user_id, date desc) where deleted_at is null;

-- ── exercise_prs ─────────────────────────────────────────────────────────────

create index if not exists idx_exercise_prs_user_exercise
  on public.exercise_prs (user_id, exercise_id);

-- ── favorites ────────────────────────────────────────────────────────────────

create index if not exists idx_favorites_user_id
  on public.favorites (user_id);

-- ── saved_programs ────────────────────────────────────────────────────────────

create index if not exists idx_saved_programs_user_id
  on public.saved_programs (user_id, saved_at desc);

-- ============================================================
-- Storage bucket setup
-- Run in Supabase Dashboard → Storage
-- ============================================================

-- NOTE: The following must be run via Supabase Storage UI or Management API,
-- not via SQL editor. This is documentation only:
--
-- Bucket: exercise-media
--   - Public: true (CDN served)
--   - File size limit: 50MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif, video/mp4
--   - Folder structure:
--       exercise-media/catalog/{exercise_id}/{filename}   -- admin uploaded
--       exercise-media/custom/{user_id}/{exercise_id}/{filename} -- user uploaded
--
-- Bucket: avatars
--   - Public: true
--   - File size limit: 5MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp
