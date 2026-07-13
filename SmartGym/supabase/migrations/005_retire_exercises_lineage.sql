-- ============================================================
-- SmartGym — Migration 005 (DRAFT / NO-OP): Retire the public.exercises lineage
--
-- ⚠️  STATUS: NOT SAFE TO RUN THE DESTRUCTIVE PART YET.
-- `public.exercises` is LIVE — lib/exerciseService.ts queries it in 7 places
-- (cloud custom exercises: the "My Exercises" screen and exercise/[id] view/edit
-- via useExerciseDetail / useUpdateExercise / useArchiveExercise). Dropping it
-- now breaks those screens.
--
-- Applying THIS FILE as-is is a no-op (it only raises a NOTICE). The destructive
-- statements are commented out below behind a prerequisite checklist.
--
-- WHY THIS EXISTS: the schema has TWO overlapping custom-exercise models:
--   • public.custom_exercises  (001_initial_schema)  → used by syncApi.ts (offline/store sync)
--   • public.exercises         (001_cloud_exercises) → used by exerciseService.ts (react-query cloud CRUD)
-- Consolidate onto custom_exercises, then retire public.exercises.
--
-- ⚠️  Also note: migrations 001_cloud_exercises / 002_user_data_sync /
-- 003_fix_exercise_rls form a SEPARATE lineage that re-declares the same enums as
-- 001_initial_schema. Only ONE lineage can be applied to a given database. Decide
-- which is deployed before running any consolidation.
--
-- PREREQUISITES (do in order; verify each before the next):
--   1. Refactor lib/exerciseService.ts to read/write `custom_exercises` instead of
--      `exercises`. Column mapping:
--        exercises.created_by   → custom_exercises.user_id
--        exercises.is_public    → (drop; custom exercises are private) — or move
--                                  any truly public ones into catalog_exercises
--        exercises.media JSONB[] → custom_exercises.media jsonb  (array-of-jsonb → jsonb)
--        exercises.is_archived  → custom_exercises.is_archived
--   2. Update exercise/[id].tsx, exercise/my-exercises.tsx, exercise/create.tsx.
--   3. Run STEP A (data migration) on staging; verify row counts match.
--   4. Ship the app change; confirm cloud custom exercises work end-to-end.
--   5. ONLY THEN uncomment STEP B and apply.
-- ============================================================

-- Safety guard: this migration performs NO changes until you uncomment STEP B.
do $$
begin
  raise notice
    'Migration 005 is a DRAFT (no-op). public.exercises is still in use by exerciseService.ts. '
    'Complete the prerequisites, then uncomment STEP A/STEP B.';
end $$;

-- ─── STEP A: data migration (review, then run manually) ───────────────────────
-- Copies user-owned cloud exercises into custom_exercises. Skips public/seed rows
-- (created_by IS NULL) and rows whose owner has no profile (FK safety).
/*
insert into public.custom_exercises
  (id, user_id, name, description, muscle_group, secondary_muscles, equipment, type,
   difficulty, instructions, tips, media, notes, is_archived, sync_status, created_at, updated_at)
select
  e.id, e.created_by, e.name, e.description, e.muscle_group, e.secondary_muscles,
  e.equipment, e.type, e.difficulty, e.instructions, e.tips,
  to_jsonb(e.media), e.notes, e.is_archived, 'synced', e.created_at, e.updated_at
from public.exercises e
where e.created_by is not null
  and exists (select 1 from public.profiles p where p.id = e.created_by)
on conflict (id) do nothing;

-- Sanity check (should return 0 un-migrated user rows):
-- select count(*) from public.exercises e
--   where e.created_by is not null
--     and not exists (select 1 from public.custom_exercises c where c.id = e.id);
*/

-- ─── STEP B: DESTRUCTIVE — only after prerequisites + STEP A verified ──────────
/*
drop table if exists public.exercises cascade;   -- also drops its RLS policies
drop type  if exists public.exercise_visibility;

-- ⚠️  DO NOT drop the 'exercise-media' storage bucket or its policies — they are
--     shared media storage used by custom_exercises and catalog media too.
*/
