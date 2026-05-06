/**
 * types/workout.ts
 *
 * Active workout and session domain types.
 * Extracted from the monolithic store for separation of concerns.
 */

import type { SyncMetadata } from './sync';

// ─── Set log ──────────────────────────────────────────────────────────────────

export interface SetLog {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  note?: string;
  /** ISO timestamp when the set was marked complete */
  completedAt?: string;
  /** Optional RPE (Rate of Perceived Exertion) 1-10 */
  rpe?: number;
}

// ─── Exercise log ─────────────────────────────────────────────────────────────

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  restSeconds?: number;
  sets: SetLog[];
  /** Notes added during the session for this exercise */
  sessionNote?: string;
}

// ─── Workout session (history record) ────────────────────────────────────────

export interface WorkoutSession {
  id: string;
  routineId?: string;
  routineName: string;
  startedAt: string;
  finishedAt?: string;
  /** Duration in seconds */
  duration?: number;
  exercises: ExerciseLog[];
  /** Total weight × reps across all completed sets */
  totalVolume?: number;
  totalSets?: number;
  note?: string;
  // ── Sync ────────────────────────────────────────────────────────────────
  cloudId?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  syncStatus?: SyncMetadata['syncStatus'];
}

// ─── Active workout (runtime, not persisted) ─────────────────────────────────

export interface ActiveWorkout {
  routineId?: string;
  routineName: string;
  startedAt: string;
  exercises: ExerciseLog[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  isResting: boolean;
  restSecondsLeft: number;
  elapsedSeconds: number;
}

// ─── Personal record ─────────────────────────────────────────────────────────

export interface ExercisePR {
  /** Estimated one-rep max */
  oneRM: number;
  date: string;
  weight: number;
  reps: number;
  formula: 'epley' | 'brzycki' | 'lombardi';
  bestSetDate: string;
  // ── Sync ────────────────────────────────────────────────────────────────
  cloudId?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  syncStatus?: SyncMetadata['syncStatus'];
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

export interface Exercise1RMDataPoint {
  date: string;
  value: number;
  weight: number;
  reps: number;
}
