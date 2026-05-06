/**
 * Exercise library — 40+ exercises covering all muscle groups
 * v1.5: Added image, gif, and CustomExercise support
 */

import { getExerciseImage } from './exerciseImages';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'glutes'
  | 'cardio'
  | 'full_body';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance_band'
  | 'smith_machine'
  | 'other';

export type ExerciseType = 'strength' | 'cardio' | 'flexibility';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  type: ExerciseType;
  description: string;
  instructions: string[];
  tips: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPopular?: boolean;
  /** High-quality 16:9 image URL — populated automatically from exerciseImages.ts */
  image: string;
  /** Optional animated GIF for live workout demo */
  gif?: string;
}

/** Internal raw type used only in the EXERCISES literal array (image auto-populated below) */
type RawExercise = Omit<Exercise, 'image'> & { image?: string };

/** A user-created exercise extending the base Exercise type */
export interface CustomExercise extends Exercise {
  isCustom: true;
  createdAt: string;
  userId?: string;
  /** Personal notes / coaching tips */
  notes?: string;
  /** Whether the image was uploaded locally (file URI vs remote URL) */
  imageIsLocal?: boolean;
  /** True when this exercise originated from Supabase cloud (not purely local) */
  isCloud?: boolean;
  // Sync metadata
  cloudId?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  syncStatus?: 'local' | 'synced' | 'dirty' | 'deleted' | 'conflict';
}

const _EXERCISES: RawExercise[] = [
  {
    id: "bench_press",
    name: "Bench Press",
    muscleGroup: "chest",
    secondaryMuscles: [
      "shoulders",
      "arms"
    ],
    equipment: "barbell",
    type: "strength",
    description: "Compound chest press for strength and hypertrophy.",
    instructions: [
      "Lie flat on bench",
      "Grip bar slightly wider than shoulder-width",
      "Lower bar to mid-chest with control",
      "Press bar up"
    ],
    tips: [
      "Keep shoulder blades retracted",
      "Control the descent"
    ],
    difficulty: "intermediate",
    isPopular: true,
    image: "https://example.com/exercises/bench_press.jpg"
  },
  {
    id: "push_ups",
    name: "Push-Ups",
    muscleGroup: "chest",
    secondaryMuscles: [
      "shoulders",
      "arms",
      "core"
    ],
    equipment: "bodyweight",
    type: "strength",
    description: "Classic bodyweight exercise for chest, shoulders and triceps.",
    instructions: [
      "Start in plank position",
      "Lower chest toward floor",
      "Push back up",
      "Keep core tight"
    ],
    tips: [
      "Keep body straight",
      "Avoid flaring elbows too wide"
    ],
    difficulty: "beginner",
    isPopular: true,
    image: "https://example.com/exercises/push_ups.jpg"
  },
  {
    id: "deadlift",
    name: "Deadlift",
    muscleGroup: "back",
    secondaryMuscles: [
      "legs",
      "glutes",
      "core"
    ],
    equipment: "barbell",
    type: "strength",
    description: "Full-body hinge movement for posterior chain strength.",
    instructions: [
      "Stand with bar over mid-foot",
      "Grip bar outside knees",
      "Keep chest up and back flat",
      "Drive through floor",
      "Lock out at top"
    ],
    tips: [
      "Keep bar close",
      "Brace before pulling"
    ],
    difficulty: "advanced",
    isPopular: true,
    image: "https://example.com/exercises/deadlift.jpg"
  },
  {
    id: "squat",
    name: "Back Squat",
    muscleGroup: "legs",
    secondaryMuscles: [
      "glutes",
      "core"
    ],
    equipment: "barbell",
    type: "strength",
    description: "Lower-body compound lift for quads, glutes and strength.",
    instructions: [
      "Bar on upper traps",
      "Break hips and knees together",
      "Descend to parallel",
      "Drive through heels"
    ],
    tips: [
      "Knees track over toes",
      "Keep chest up"
    ],
    difficulty: "advanced",
    isPopular: true,
    image: "https://example.com/exercises/squat.jpg"
  },
  {
    id: "pull_ups",
    name: "Pull-Ups",
    muscleGroup: "back",
    secondaryMuscles: [
      "arms"
    ],
    equipment: "bodyweight",
    type: "strength",
    description: "Bodyweight vertical pull for lats and upper back.",
    instructions: [
      "Hang from bar",
      "Pull until chin clears bar",
      "Lower with control"
    ],
    tips: [
      "Use full hang",
      "Lead with chest"
    ],
    difficulty: "intermediate",
    isPopular: true,
    image: "https://example.com/exercises/pull_ups.jpg"
  },
  {
    id: "plank",
    name: "Plank",
    muscleGroup: "core",
    equipment: "bodyweight",
    type: "strength",
    description: "Isometric core stability exercise.",
    instructions: [
      "Forearms on ground",
      "Body straight",
      "Hold position"
    ],
    tips: [
      "Do not let hips sag",
      "Breathe steadily"
    ],
    difficulty: "beginner",
    isPopular: true,
    image: "https://example.com/exercises/plank.jpg"
  }
];

export const EXERCISES: Exercise[] = _EXERCISES as Exercise[];

/** Default (built-in) exercises — same as EXERCISES, typed explicitly */
export const defaultExercises: Exercise[] = EXERCISES;

export const MUSCLE_GROUPS: { id: MuscleGroup; label: string; icon: string; color: string }[] = [
  { id: 'chest', label: 'Chest', icon: '💪', color: '#FF6B6B' },
  { id: 'back', label: 'Back', icon: '🏋️', color: '#4DA6FF' },
  { id: 'shoulders', label: 'Shoulders', icon: '🦾', color: '#9B59B6' },
  { id: 'arms', label: 'Arms', icon: '💪', color: '#00FF9D' },
  { id: 'legs', label: 'Legs', icon: '🦵', color: '#FFB547' },
  { id: 'core', label: 'Core', icon: '🎯', color: '#FF8C42' },
  { id: 'glutes', label: 'Glutes', icon: '🍑', color: '#FF69B4' },
  { id: 'cardio', label: 'Cardio', icon: '❤️', color: '#FF4D6D' },
  { id: 'full_body', label: 'Full Body', icon: '⚡', color: '#00FF9D' },
];

export const getExercisesByMuscle = (muscle: MuscleGroup) =>
  EXERCISES.filter((e) => e.muscleGroup === muscle || e.secondaryMuscles?.includes(muscle));

export const getPopularExercises = () => EXERCISES.filter((e) => e.isPopular);

export const searchExercises = (query: string) =>
  EXERCISES.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.muscleGroup.includes(query.toLowerCase())
  );

/** Search across both default and custom exercises */
export const searchAllExercises = (
  query: string,
  customExercises: CustomExercise[],
  filters?: {
    muscle?: MuscleGroup | null;
    equipment?: Equipment | null;
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
    customOnly?: boolean;
  }
): (Exercise | CustomExercise)[] => {
  const q = query.toLowerCase();
  const all: (Exercise | CustomExercise)[] = filters?.customOnly
    ? [...customExercises]
    : [...EXERCISES, ...customExercises];

  return all.filter((e) => {
    const matchQ =
      q.length === 0 ||
      e.name.toLowerCase().includes(q) ||
      e.muscleGroup.includes(q) ||
      e.equipment.includes(q);
    const matchMuscle = !filters?.muscle || e.muscleGroup === filters.muscle;
    const matchEquip = !filters?.equipment || e.equipment === filters.equipment;
    const matchDiff = !filters?.difficulty || e.difficulty === filters.difficulty;
    return matchQ && matchMuscle && matchEquip && matchDiff;
  });
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  resistance_band: 'Resistance Band',
  smith_machine: 'Smith Machine',
  other: 'Other',
};

/**
 * Get all exercises (default + custom). Pass customExercises from the store.
 * Use this everywhere exercises are displayed so custom ones appear too.
 */
export const getAllExercises = (customExercises: CustomExercise[]): Exercise[] => [
  ...EXERCISES,
  ...customExercises,
];

/**
 * Find an exercise by ID across both default and custom lists.
 */
export const findExerciseById = (
  id: string,
  customExercises: CustomExercise[]
): Exercise | undefined =>
  EXERCISES.find((e) => e.id === id) ?? customExercises.find((e) => e.id === id);

// ─── v6: Cloud-aware helpers ──────────────────────────────────────────────────
// These helpers allow gradual adoption of the new exerciseStore/exerciseService
// without breaking existing callers of EXERCISES.

/**
 * Get all exercises including cloud catalog exercises.
 * During Phase 1 (local-only): returns same as getAllExercises()
 * During Phase 2+ (with cloud): merges local and cloud catalog,
 *   cloud exercises take precedence for matching IDs.
 *
 * @param customExercises — user custom exercises from store
 * @param catalogExercises — cloud catalog exercises from exerciseStore (optional)
 */
export const getAllExercisesWithCloud = (
  customExercises: CustomExercise[],
  catalogExercises?: Exercise[]
): Exercise[] => {
  const catalog = catalogExercises && catalogExercises.length > 0
    ? catalogExercises
    : EXERCISES;

  const customIds = new Set(customExercises.map((e) => e.id));
  return [...catalog.filter((e) => !customIds.has(e.id)), ...customExercises];
};

/**
 * Find exercise by ID, checking cloud catalog first, then local, then custom.
 */
export const findExerciseByIdWithCloud = (
  id: string,
  customExercises: CustomExercise[],
  catalogExercises?: Exercise[]
): Exercise | undefined => {
  const cloudMatch = catalogExercises?.find((e) => e.id === id);
  if (cloudMatch) return cloudMatch;
  return findExerciseById(id, customExercises);
};

