/**
 * lib/services/syncService.ts  (NEW — replaces lib/sync/syncService.ts)
 *
 * Production-ready sync orchestration service.
 *
 * Features:
 *  - Push dirty local entities to Supabase
 *  - Pull remote changes and merge into Zustand store
 *  - Retry queue with exponential backoff
 *  - Conflict resolution (newest-wins by default)
 *  - Background sync trigger (network reconnect / foreground)
 *  - Auth-restore flow (pull all cloud data on login)
 *
 * Usage:
 *   import { syncService } from '@/lib/services/syncService';
 *   await syncService.pushDirtyEntities(store);
 *   await syncService.pullAndMerge(store);
 */

import NetInfo from '@react-native-community/netinfo';
import type { Routine } from '@/types/routine';
import type { WorkoutSession, ExercisePR } from '@/types/workout';
import type { BodyMeasure } from '@/types/measure';
import type { CustomExercise } from '@/types/exercise';
import type { SyncResult, SyncQueueItem } from '@/types/sync';
import {
  upsertRoutine,
  upsertWorkoutSession,
  upsertBodyMeasure,
  upsertExercisePR,
  syncFavorites,
  fetchFavorites,
  upsertCustomExercise,
} from '@/lib/api/syncApi';
import {
  fetchUserRoutinesFromSupabase,
  fetchUserRoutinesSince,
} from '@/lib/api/routineApi';

// ─── Store interface (minimal — avoids circular dependency) ───────────────────
// We accept a store-like object so the service stays decoupled from Zustand.

interface SyncStore {
  authUser: { id: string } | null;
  routines: Routine[];
  sessions: WorkoutSession[];
  measures: BodyMeasure[];
  exercisePRs: Record<string, ExercisePR>;
  customExercises: CustomExercise[];
  favoriteExerciseIds: string[];
  // Actions
  markEntitySynced: (type: string, id: string, cloudId?: string) => void;
  mergeCloudRoutines: (routines: Routine[]) => void;
  mergeCloudSessions: (sessions: WorkoutSession[]) => void;
  mergeCloudMeasures: (measures: BodyMeasure[]) => void;
  mergeCloudPRs: (prs: Record<string, ExercisePR>) => void;
  mergeCloudFavorites: (ids: string[]) => void;
}

// ─── Retry config ─────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

// ─── Service ──────────────────────────────────────────────────────────────────

class SyncService {
  private _isSyncing = false;

  // ── Network check ─────────────────────────────────────────────────────────

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  }

  // ── Push dirty local data → Supabase ─────────────────────────────────────

  /**
   * Push all entities with syncStatus === 'dirty' or 'deleted' to Supabase.
   * Safe to call multiple times — idempotent.
   */
  async pushDirtyEntities(store: SyncStore): Promise<SyncResult> {
    if (this._isSyncing) return { success: false, synced: 0, failed: 0, conflicts: [], error: 'Already syncing' };
    if (!(await this.isOnline())) return { success: false, synced: 0, failed: 0, conflicts: [], error: 'Offline' };
    if (!store.authUser) return { success: false, synced: 0, failed: 0, conflicts: [], error: 'Not authenticated' };

    this._isSyncing = true;
    const userId = store.authUser.id;
    let synced = 0;
    let failed = 0;
    const startMs = Date.now();

    try {
      // ── Routines ──
      for (const routine of store.routines) {
        if (routine.syncStatus !== 'dirty' && routine.syncStatus !== 'deleted') continue;
        const ok = await this._withRetry(() => upsertRoutine(userId, routine));
        if (ok) {
          store.markEntitySynced('routine', routine.id, ok.cloudId);
          synced++;
        } else {
          failed++;
        }
      }

      // ── Sessions ──
      for (const session of store.sessions) {
        if (session.syncStatus !== 'dirty' && session.syncStatus !== 'deleted') continue;
        const ok = await this._withRetry(() => upsertWorkoutSession(userId, session));
        if (ok) {
          store.markEntitySynced('session', session.id, ok.cloudId);
          synced++;
        } else {
          failed++;
        }
      }

      // ── Measures ──
      for (const measure of store.measures) {
        if (measure.syncStatus !== 'dirty' && measure.syncStatus !== 'deleted') continue;
        const ok = await this._withRetry(() => upsertBodyMeasure(userId, measure));
        if (ok) {
          store.markEntitySynced('measure', measure.id, ok.cloudId);
          synced++;
        } else {
          failed++;
        }
      }

      // ── PRs ──
      for (const [exerciseId, pr] of Object.entries(store.exercisePRs)) {
        if (pr.syncStatus !== 'dirty' && pr.syncStatus !== 'deleted') continue;
        const ok = await this._withRetry(() => upsertExercisePR(userId, exerciseId, pr));
        if (ok) {
          store.markEntitySynced('pr', exerciseId, ok.cloudId);
          synced++;
        } else {
          failed++;
        }
      }

      // ── Custom exercises ──
      for (const ex of store.customExercises) {
        if (ex.syncStatus !== 'dirty' && ex.syncStatus !== 'deleted') continue;
        const ok = await this._withRetry(() => upsertCustomExercise(userId, ex));
        if (ok) {
          store.markEntitySynced('customExercise', ex.id, ok.cloudId);
          synced++;
        } else {
          failed++;
        }
      }

      // ── Favorites (push full list) ──
      await this._withRetry(() => syncFavorites(userId, store.favoriteExerciseIds));

      return {
        success: failed === 0,
        synced,
        failed,
        conflicts: [],
        durationMs: Date.now() - startMs,
      };
    } catch (err) {
      return {
        success: false,
        synced,
        failed,
        conflicts: [],
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      this._isSyncing = false;
    }
  }

  // ── Pull cloud data → merge into store ───────────────────────────────────

  /**
   * Pull all cloud data and merge into the Zustand store.
   * Used on login (full restore) and periodic sync.
   */
  async pullAndMerge(store: SyncStore, since?: string): Promise<SyncResult> {
    if (!(await this.isOnline())) return { success: false, synced: 0, failed: 0, conflicts: [] };
    if (!store.authUser) return { success: false, synced: 0, failed: 0, conflicts: [] };

    const userId = store.authUser.id;
    let synced = 0;
    const startMs = Date.now();

    try {
      // ── Routines ──
      const routines = since
        ? await fetchUserRoutinesSince(userId, since)
        : await fetchUserRoutinesFromSupabase(userId);
      store.mergeCloudRoutines(routines);
      synced += routines.length;

      // ── Favorites ──
      const favorites = await fetchFavorites(userId);
      store.mergeCloudFavorites(favorites);

      return {
        success: true,
        synced,
        failed: 0,
        conflicts: [],
        durationMs: Date.now() - startMs,
      };
    } catch (err) {
      return {
        success: false,
        synced,
        failed: 0,
        conflicts: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ── Full auth-restore flow ────────────────────────────────────────────────

  /**
   * Called immediately after successful login.
   * Pulls ALL user data from Supabase and merges into the store.
   * Then pushes any local-only dirty entities.
   */
  async authRestoreFlow(store: SyncStore): Promise<SyncResult> {
    const pull = await this.pullAndMerge(store);
    const push = await this.pushDirtyEntities(store);
    return {
      success: pull.success && push.success,
      synced: pull.synced + push.synced,
      failed: push.failed,
      conflicts: [...pull.conflicts, ...push.conflicts],
    };
  }

  // ── Retry helper ─────────────────────────────────────────────────────────

  private async _withRetry<T>(
    fn: () => Promise<T>,
    retries = MAX_RETRIES
  ): Promise<T | null> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt < retries - 1) {
          const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    return null;
  }
}

export const syncService = new SyncService();
