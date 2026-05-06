/**
 * lib/repositories/exerciseRepository.ts
 *
 * Exercise repository — cache-first data access.
 * Implements the stale-while-revalidate pattern:
 *
 *   1. Check cache version against remote version (lightweight)
 *   2. Return cached data immediately if fresh
 *   3. Trigger background refresh if stale
 *   4. Fall back to local hardcoded data if network unavailable
 *
 * Usage:
 *   const exercises = await exerciseRepository.getAll();
 */

import type { Exercise, CustomExercise, ExerciseFilters } from '@/types/exercise';
import { EXERCISES as LOCAL_EXERCISES } from '@/lib/exercises';
import {
  cacheExercises,
  getCachedExercises,
  getCachedExercisesOffline,
  isExerciseCacheFresh,
} from '@/lib/cache/exerciseCache';
import {
  fetchExercisesFromCMS,
  fetchExercisesFromSupabase,
  fetchCMSVersion,
  isCMSConfigured,
  isSupabaseCatalogConfigured,
} from '@/lib/api/exerciseApi';

// ─── Repository class ─────────────────────────────────────────────────────────

class ExerciseRepository {
  private _isRefreshing = false;

  /**
   * Get the full exercise catalog.
   *
   * Priority:
   *   1. Fresh cache → return immediately
   *   2. Stale cache → return stale + trigger background refresh
   *   3. No cache → fetch from remote → cache → return
   *   4. Network error → return local hardcoded exercises
   */
  async getAll(): Promise<Exercise[]> {
    try {
      const cached = await getCachedExercises();

      if (cached) {
        const fresh = await isExerciseCacheFresh();
        if (!fresh && !this._isRefreshing) {
          // Background refresh — non-blocking
          this._refreshInBackground();
        }
        return cached.exercises;
      }

      // No cache — fetch synchronously
      return await this._fetchAndCache();
    } catch {
      // Network unavailable — use offline cache or local fallback
      return await this._offlineFallback();
    }
  }

  /**
   * Get a single exercise by ID.
   * Searches cache first, then falls back to local data.
   */
  async getById(id: string, customExercises: CustomExercise[] = []): Promise<Exercise | undefined> {
    const cached = await getCachedExercises();
    if (cached) {
      return cached.exercises.find((e) => e.id === id) ?? customExercises.find((e) => e.id === id);
    }
    // Fallback to local mapped exercises
    const localMapped = this._mapLocalExercises();
    return localMapped.find((e) => e.id === id) ?? customExercises.find((e) => e.id === id);
  }

  /**
   * Search exercises by query and filters.
   */
  async search(filters: ExerciseFilters, customExercises: CustomExercise[] = []): Promise<Exercise[]> {
    const all = await this.getAll();
    const combined: Exercise[] = filters.customOnly
      ? customExercises
      : [...all, ...customExercises];

    return combined.filter((e) => {
      const q = filters.query?.toLowerCase() ?? '';
      const matchQ =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.includes(q) ||
        e.equipment.includes(q);
      const matchMuscle = !filters.muscle || e.muscleGroup === filters.muscle;
      const matchEquip = !filters.equipment || e.equipment === filters.equipment;
      const matchDiff = !filters.difficulty || e.difficulty === filters.difficulty;
      const matchType = !filters.type || e.type === filters.type;
      const matchPopular = !filters.popularOnly || !!e.isPopular;
      return matchQ && matchMuscle && matchEquip && matchDiff && matchType && matchPopular;
    });
  }

  /**
   * Force a cache refresh — useful after admin CMS updates.
   */
  async refresh(): Promise<Exercise[]> {
    return await this._fetchAndCache();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private async _fetchAndCache(): Promise<Exercise[]> {
    let exercises: Exercise[];
    let version = '1.0.0';

    try {
      if (isSupabaseCatalogConfigured()) {
        // Phase 3: Supabase is primary
        exercises = await fetchExercisesFromSupabase();
      } else if (isCMSConfigured()) {
        // Phase 2: CMS is primary
        const res = await fetchExercisesFromCMS();
        exercises = res.exercises;
        version = res.version;
      } else {
        // Phase 1: Use local hardcoded data
        exercises = this._mapLocalExercises();
      }
    } catch {
      exercises = await this._offlineFallback();
    }

    if (exercises.length > 0) {
      await cacheExercises(exercises, version);
    }

    return exercises;
  }

  private _refreshInBackground(): void {
    this._isRefreshing = true;
    this._fetchAndCache()
      .catch(() => { /* silent fail */ })
      .finally(() => { this._isRefreshing = false; });
  }

  private async _offlineFallback(): Promise<Exercise[]> {
    // Try stale cache first
    const offline = await getCachedExercisesOffline();
    if (offline.length > 0) return offline;

    // Last resort: bundled local data
    return this._mapLocalExercises();
  }

  /** Map lib/exercises.ts Exercise (missing slug/imageUrl/source) → types/exercise.ts Exercise */
  private _mapLocalExercises(): Exercise[] {
    return LOCAL_EXERCISES.map((e) => ({
      ...e,
      slug: e.id.replace(/_/g, '-'),
      imageUrl: (e as any).image ?? '',
      source: 'default' as const,
    }));
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const exerciseRepository = new ExerciseRepository();
