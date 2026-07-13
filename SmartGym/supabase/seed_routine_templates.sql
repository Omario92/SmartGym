-- ============================================================
-- SmartGym — Seed: routine_templates + routine_template_exercises
-- Run AFTER 004_routine_templates.sql (and after seed_catalog.sql so the
-- referenced exercise slugs exist in catalog_exercises).
--
-- Idempotent:
--   • templates            → ON CONFLICT (slug) DO UPDATE
--   • template exercises   → ON CONFLICT (template_id, display_order) DO UPDATE
-- Re-run any time to update programs. exercise_id uses catalog_exercises.slug.
-- ============================================================

-- ─── Template 1: Full Body Blast ──────────────────────────────
insert into public.routine_templates
  (slug, name, description, color, category, goal, difficulty,
   estimated_duration, estimated_calories, emoji, is_featured, is_active, sort_order, cms_version)
values
  ('full-body-blast',
   'Full Body Blast',
   'Target every major muscle group with compound movements for maximum results.',
   '#4DA6FF', 'intermediate', 'hypertrophy', 'intermediate',
   45, 380, '💪', true, true, 10, '1.0.0')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  category = excluded.category,
  goal = excluded.goal,
  difficulty = excluded.difficulty,
  estimated_duration = excluded.estimated_duration,
  estimated_calories = excluded.estimated_calories,
  emoji = excluded.emoji,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.routine_template_exercises
  (template_id, exercise_id, exercise_name, display_order, sets, reps, weight, rest_seconds)
select t.id, v.exercise_id, v.exercise_name, v.display_order, v.sets, v.reps, v.weight::numeric, v.rest_seconds
from (values
  ('squat',       'Back Squat',   0, 4,  8, 60, 90),
  ('deadlift',    'Deadlift',     1, 3,  6, 80, 120),
  ('bench-press', 'Bench Press',  2, 4,  8, 60, 90),
  ('pull-ups',    'Pull-Ups',     3, 3,  8, null, 90),
  ('push-ups',    'Push-Ups',     4, 3, 15, null, 60),
  ('plank',       'Plank',        5, 3,  1, null, 45)
) as v(exercise_id, exercise_name, display_order, sets, reps, weight, rest_seconds)
cross join (select id from public.routine_templates where slug = 'full-body-blast') t
on conflict (template_id, display_order) do update set
  exercise_id = excluded.exercise_id,
  exercise_name = excluded.exercise_name,
  sets = excluded.sets,
  reps = excluded.reps,
  weight = excluded.weight,
  rest_seconds = excluded.rest_seconds;

-- ─── Template 2: Strength Builder ─────────────────────────────
insert into public.routine_templates
  (slug, name, description, color, category, goal, difficulty,
   estimated_duration, estimated_calories, emoji, is_featured, is_active, sort_order, cms_version)
values
  ('strength-builder',
   'Strength Builder',
   'Build raw strength with powerlifting-inspired progressive overload programming.',
   '#FFB547', 'intermediate', 'strength', 'intermediate',
   60, 290, '🏋️', true, true, 20, '1.0.0')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  category = excluded.category,
  goal = excluded.goal,
  difficulty = excluded.difficulty,
  estimated_duration = excluded.estimated_duration,
  estimated_calories = excluded.estimated_calories,
  emoji = excluded.emoji,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.routine_template_exercises
  (template_id, exercise_id, exercise_name, display_order, sets, reps, weight, rest_seconds)
select t.id, v.exercise_id, v.exercise_name, v.display_order, v.sets, v.reps, v.weight::numeric, v.rest_seconds
from (values
  ('squat',       'Back Squat',   0, 5, 5, 80, 180),
  ('deadlift',    'Deadlift',     1, 4, 4, 100, 180),
  ('bench-press', 'Bench Press',  2, 5, 5, 70, 150),
  ('pull-ups',    'Weighted Pull-Ups', 3, 4, 6, null, 120)
) as v(exercise_id, exercise_name, display_order, sets, reps, weight, rest_seconds)
cross join (select id from public.routine_templates where slug = 'strength-builder') t
on conflict (template_id, display_order) do update set
  exercise_id = excluded.exercise_id,
  exercise_name = excluded.exercise_name,
  sets = excluded.sets,
  reps = excluded.reps,
  weight = excluded.weight,
  rest_seconds = excluded.rest_seconds;

-- ─── Template 3: 7 Minute Workout ─────────────────────────────
insert into public.routine_templates
  (slug, name, description, color, category, goal, difficulty,
   estimated_duration, estimated_calories, emoji, is_featured, is_active, sort_order, cms_version)
values
  ('7-minute-workout',
   '7 Minute Workout',
   'The scientifically proven 7-minute high-intensity circuit training workout.',
   '#00FF9D', 'beginner', 'endurance', 'beginner',
   7, 120, '⚡', true, true, 5, '1.0.0')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  category = excluded.category,
  goal = excluded.goal,
  difficulty = excluded.difficulty,
  estimated_duration = excluded.estimated_duration,
  estimated_calories = excluded.estimated_calories,
  emoji = excluded.emoji,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.routine_template_exercises
  (template_id, exercise_id, exercise_name, display_order, sets, reps, weight, rest_seconds)
select t.id, v.exercise_id, v.exercise_name, v.display_order, v.sets, v.reps, v.weight::numeric, v.rest_seconds
from (values
  ('jumping-jacks',     'Jumping Jacks',              0, 1, 30, null, 20),
  ('push-ups',          'Push-Ups',                   1, 1, 15, null, 20),
  ('squat',             'Squats',                     2, 1, 20, null, 20),
  ('crunches',          'Crunches',                   3, 1, 20, null, 20),
  ('mountain-climbers', 'Mountain Climbers',          4, 1, 30, null, 20),
  ('plank',             'Plank (30s)',                5, 1, 1,  null, 20),
  ('lunges',            'Lunges',                     6, 1, 12, null, 20),
  ('burpees',           'Burpees',                    7, 1, 10, null, 20),
  ('push-ups',          'Wide Push-Ups',              8, 1, 12, null, 20),
  ('leg-raises',        'Leg Raises',                 9, 1, 15, null, 20),
  ('mountain-climbers', 'Mountain Climbers (fast)',  10, 1, 20, null, 20),
  ('jumping-jacks',     'Jumping Jacks (cooldown)',  11, 1, 20, null, 0)
) as v(exercise_id, exercise_name, display_order, sets, reps, weight, rest_seconds)
cross join (select id from public.routine_templates where slug = '7-minute-workout') t
on conflict (template_id, display_order) do update set
  exercise_id = excluded.exercise_id,
  exercise_name = excluded.exercise_name,
  sets = excluded.sets,
  reps = excluded.reps,
  weight = excluded.weight,
  rest_seconds = excluded.rest_seconds;

-- ─── Template 4: HIIT Cardio ──────────────────────────────────
insert into public.routine_templates
  (slug, name, description, color, category, goal, difficulty,
   estimated_duration, estimated_calories, emoji, is_featured, is_active, sort_order, cms_version)
values
  ('hiit-cardio',
   'HIIT Cardio',
   'High-intensity interval training for maximum fat burn and cardiovascular fitness.',
   '#FF6B6B', 'advanced', 'fat_loss', 'advanced',
   30, 450, '🔥', true, true, 15, '1.0.0')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  category = excluded.category,
  goal = excluded.goal,
  difficulty = excluded.difficulty,
  estimated_duration = excluded.estimated_duration,
  estimated_calories = excluded.estimated_calories,
  emoji = excluded.emoji,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.routine_template_exercises
  (template_id, exercise_id, exercise_name, display_order, sets, reps, weight, rest_seconds)
select t.id, v.exercise_id, v.exercise_name, v.display_order, v.sets, v.reps, v.weight::numeric, v.rest_seconds
from (values
  ('burpees',           'Burpees',              0, 4, 15, null, 30),
  ('mountain-climbers', 'Mountain Climbers',    1, 4, 30, null, 30),
  ('jumping-jacks',     'Jumping Jacks',        2, 4, 40, null, 30),
  ('squat',             'Jump Squats',          3, 4, 15, null, 30),
  ('push-ups',          'Explosive Push-Ups',   4, 4, 12, null, 30),
  ('lunges',            'Jump Lunges',          5, 4, 16, null, 30),
  ('leg-raises',        'Leg Raises',           6, 3, 15, null, 45),
  ('crunches',          'Bicycle Crunches',     7, 3, 20, null, 45),
  ('plank',             'Plank',                8, 3, 1,  null, 45),
  ('burpees',           'Burpees (finisher)',   9, 2, 10, null, 60)
) as v(exercise_id, exercise_name, display_order, sets, reps, weight, rest_seconds)
cross join (select id from public.routine_templates where slug = 'hiit-cardio') t
on conflict (template_id, display_order) do update set
  exercise_id = excluded.exercise_id,
  exercise_name = excluded.exercise_name,
  sets = excluded.sets,
  reps = excluded.reps,
  weight = excluded.weight,
  rest_seconds = excluded.rest_seconds;

-- Note: the 7-min / HIIT exercises (jumping-jacks, burpees, etc.) are not yet in
-- catalog_exercises — that's fine: exercise_id is free text and exercise_name is
-- denormalized, so workouts display correctly. Seed matching catalog rows later
-- for images/PR linkage (use the same slugs).

-- To add more Explore programs: copy a block above, change the slug + values.
-- To retire one without deleting history: set is_active = false via upsert.
