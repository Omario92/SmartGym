/**
 * lib/repositories/routineRepository.ts
 *
 * Routine repository — cache-first access for explore/default routines.
 * User routines are managed by Zustand store + syncService.
 */

import type { Routine } from '@/types/routine';
import {
  cacheExploreRoutines,
  getCachedExploreRoutines,
  getCachedExploreRoutinesOffline,
  isExploreRoutineCacheFresh,
} from '@/lib/cache/routineCache';
import {
  fetchRoutinesFromCMS,
  fetchUserRoutinesFromSupabase,
  fetchRoutineTemplatesFromSupabase,
} from '@/lib/api/routineApi';

// ─── Repository ────────────────────────────────────────────────────────────

class RoutineRepository {
  private _isRefreshing = false;

  /**
   * Get explore/default routines from CMS.
   * Cache-first with SWR.
   */
  async getExploreRoutines(): Promise<Routine[]> {
    try {
      const cached = await getCachedExploreRoutines();

      if (cached) {
        const fresh = await isExploreRoutineCacheFresh();
        if (!fresh && !this._isRefreshing) {
          this._refreshExploreInBackground();
        }
        return cached.routines;
      }

      return await this._fetchAndCacheExplore();
    } catch {
      return await getCachedExploreRoutinesOffline();
    }
  }

  /**
   * Fetch user routines directly from Supabase.
   * Called during auth restore flow — does NOT cache (stored in Zustand).
   */
  async getUserRoutines(userId: string): Promise<Routine[]> {
    return fetchUserRoutinesFromSupabase(userId);
  }

  async refresh(): Promise<Routine[]> {
    return this._fetchAndCacheExplore();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  /**
   * Fetch explore routines and cache them. Source order:
   *   1. Supabase routine_templates (primary, production source)
   *   2. Google Sheets CMS            (legacy fallback)
   * On total failure the caller (getExploreRoutines) falls back to the offline cache.
   */
  private async _fetchAndCacheExplore(): Promise<Routine[]> {
    // 1. Supabase templates (primary)
    try {
      const templates = await fetchRoutineTemplatesFromSupabase();
      if (templates.length > 0) {
        await cacheExploreRoutines(templates, `templates-${Date.now()}`);
        return templates;
      }
    } catch {
      // fall through to CMS
    }

    // 2. Google Sheets CMS (fallback)
    const CMS_ENABLED =
      !!process.env.EXPO_PUBLIC_CMS_BASE_URL &&
      process.env.EXPO_PUBLIC_CMS_BASE_URL !== 'PLACEHOLDER';

    if (CMS_ENABLED) {
      const res = await fetchRoutinesFromCMS();
      await cacheExploreRoutines(res.routines, res.version);
      return res.routines;
    }

    // 3. Nothing available — caller handles the offline cache fallback.
    return [];
  }

  private _refreshExploreInBackground(): void {
    this._isRefreshing = true;
    this._fetchAndCacheExplore()
      .catch(() => {})
      .finally(() => { this._isRefreshing = false; });
  }
}

export const routineRepository = new RoutineRepository();
