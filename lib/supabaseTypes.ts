/**
 * Supabase database types + unified app-level Exercise type.
 * The Database type mirrors the public.exercises table schema exactly.
 */

import type { MuscleGroup, Equipment, ExerciseType } from './exercises';

// ─── Supabase-generated Database types ────────────────────────────────────────

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseVisibility = 'public' | 'private';

/** A single media attachment (thumbnail, demo GIF, demo video) */
export interface MediaItem {
  url: string;
  /** 'image' | 'gif' | 'video' */
  type: 'image' | 'gif' | 'video';
  /** Optional lower-res thumbnail for videos/GIFs */
  thumbnailUrl?: string;
  /** Storage object path for deletes */
  storagePath?: string;
}

/** Row shape matching public.exercises table */
export interface ExerciseRow {
  id: string;
  slug: string | null;
  name: string;
  muscle_group: MuscleGroup;
  secondary_muscles: MuscleGroup[];
  equipment: Equipment;
  type: ExerciseType;
  description: string | null;
  instructions: string[];
  tips: string[];
  difficulty: ExerciseDifficulty;
  is_public: boolean;
  created_by: string | null;
  media: MediaItem[];
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/** Insert payload */
export type ExerciseInsert = Omit<ExerciseRow, 'id' | 'created_at' | 'updated_at'>;

/** Update payload */
export type ExerciseUpdate = Partial<Omit<ExerciseRow, 'id' | 'created_at' | 'updated_at' | 'created_by'>>;

/** Unified app-level exercise type (works for both default and cloud custom) */
export interface CloudExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  type: ExerciseType;
  description: string;
  instructions: string[];
  tips: string[];
  difficulty: ExerciseDifficulty;
  /** First image from media array, or empty string */
  image: string;
  /** First GIF from media array */
  gif?: string;
  /** All media attachments */
  media: MediaItem[];
  /** 'default' = built-in, 'custom' = user created cloud exercise */
  source: 'default' | 'custom';
  isCustom?: true;
  isPopular?: boolean;
  /** ISO timestamp — only for cloud exercises */
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  notes?: string;
  isArchived?: boolean;
}

/** Minimal Database wrapper type for the Supabase client generic */
export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: ExerciseRow;
        Insert: ExerciseInsert;
        Update: ExerciseUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      muscle_group: MuscleGroup;
      equipment_type: Equipment;
      exercise_type: ExerciseType;
      exercise_difficulty: ExerciseDifficulty;
      exercise_visibility: ExerciseVisibility;
    };
  };
}

/** Auth user shape stored in Zustand */
export interface AuthUser {
  id: string;
  email: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  provider?: string;
  /** From profiles.is_admin — gates the Admin Tools UI. */
  isAdmin?: boolean;
}
