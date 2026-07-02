-- ============================================================
-- SmartGym — Auto-generated Seed SQL for catalog_exercises
-- Generated at: 2026-07-02T09:27:50.257Z
-- ============================================================

INSERT INTO public.catalog_exercises (
  id, slug, name, description, muscle_group, secondary_muscles,
  equipment, type, difficulty, instructions, tips, image_url, media,
  is_popular, is_active, cms_version, created_at, updated_at
) VALUES (
  '2ece1512-d973-5c0f-9e5f-c59067a3f3fc',
  'bench-press',
  'Bench Press',
  'Compound chest press for strength and hypertrophy.',
  'chest'::muscle_group,
  '{"shoulders","arms"}'::muscle_group[],
  'barbell'::equipment_type,
  'strength'::exercise_type,
  'intermediate'::exercise_difficulty,
  '{"Lie flat on bench","Grip bar slightly wider than shoulder-width","Lower bar to mid-chest with control","Press bar up"}',
  '{"Keep shoulder blades retracted","Control the descent"}',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
  '[{"url":"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80","type":"image"}]'::jsonb,
  true,
  true,
  '1.0.0',
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  muscle_group = EXCLUDED.muscle_group,
  secondary_muscles = EXCLUDED.secondary_muscles,
  equipment = EXCLUDED.equipment,
  type = EXCLUDED.type,
  difficulty = EXCLUDED.difficulty,
  instructions = EXCLUDED.instructions,
  tips = EXCLUDED.tips,
  image_url = EXCLUDED.image_url,
  media = EXCLUDED.media,
  is_popular = EXCLUDED.is_popular,
  updated_at = now();

INSERT INTO public.catalog_exercises (
  id, slug, name, description, muscle_group, secondary_muscles,
  equipment, type, difficulty, instructions, tips, image_url, media,
  is_popular, is_active, cms_version, created_at, updated_at
) VALUES (
  '57c51e30-b7b6-58d8-8972-92186efed7d9',
  'push-ups',
  'Push-Ups',
  'Classic bodyweight exercise for chest, shoulders and triceps.',
  'chest'::muscle_group,
  '{"shoulders","arms","core"}'::muscle_group[],
  'bodyweight'::equipment_type,
  'strength'::exercise_type,
  'beginner'::exercise_difficulty,
  '{"Start in plank position","Lower chest toward floor","Push back up","Keep core tight"}',
  '{"Keep body straight","Avoid flaring elbows too wide"}',
  'https://images.unsplash.com/photo-1598971639058-a7e83e5e9ee2?auto=format&fit=crop&w=800&q=80',
  '[{"url":"https://images.unsplash.com/photo-1598971639058-a7e83e5e9ee2?auto=format&fit=crop&w=800&q=80","type":"image"}]'::jsonb,
  true,
  true,
  '1.0.0',
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  muscle_group = EXCLUDED.muscle_group,
  secondary_muscles = EXCLUDED.secondary_muscles,
  equipment = EXCLUDED.equipment,
  type = EXCLUDED.type,
  difficulty = EXCLUDED.difficulty,
  instructions = EXCLUDED.instructions,
  tips = EXCLUDED.tips,
  image_url = EXCLUDED.image_url,
  media = EXCLUDED.media,
  is_popular = EXCLUDED.is_popular,
  updated_at = now();

INSERT INTO public.catalog_exercises (
  id, slug, name, description, muscle_group, secondary_muscles,
  equipment, type, difficulty, instructions, tips, image_url, media,
  is_popular, is_active, cms_version, created_at, updated_at
) VALUES (
  '43564d3c-da15-5851-beed-443b481dee65',
  'deadlift',
  'Deadlift',
  'Full-body hinge movement for posterior chain strength.',
  'back'::muscle_group,
  '{"legs","glutes","core"}'::muscle_group[],
  'barbell'::equipment_type,
  'strength'::exercise_type,
  'advanced'::exercise_difficulty,
  '{"Stand with bar over mid-foot","Grip bar outside knees","Keep chest up and back flat","Drive through floor","Lock out at top"}',
  '{"Keep bar close","Brace before pulling"}',
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
  '[{"url":"https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80","type":"image"}]'::jsonb,
  true,
  true,
  '1.0.0',
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  muscle_group = EXCLUDED.muscle_group,
  secondary_muscles = EXCLUDED.secondary_muscles,
  equipment = EXCLUDED.equipment,
  type = EXCLUDED.type,
  difficulty = EXCLUDED.difficulty,
  instructions = EXCLUDED.instructions,
  tips = EXCLUDED.tips,
  image_url = EXCLUDED.image_url,
  media = EXCLUDED.media,
  is_popular = EXCLUDED.is_popular,
  updated_at = now();

INSERT INTO public.catalog_exercises (
  id, slug, name, description, muscle_group, secondary_muscles,
  equipment, type, difficulty, instructions, tips, image_url, media,
  is_popular, is_active, cms_version, created_at, updated_at
) VALUES (
  '5cf7ff79-1d69-5ee5-ab52-561e6f23cc8a',
  'squat',
  'Back Squat',
  'Lower-body compound lift for quads, glutes and strength.',
  'legs'::muscle_group,
  '{"glutes","core"}'::muscle_group[],
  'barbell'::equipment_type,
  'strength'::exercise_type,
  'advanced'::exercise_difficulty,
  '{"Bar on upper traps","Break hips and knees together","Descend to parallel","Drive through heels"}',
  '{"Knees track over toes","Keep chest up"}',
  'https://images.unsplash.com/photo-1567598508481-65985588e295?auto=format&fit=crop&w=800&q=80',
  '[{"url":"https://images.unsplash.com/photo-1567598508481-65985588e295?auto=format&fit=crop&w=800&q=80","type":"image"}]'::jsonb,
  true,
  true,
  '1.0.0',
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  muscle_group = EXCLUDED.muscle_group,
  secondary_muscles = EXCLUDED.secondary_muscles,
  equipment = EXCLUDED.equipment,
  type = EXCLUDED.type,
  difficulty = EXCLUDED.difficulty,
  instructions = EXCLUDED.instructions,
  tips = EXCLUDED.tips,
  image_url = EXCLUDED.image_url,
  media = EXCLUDED.media,
  is_popular = EXCLUDED.is_popular,
  updated_at = now();

INSERT INTO public.catalog_exercises (
  id, slug, name, description, muscle_group, secondary_muscles,
  equipment, type, difficulty, instructions, tips, image_url, media,
  is_popular, is_active, cms_version, created_at, updated_at
) VALUES (
  '9a894ed8-f3ea-5fa2-ad96-0999c4d3c16f',
  'pull-ups',
  'Pull-Ups',
  'Bodyweight vertical pull for lats and upper back.',
  'back'::muscle_group,
  '{"arms"}'::muscle_group[],
  'bodyweight'::equipment_type,
  'strength'::exercise_type,
  'intermediate'::exercise_difficulty,
  '{"Hang from bar","Pull until chin clears bar","Lower with control"}',
  '{"Use full hang","Lead with chest"}',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80',
  '[{"url":"https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80","type":"image"}]'::jsonb,
  true,
  true,
  '1.0.0',
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  muscle_group = EXCLUDED.muscle_group,
  secondary_muscles = EXCLUDED.secondary_muscles,
  equipment = EXCLUDED.equipment,
  type = EXCLUDED.type,
  difficulty = EXCLUDED.difficulty,
  instructions = EXCLUDED.instructions,
  tips = EXCLUDED.tips,
  image_url = EXCLUDED.image_url,
  media = EXCLUDED.media,
  is_popular = EXCLUDED.is_popular,
  updated_at = now();

INSERT INTO public.catalog_exercises (
  id, slug, name, description, muscle_group, secondary_muscles,
  equipment, type, difficulty, instructions, tips, image_url, media,
  is_popular, is_active, cms_version, created_at, updated_at
) VALUES (
  '11b6815e-debc-5300-a30d-4b7e363a7b29',
  'plank',
  'Plank',
  'Isometric core stability exercise.',
  'core'::muscle_group,
  '{}'::muscle_group[],
  'bodyweight'::equipment_type,
  'strength'::exercise_type,
  'beginner'::exercise_difficulty,
  '{"Forearms on ground","Body straight","Hold position"}',
  '{"Do not let hips sag","Breathe steadily"}',
  'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=800&q=80',
  '[{"url":"https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=800&q=80","type":"image"}]'::jsonb,
  true,
  true,
  '1.0.0',
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  muscle_group = EXCLUDED.muscle_group,
  secondary_muscles = EXCLUDED.secondary_muscles,
  equipment = EXCLUDED.equipment,
  type = EXCLUDED.type,
  difficulty = EXCLUDED.difficulty,
  instructions = EXCLUDED.instructions,
  tips = EXCLUDED.tips,
  image_url = EXCLUDED.image_url,
  media = EXCLUDED.media,
  is_popular = EXCLUDED.is_popular,
  updated_at = now();

