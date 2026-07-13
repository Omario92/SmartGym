/**
 * types/exercise.ts
 *
 * Core exercise domain types — production-ready, cloud-aware.
 * These supersede the inline interfaces in lib/exercises.ts
 * and are fully backward-compatible (lib/exercises.ts re-exports them).
 *
 * Source hierarchy:
 *   'default'  — bundled TypeScript literal data (lib/exercises.ts)
 *   'cms'      — fetched from Google Sheets CMS via Apps Script
 *   'custom'   — user-created, stored locally
 *   'cloud'    — user-created, stored in Supabase
 */

// ─── Primitive types ──────────────────────────────────────────────────────────

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

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** Where this exercise originated */
export type ExerciseSource = 'default' | 'cms' | 'custom' | 'cloud';

// ─── Media ────────────────────────────────────────────────────────────────────

/** A single media attachment for an exercise */
export interface MediaItem {
  url: string;
  type: 'image' | 'gif' | 'video';
  /** Lower-res thumbnail for lazy loading video/GIF */
  thumbnailUrl?: string;
  /** Supabase Storage object path — used for deletion */
  storagePath?: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** File size in bytes */
  sizeBytes?: number;
}

// ─── Core exercise interface ──────────────────────────────────────────────────

export interface Exercise {
  /** Unique identifier — stable across versions */
  id: string;
  /** URL-safe slug derived from name, e.g. "bench-press" */
  slug: string;
  /** Display name */
  name: string;
  /** Short description explaining the exercise */
  description: string;
  /** Primary muscle group targeted */
  muscleGroup: MuscleGroup;
  /** Secondary muscles involved */
  secondaryMuscles?: MuscleGroup[];
  /** Broad workout category, e.g. "Push", "Pull", "HIIT" */
  category?: string;
  /** Equipment required */
  equipment: Equipment;
  /** Strength / Cardio / Flexibility */
  type: ExerciseType;
  /** Skill level */
  difficulty: ExerciseDifficulty;
  /** Step-by-step execution instructions */
  instructions: string[];
  /** Coaching tips for better form */
  tips: string[];

  // ── Media ─────────────────────────────────────────────────────────────────

  /** Primary still image URL (16:9, ~720p) */
  imageUrl: string;
  /** Animated GIF demonstration URL */
  gifUrl?: string;
  /** MP4 video demonstration URL */
  videoUrl?: string;
  /** Full media array (images, GIFs, videos) */
  media?: MediaItem[];

  // ── Metadata ──────────────────────────────────────────────────────────────

  /** Approximate calories burned per minute */
  caloriesPerMinute?: number;
  /** Show in popular/featured lists */
  isPopular?: boolean;
  /** True when user-created */
  isCustom?: boolean;
  /** Data source */
  source: ExerciseSource;
  /** ISO timestamp of creation */
  createdAt?: string;
  /** ISO timestamp of last update */
  updatedAt?: string;
}

// ─── Custom / user-created exercise ──────────────────────────────────────────

export interface CustomExercise extends Exercise {
  isCustom: true;
  source: 'custom' | 'cloud';
  /** Owner's user ID */
  userId?: string;
  /** Personal notes or coaching cues */
  notes?: string;
  /** True if image is a local file URI (not a remote URL) */
  imageIsLocal?: boolean;
  /** True when this exercise is backed by Supabase */
  isCloud?: boolean;
  // ── Sync metadata ─────────────────────────────────────────────────────────
  cloudId?: string;
  deletedAt?: string | null;
  syncStatus?: 'local' | 'synced' | 'dirty' | 'deleted' | 'conflict';
}

// ─── Catalog snapshot (returned by cache / API layers) ───────────────────────

export interface ExerciseCatalogSnapshot {
  exercises: Exercise[];
  /** Schema version string from CMS or Supabase */
  version: string;
  /** ISO timestamp when this catalog was fetched */
  fetchedAt: string;
  /** Where the data actually came from in this response */
  source: 'cache' | 'remote' | 'local';
}

// ─── Filter / search params ───────────────────────────────────────────────────

export interface ExerciseFilters {
  muscle?: MuscleGroup | null;
  equipment?: Equipment | null;
  difficulty?: ExerciseDifficulty | null;
  type?: ExerciseType | null;
  customOnly?: boolean;
  popularOnly?: boolean;
  query?: string;
}

// ─── Static UI metadata ───────────────────────────────────────────────────────

export interface MuscleGroupMeta {
  id: MuscleGroup;
  label: string;
  icon: string;
  color: string;
}

export interface EquipmentMeta {
  id: Equipment;
  label: string;
}
