/**
 * lib/services/routineService.ts
 *
 * Routine business logic layer.
 * Handles explore routines (CMS), user routine CRUD,
 * and the "save from Explore" flow.
 */

import type { Routine, SavedProgram } from '@/types/routine';
import { routineRepository } from '@/lib/repositories/routineRepository';

// ─── Service ──────────────────────────────────────────────────────────────────

class RoutineService {
  /**
   * Get explore/default routines from CMS (cache-first).
   */
  async getExploreRoutines(): Promise<Routine[]> {
    return routineRepository.getExploreRoutines();
  }

  /**
   * Get user routines from Supabase (for auth restore flow).
   * Result is merged into Zustand store by the caller.
   */
  async getUserRoutinesFromCloud(userId: string): Promise<Routine[]> {
    return routineRepository.getUserRoutines(userId);
  }

  /**
   * Convert an explore program into a SavedProgram entity
   * that can be stored in Zustand and persisted.
   */
  createSavedProgram(routine: Routine): SavedProgram {
    return {
      id: `saved_${routine.id}_${Date.now()}`,
      programId: routine.id,
      name: routine.name,
      description: routine.description,
      imageUrl: routine.imageUrl,
      source: 'explore',
      savedAt: new Date().toISOString(),
      routine: {
        ...routine,
        id: `local_${routine.id}_${Date.now()}`,
        source: 'imported',
        createdAt: new Date().toISOString(),
        syncStatus: 'dirty',
      },
    };
  }

  /**
   * Refresh explore routine cache.
   */
  async refreshExploreRoutines(): Promise<Routine[]> {
    return routineRepository.refresh();
  }
}

export const routineService = new RoutineService();
