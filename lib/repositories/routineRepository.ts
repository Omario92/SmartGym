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
import { fetchRoutinesFromCMS } from '@/lib/api/routineApi';
import { fetchUserRoutinesFromSupabase } from '@/lib/api/routineApi';

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

  private async _fetchAndCacheExplore(): Promise<Routine[]> {
    const CMS_ENABLED =
      !!process.env.EXPO_PUBLIC_CMS_BASE_URL &&
      process.env.EXPO_PUBLIC_CMS_BASE_URL !== 'PLACEHOLDER';

    if (!CMS_ENABLED) return [];

    const res = await fetchRoutinesFromCMS();
    await cacheExploreRoutines(res.routines, res.version);
    return res.routines;
  }

  private _refreshExploreInBackground(): void {
    this._isRefreshing = true;
    this._fetchAndCacheExplore()
      .catch(() => {})
      .finally(() => { this._isRefreshing = false; });
  }
}

export const routineRepository = new RoutineRepository();
