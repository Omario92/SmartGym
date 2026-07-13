/**
 * types/routine.ts
 *
 * Normalized routine domain types.
 * Supports flat (legacy) and day-based (advanced) routine structures.
 */

import type { SyncMetadata } from './sync';

// ─── Routine exercise entry ───────────────────────────────────────────────────

export interface RoutineExercise {
  /** Optional local row ID */
  id?: string;
  exerciseId: string;
  exerciseName: string;
  /** Display order within routine or day */
  order: number;
  sets: number;
  reps?: number;
  weight?: number;
  restSeconds?: number;
  note?: string;
  /** Day ID when using day-based structure */
  dayId?: string;
}

// ─── Day (for multi-day programs, e.g. PPL) ───────────────────────────────────

export interface RoutineDay {
  id: string;
  routineId: string;
  name: string; // e.g. "Day 1 — Push", "Monday"
  order: number;
  exercises: RoutineExercise[];
}

// ─── Routine ──────────────────────────────────────────────────────────────────

/** Where the routine originated */
export type RoutineSource = 'user' | 'default' | 'explore' | 'imported' | 'ai';

export interface Routine {
  id: string;
  name: string;
  description?: string;
  color: string;
  category?: string;
  /** Estimated session duration in minutes */
  estimatedDuration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  /** Data origin */
  source: RoutineSource;

  // ── Exercise list ─────────────────────────────────────────────────────────
  /** Flat exercise list (legacy format — all existing routines use this) */
  exercises: RoutineExercise[];
  /** Optional day-based structure (advanced programs) */
  days?: RoutineDay[];

  // ── Media ─────────────────────────────────────────────────────────────────
  imageUrl?: string;

  // ── Timestamps ────────────────────────────────────────────────────────────
  createdAt: string;
  updatedAt?: string;
  lastPerformed?: string;
  deletedAt?: string | null;

  // ── Sync ──────────────────────────────────────────────────────────────────
  cloudId?: string;
  syncStatus?: SyncMetadata['syncStatus'];
}

// ─── Saved program (from Explore) ────────────────────────────────────────────

export interface SavedProgram {
  /** Local ID */
  id: string;
  /** Reference to source program (may be CMS ID) */
  programId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  source: 'explore' | 'cms' | 'ai';
  savedAt: string;
  /** The fully-inlined routine, ready to use offline */
  routine: Routine;
}

// ─── Explore program (from CMS / Supabase) ────────────────────────────────────

export interface ExploreProgram {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks?: number;
  workoutsPerWeek?: number;
  category: string;
  tags?: string[];
  routine: Routine;
  /** ISO timestamp — for stale check */
  updatedAt?: string;
}
