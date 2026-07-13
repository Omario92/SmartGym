/**
 * lib/services/exerciseService.ts
 *
 * Exercise business logic layer.
 * Sits between UI/store and repository/cache layers.
 *
 * This is the ONLY place UI should call for exercise data.
 *
 * Usage:
 *   import { exerciseService } from '@/lib/services/exerciseService';
 *   const exercises = await exerciseService.getAll();
 */

import type { Exercise, CustomExercise, ExerciseFilters, MuscleGroupMeta, EquipmentMeta, MuscleGroup, Equipment } from '@/types/exercise';
import { exerciseRepository } from '@/lib/repositories/exerciseRepository';

// ─── Re-export static metadata ────────────────────────────────────────────────
// These are display constants used by filter UI — kept here for single-import convenience.

export const MUSCLE_GROUPS: MuscleGroupMeta[] = [
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

// ─── Service ──────────────────────────────────────────────────────────────────

class ExerciseService {
  /**
   * Get all catalog exercises (cache-first, offline-safe).
   */
  async getAll(customExercises: CustomExercise[] = []): Promise<Exercise[]> {
    const catalog = await exerciseRepository.getAll();
    // Merge: custom overrides duplicate catalog IDs
    const customIds = new Set(customExercises.map((e) => e.id));
    const filtered = catalog.filter((e) => !customIds.has(e.id));
    return [...filtered, ...customExercises];
  }

  /**
   * Get a single exercise by ID (catalog + custom).
   */
  async getById(id: string, customExercises: CustomExercise[] = []): Promise<Exercise | undefined> {
    return exerciseRepository.getById(id, customExercises);
  }

  /**
   * Search exercises by text query and filters.
   */
  async search(
    filters: ExerciseFilters,
    customExercises: CustomExercise[] = []
  ): Promise<Exercise[]> {
    return exerciseRepository.search(filters, customExercises);
  }

  /**
   * Get popular exercises (for home/explore highlights).
   */
  async getPopular(customExercises: CustomExercise[] = []): Promise<Exercise[]> {
    const all = await this.getAll(customExercises);
    return all.filter((e) => e.isPopular);
  }

  /**
   * Get exercises filtered by muscle group.
   */
  async getByMuscle(muscle: MuscleGroup, customExercises: CustomExercise[] = []): Promise<Exercise[]> {
    const all = await this.getAll(customExercises);
    return all.filter(
      (e) => e.muscleGroup === muscle || e.secondaryMuscles?.includes(muscle)
    );
  }

  /**
   * Force a full catalog refresh (call after CMS update).
   */
  async refresh(): Promise<Exercise[]> {
    return exerciseRepository.refresh();
  }

  /**
   * Get muscle group metadata by ID.
   */
  getMuscleGroupMeta(id: MuscleGroup): MuscleGroupMeta | undefined {
    return MUSCLE_GROUPS.find((m) => m.id === id);
  }
}

export const exerciseService = new ExerciseService();
