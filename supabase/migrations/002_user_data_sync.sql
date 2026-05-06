-- ============================================================
-- SmartGym v2.1 — User Data Sync Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Routines
CREATE TABLE IF NOT EXISTS public.routines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id        TEXT,
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT,
  category        TEXT,
  estimated_duration INTEGER,
  last_performed  TIMESTAMPTZ,
  sort_order      INTEGER DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- 2. Routine Exercises
CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id        UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id       TEXT NOT NULL,
  cloud_exercise_id UUID NULL REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name     TEXT NOT NULL,
  sets              INTEGER NOT NULL DEFAULT 3,
  reps              INTEGER,
  weight            NUMERIC,
  rest_seconds      INTEGER,
  note              TEXT,
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- 3. Workout Sessions
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id          TEXT,
  routine_id        UUID NULL REFERENCES public.routines(id) ON DELETE SET NULL,
  local_routine_id  TEXT,
  routine_name      TEXT NOT NULL,
  started_at        TIMESTAMPTZ NOT NULL,
  finished_at       TIMESTAMPTZ,
  duration          INTEGER,
  total_volume      NUMERIC,
  total_sets        INTEGER,
  note              TEXT,
  source            TEXT DEFAULT 'smartgym',
  health_sync_status TEXT DEFAULT 'not_synced',
  health_platform   TEXT NULL,
  health_record_id  TEXT NULL,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- 4. Workout Exercise Logs
CREATE TABLE IF NOT EXISTS public.workout_exercise_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id       TEXT NOT NULL,
  cloud_exercise_id UUID NULL REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name     TEXT NOT NULL,
  rest_seconds      INTEGER,
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 5. Workout Set Logs
CREATE TABLE IF NOT EXISTS public.workout_set_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_log_id   UUID NOT NULL REFERENCES public.workout_exercise_logs(id) ON DELETE CASCADE,
  session_id        UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight            NUMERIC DEFAULT 0,
  reps              INTEGER DEFAULT 0,
  completed         BOOLEAN DEFAULT false,
  note              TEXT,
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 6. Body Measures
CREATE TABLE IF NOT EXISTS public.body_measures (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id          TEXT,
  date              DATE NOT NULL,
  weight            NUMERIC,
  body_fat          NUMERIC,
  chest             NUMERIC,
  waist             NUMERIC,
  hips              NUMERIC,
  arms              NUMERIC,
  thighs            NUMERIC,
  calves            NUMERIC,
  shoulders         NUMERIC,
  neck              NUMERIC,
  unit              TEXT NOT NULL DEFAULT 'metric',
  source            TEXT DEFAULT 'smartgym',
  health_sync_status TEXT DEFAULT 'not_synced',
  health_record_id  TEXT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- 7. Exercise PRs
CREATE TABLE IF NOT EXISTS public.exercise_prs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id       TEXT NOT NULL,
  cloud_exercise_id UUID NULL REFERENCES public.exercises(id) ON DELETE SET NULL,
  one_rm            NUMERIC NOT NULL,
  date              TIMESTAMPTZ NOT NULL,
  weight            NUMERIC NOT NULL,
  reps              INTEGER NOT NULL,
  formula           TEXT NOT NULL,
  best_set_date     TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_prs_user_ex ON public.exercise_prs (user_id, exercise_id) WHERE deleted_at IS NULL;

-- 8. User Favorite Exercises
CREATE TABLE IF NOT EXISTS public.user_favorite_exercises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id       TEXT NOT NULL,
  cloud_exercise_id UUID NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_fav_ex_user_ex ON public.user_favorite_exercises (user_id, exercise_id) WHERE deleted_at IS NULL;

-- 9. Sync State
CREATE TABLE IF NOT EXISTS public.sync_state (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity            TEXT NOT NULL,
  last_pulled_at    TIMESTAMPTZ,
  last_pushed_at    TIMESTAMPTZ,
  cursor            TEXT,
  metadata          JSONB DEFAULT '{}',
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_state_user_entity ON public.sync_state (user_id, entity);

-- Triggers
CREATE TRIGGER routines_updated_at BEFORE UPDATE ON public.routines FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER routine_exercises_updated_at BEFORE UPDATE ON public.routine_exercises FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER workout_sessions_updated_at BEFORE UPDATE ON public.workout_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER workout_exercise_logs_updated_at BEFORE UPDATE ON public.workout_exercise_logs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER workout_set_logs_updated_at BEFORE UPDATE ON public.workout_set_logs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER body_measures_updated_at BEFORE UPDATE ON public.body_measures FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER exercise_prs_updated_at BEFORE UPDATE ON public.exercise_prs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER sync_state_updated_at BEFORE UPDATE ON public.sync_state FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_prs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

-- Helper to create RLS policies for a given table
CREATE OR REPLACE PROCEDURE create_user_rls(table_name text)
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('
    CREATE POLICY "user_select" ON public.%I FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "user_insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "user_update" ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "user_delete" ON public.%I FOR DELETE USING (auth.uid() = user_id);
  ', table_name, table_name, table_name, table_name);
END;
$$;

CALL create_user_rls('routines');
CALL create_user_rls('routine_exercises');
CALL create_user_rls('workout_sessions');
CALL create_user_rls('workout_exercise_logs');
CALL create_user_rls('workout_set_logs');
CALL create_user_rls('body_measures');
CALL create_user_rls('exercise_prs');
CALL create_user_rls('user_favorite_exercises');
CALL create_user_rls('sync_state');

DROP PROCEDURE create_user_rls;
