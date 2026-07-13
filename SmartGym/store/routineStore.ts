/**
 * store/routineStore.ts
 *
 * Manages user routines and saved programs.
 * Separate from the monolithic store/index.ts for incremental adoption.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Routine, SavedProgram } from '@/types/routine';

interface RoutineStoreState {
  routines: Routine[];
  savedPrograms: SavedProgram[];

  // ── Actions ──
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string, isAuthenticated: boolean) => void;
  duplicateRoutine: (id: string) => void;
  softDeleteRoutine: (id: string) => void;

  saveProgramFromExplore: (program: SavedProgram) => void;
  removeSavedProgram: (id: string) => void;

  mergeCloudRoutines: (routines: Routine[]) => void;
  clearUserData: () => void;
}

export const useRoutineStore = create<RoutineStoreState>()(
  persist(
    immer((set, get) => ({
      routines: [],
      savedPrograms: [],

      addRoutine: (routine) =>
        set((state) => {
          state.routines.push({
            ...routine,
            syncStatus: 'dirty',
            updatedAt: new Date().toISOString(),
          });
        }),

      updateRoutine: (id, updates) =>
        set((state) => {
          const idx = state.routines.findIndex((r) => r.id === id);
          if (idx !== -1) {
            Object.assign(state.routines[idx], updates, {
              syncStatus: 'dirty',
              updatedAt: new Date().toISOString(),
            });
          }
        }),

      deleteRoutine: (id, isAuthenticated) =>
        set((state) => {
          if (isAuthenticated) {
            // Soft delete — will be pushed to cloud and removed there
            const r = state.routines.find((r) => r.id === id);
            if (r) {
              r.deletedAt = new Date().toISOString();
              r.syncStatus = 'deleted';
            }
          } else {
            state.routines = state.routines.filter((r) => r.id !== id);
          }
        }),

      duplicateRoutine: (id) =>
        set((state) => {
          const routine = state.routines.find((r) => r.id === id);
          if (routine) {
            state.routines.push({
              ...routine,
              id: `${Date.now()}`,
              name: `${routine.name} (Copy)`,
              createdAt: new Date().toISOString(),
              lastPerformed: undefined,
              syncStatus: 'dirty',
            });
          }
        }),

      softDeleteRoutine: (id) =>
        set((state) => {
          const r = state.routines.find((r) => r.id === id);
          if (r) {
            r.deletedAt = new Date().toISOString();
            r.syncStatus = 'deleted';
          }
        }),

      saveProgramFromExplore: (program) =>
        set((state) => {
          // Avoid duplicates
          const exists = state.savedPrograms.some((p) => p.programId === program.programId);
          if (!exists) {
            state.savedPrograms.push(program);
            state.routines.push({
              ...program.routine,
              syncStatus: 'dirty',
            });
          }
        }),

      removeSavedProgram: (id) =>
        set((state) => {
          const program = state.savedPrograms.find((p) => p.id === id);
          if (program) {
            state.savedPrograms = state.savedPrograms.filter((p) => p.id !== id);
            state.routines = state.routines.filter((r) => r.id !== program.routine.id);
          }
        }),

      mergeCloudRoutines: (cloudRoutines) =>
        set((state) => {
          const map = new Map(state.routines.map((r) => [r.id, r]));
          cloudRoutines.forEach((cr) => {
            const existing = map.get(cr.id);
            const cloudNewer =
              !existing ||
              new Date(cr.updatedAt ?? 0) > new Date(existing.updatedAt ?? 0);
            if (cloudNewer) {
              map.set(cr.id, { ...cr, syncStatus: 'synced' });
            }
          });
          state.routines = Array.from(map.values()).filter((r) => !r.deletedAt);
        }),

      clearUserData: () =>
        set((state) => {
          state.routines = [];
          state.savedPrograms = [];
        }),
    })),
    {
      name: 'smartgym-routines-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        routines: state.routines,
        savedPrograms: state.savedPrograms,
      }),
    }
  )
);

export const selectRoutines = (s: RoutineStoreState) =>
  s.routines.filter((r) => !r.deletedAt);
export const selectSavedPrograms = (s: RoutineStoreState) => s.savedPrograms;
export const selectDirtyRoutines = (s: RoutineStoreState) =>
  s.routines.filter((r) => r.syncStatus === 'dirty' || r.syncStatus === 'deleted');
