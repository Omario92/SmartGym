/**
 * store/exerciseStore.ts
 *
 * Manages the exercise catalog state (remote catalog + custom exercises + favorites).
 * This store is separate from the monolithic store/index.ts and can be adopted
 * incrementally — existing components continue using the monolithic store.
 *
 * Usage:
 *   import { useExerciseStore } from '@/store/exerciseStore';
 *   const { catalogExercises, isLoading, loadCatalog } = useExerciseStore();
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Exercise, CustomExercise, ExerciseFilters } from '@/types/exercise';
import { exerciseService } from '@/lib/services/exerciseService';

// ─── State interface ──────────────────────────────────────────────────────────

interface ExerciseStoreState {
  /** Remote catalog exercises (CMS + Supabase) */
  catalogExercises: Exercise[];
  /** User-created custom exercises */
  customExercises: CustomExercise[];
  /** Favorited exercise IDs */
  favoriteExerciseIds: string[];
  /** Loading state for initial catalog fetch */
  isLoadingCatalog: boolean;
  /** Error message from last failed fetch */
  catalogError: string | null;
  /** ISO timestamp of last successful catalog load */
  catalogLoadedAt: string | null;

  // ── Actions ──────────────────────────────────────────────────────────────
  loadCatalog: () => Promise<void>;
  refreshCatalog: () => Promise<void>;

  addCustomExercise: (exercise: CustomExercise) => void;
  updateCustomExercise: (id: string, updates: Partial<CustomExercise>) => void;
  deleteCustomExercise: (id: string) => void;

  toggleFavorite: (exerciseId: string) => void;
  isFavorite: (exerciseId: string) => boolean;

  /** Get all exercises (catalog + custom) synchronously */
  getAllExercises: () => Exercise[];
  /** Search exercises with filters */
  searchExercises: (filters: ExerciseFilters) => Promise<Exercise[]>;

  /** Merge cloud custom exercises (from sync) */
  mergeCloudCustomExercises: (exercises: CustomExercise[]) => void;
  /** Merge cloud favorites (from sync) */
  mergeCloudFavorites: (ids: string[]) => void;

  /** Reset to empty (called on logout) */
  clearUserData: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useExerciseStore = create<ExerciseStoreState>()(
  persist(
    immer((set, get) => ({
      catalogExercises: [],
      customExercises: [],
      favoriteExerciseIds: [],
      isLoadingCatalog: false,
      catalogError: null,
      catalogLoadedAt: null,

      // ── Catalog ──────────────────────────────────────────────────────────

      loadCatalog: async () => {
        // Skip if already loaded recently (within 24h)
        const { catalogLoadedAt, catalogExercises } = get();
        if (
          catalogExercises.length > 0 &&
          catalogLoadedAt &&
          Date.now() - new Date(catalogLoadedAt).getTime() < 24 * 60 * 60 * 1000
        ) {
          return;
        }

        set((state) => {
          state.isLoadingCatalog = true;
          state.catalogError = null;
        });

        try {
          const exercises = await exerciseService.getAll();
          set((state) => {
            state.catalogExercises = exercises;
            state.isLoadingCatalog = false;
            state.catalogLoadedAt = new Date().toISOString();
          });
        } catch (err) {
          set((state) => {
            state.isLoadingCatalog = false;
            state.catalogError = err instanceof Error ? err.message : 'Failed to load exercises';
          });
        }
      },

      refreshCatalog: async () => {
        set((state) => { state.isLoadingCatalog = true; });
        try {
          const exercises = await exerciseService.refresh();
          set((state) => {
            state.catalogExercises = exercises;
            state.isLoadingCatalog = false;
            state.catalogLoadedAt = new Date().toISOString();
          });
        } catch {
          set((state) => { state.isLoadingCatalog = false; });
        }
      },

      // ── Custom exercises ──────────────────────────────────────────────────

      addCustomExercise: (exercise) =>
        set((state) => {
          state.customExercises.push(exercise);
        }),

      updateCustomExercise: (id, updates) =>
        set((state) => {
          const idx = state.customExercises.findIndex((e) => e.id === id);
          if (idx !== -1) {
            Object.assign(state.customExercises[idx], updates, {
              syncStatus: 'dirty',
              updatedAt: new Date().toISOString(),
            });
          }
        }),

      deleteCustomExercise: (id) =>
        set((state) => {
          state.customExercises = state.customExercises.filter((e) => e.id !== id);
          state.favoriteExerciseIds = state.favoriteExerciseIds.filter((fid) => fid !== id);
        }),

      // ── Favorites ────────────────────────────────────────────────────────

      toggleFavorite: (exerciseId) =>
        set((state) => {
          const idx = state.favoriteExerciseIds.indexOf(exerciseId);
          if (idx === -1) {
            state.favoriteExerciseIds.push(exerciseId);
          } else {
            state.favoriteExerciseIds.splice(idx, 1);
          }
        }),

      isFavorite: (exerciseId) => get().favoriteExerciseIds.includes(exerciseId),

      // ── Combined access ───────────────────────────────────────────────────

      getAllExercises: () => {
        const { catalogExercises, customExercises } = get();
        const customIds = new Set(customExercises.map((e) => e.id));
        return [...catalogExercises.filter((e) => !customIds.has(e.id)), ...customExercises];
      },

      searchExercises: async (filters) => {
        const { customExercises } = get();
        return exerciseService.search(filters, customExercises);
      },

      // ── Sync merge ────────────────────────────────────────────────────────

      mergeCloudCustomExercises: (cloudExercises) =>
        set((state) => {
          const map = new Map(state.customExercises.map((e) => [e.id, e]));
          cloudExercises.forEach((ce) => {
            const existing = map.get(ce.id);
            const cloudNewer =
              !existing ||
              new Date(ce.updatedAt ?? 0) > new Date(existing.updatedAt ?? 0);
            if (cloudNewer) {
              map.set(ce.id, { ...ce, syncStatus: 'synced' });
            }
          });
          state.customExercises = Array.from(map.values()).filter((e) => !e.deletedAt);
        }),

      mergeCloudFavorites: (ids) =>
        set((state) => {
          state.favoriteExerciseIds = Array.from(
            new Set([...state.favoriteExerciseIds, ...ids])
          );
        }),

      // ── Reset ─────────────────────────────────────────────────────────────

      clearUserData: () =>
        set((state) => {
          state.customExercises = [];
          state.favoriteExerciseIds = [];
          // Keep catalog — it's public data
        }),
    })),
    {
      name: 'smartgym-exercises-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        customExercises: state.customExercises,
        favoriteExerciseIds: state.favoriteExerciseIds,
        catalogLoadedAt: state.catalogLoadedAt,
        // Do NOT persist catalogExercises (too large, always refetch)
      }),
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectCatalogExercises = (s: ExerciseStoreState) => s.catalogExercises;
export const selectCustomExercises = (s: ExerciseStoreState) => s.customExercises;
export const selectFavoriteIds = (s: ExerciseStoreState) => s.favoriteExerciseIds;
export const selectIsLoadingCatalog = (s: ExerciseStoreState) => s.isLoadingCatalog;
