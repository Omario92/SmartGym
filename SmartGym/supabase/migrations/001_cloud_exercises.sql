-- ============================================================
-- SmartGym v2.1 — Supabase Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Enums
-- ────────────────────────────────────────────────────────────

CREATE TYPE public.muscle_group AS ENUM (
  'chest', 'back', 'shoulders', 'arms',
  'legs', 'core', 'glutes', 'cardio', 'full_body'
);

CREATE TYPE public.equipment_type AS ENUM (
  'barbell', 'dumbbell', 'machine', 'cable',
  'bodyweight', 'kettlebell', 'resistance_band',
  'smith_machine', 'other'
);

CREATE TYPE public.exercise_type AS ENUM (
  'strength', 'cardio', 'flexibility'
);

CREATE TYPE public.exercise_difficulty AS ENUM (
  'beginner', 'intermediate', 'advanced'
);

CREATE TYPE public.exercise_visibility AS ENUM (
  'public', 'private'
);

-- 2. Main Table
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exercises (
  id              UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT                       UNIQUE,                    -- optional human-readable slug
  name            TEXT                       NOT NULL,
  muscle_group    public.muscle_group        NOT NULL,
  secondary_muscles public.muscle_group[]    DEFAULT '{}',
  equipment       public.equipment_type      NOT NULL,
  type            public.exercise_type       NOT NULL DEFAULT 'strength',
  description     TEXT,
  instructions    TEXT[]                     DEFAULT '{}',
  tips            TEXT[]                     DEFAULT '{}',
  difficulty      public.exercise_difficulty NOT NULL DEFAULT 'intermediate',
  is_public       BOOLEAN                    NOT NULL DEFAULT false,    -- true = everyone can see
  created_by      UUID                       REFERENCES auth.users(id) ON DELETE SET NULL,
  media           JSONB[]                    DEFAULT '{}',              -- [{url, type, thumbnailUrl}]
  notes           TEXT,                                                 -- personal coaching notes
  is_archived     BOOLEAN                    NOT NULL DEFAULT false,    -- soft delete
  created_at      TIMESTAMPTZ                NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ                NOT NULL DEFAULT now()
);

-- 3. Updated_at Trigger
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Indexes
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_exercises_created_by   ON public.exercises (created_by);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON public.exercises (muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment    ON public.exercises (equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty   ON public.exercises (difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_is_public    ON public.exercises (is_public);
CREATE INDEX IF NOT EXISTS idx_exercises_is_archived  ON public.exercises (is_archived);
-- Full-text search on name
CREATE INDEX IF NOT EXISTS idx_exercises_name_fts
  ON public.exercises USING GIN (to_tsvector('english', name));

-- 5. Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read public, non-archived exercises
CREATE POLICY "public_exercises_select"
  ON public.exercises FOR SELECT
  USING (is_public = true AND is_archived = false);

-- Authenticated users can read their own exercises (including private)
CREATE POLICY "own_exercises_select"
  ON public.exercises FOR SELECT
  USING (auth.uid() = created_by AND is_archived = false);

-- Authenticated users can insert their own exercises
CREATE POLICY "own_exercises_insert"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Authenticated users can update their own exercises only
CREATE POLICY "own_exercises_update"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Authenticated users can delete their own exercises (hard delete, but prefer soft delete via is_archived)
CREATE POLICY "own_exercises_delete"
  ON public.exercises FOR DELETE
  USING (auth.uid() = created_by);

-- 6. Storage Bucket
-- ────────────────────────────────────────────────────────────
-- Run these separately in SQL Editor:

INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-media', 'exercise-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-media');

CREATE POLICY "storage_user_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exercise-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_user_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'exercise-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exercise-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
