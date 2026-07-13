-- Fix for "Could not delete exercise. new row violates row-level security policy"
-- This happens because the SELECT policy prevented the owner from viewing the row 
-- after it was marked as is_archived = true.

-- 1. Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "own_exercises_select" ON public.exercises;

-- 2. Recreate it WITHOUT the is_archived = false restriction for the owner
CREATE POLICY "own_exercises_select"
  ON public.exercises FOR SELECT
  USING (auth.uid() = created_by);
