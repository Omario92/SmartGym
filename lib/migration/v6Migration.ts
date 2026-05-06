/**
 * lib/migration/v6Migration.ts
 *
 * One-time data migration from monolithic store (v5) to split stores (v6).
 *
 * When to run:
 *   Call `runV6Migration()` once during app startup, AFTER all stores
 *   have been hydrated from AsyncStorage.
 *
 * What it does:
 *   1. Reads legacy data from `smartgym-store-v1` (monolithic store)
 *   2. Writes data into the new split stores (if not already migrated)
 *   3. Sets a migration flag to prevent re-running
 *
 * It is safe to run multiple times — idempotent by design.
 *
 * Usage:
 *   // In app/_layout.tsx, after store hydration:
 *   import { runV6Migration } from '@/lib/migration/v6Migration';
 *   await runV6Migration();
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Routine } from '@/types/routine';
import type { WorkoutSession, ExercisePR } from '@/types/workout';
import type { BodyMeasure } from '@/types/measure';
import type { CustomExercise } from '@/types/exercise';

// ─── Migration flag key ────────────────────────────────────────────────────────

const MIGRATION_V6_DONE_KEY = '@smartgym:migration_v6_done';
const LEGACY_STORE_KEY = 'smartgym-store-v1';

// ─── Legacy store shape ───────────────────────────────────────────────────────

interface LegacyPersistedState {
  state: {
    routines?: Routine[];
    sessions?: WorkoutSession[];
    measures?: BodyMeasure[];
    customExercises?: CustomExercise[];
    favoriteExerciseIds?: string[];
    exercisePRs?: Record<string, ExercisePR>;
    authUser?: { id: string; email: string | null } | null;
    localSyncDone?: boolean;
    settings?: Record<string, unknown>;
  };
  version: number;
}

// ─── Migration runner ─────────────────────────────────────────────────────────

export async function runV6Migration(): Promise<boolean> {
  try {
    // Check if already migrated
    const done = await AsyncStorage.getItem(MIGRATION_V6_DONE_KEY);
    if (done === 'true') return true; // Already done

    // Read legacy store
    const legacyRaw = await AsyncStorage.getItem(LEGACY_STORE_KEY);
    if (!legacyRaw) {
      // No legacy store — first install, no migration needed
      await AsyncStorage.setItem(MIGRATION_V6_DONE_KEY, 'true');
      return true;
    }

    const legacy = JSON.parse(legacyRaw) as LegacyPersistedState;
    if (!legacy?.state) {
      await AsyncStorage.setItem(MIGRATION_V6_DONE_KEY, 'true');
      return true;
    }

    const s = legacy.state;

    // ── Migrate routines → routineStore ───────────────────────────────────
    if (s.routines?.length) {
      const existingRaw = await AsyncStorage.getItem('smartgym-routines-v1');
      if (!existingRaw) {
        const routineStoreState = {
          state: {
            routines: s.routines,
            savedPrograms: [],
          },
          version: 1,
        };
        await AsyncStorage.setItem('smartgym-routines-v1', JSON.stringify(routineStoreState));
      }
    }

    // ── Migrate sessions + PRs → historyStore ─────────────────────────────
    if (s.sessions?.length || s.exercisePRs) {
      const existingRaw = await AsyncStorage.getItem('smartgym-history-v1');
      if (!existingRaw) {
        const historyStoreState = {
          state: {
            sessions: s.sessions ?? [],
            exercisePRs: s.exercisePRs ?? {},
          },
          version: 1,
        };
        await AsyncStorage.setItem('smartgym-history-v1', JSON.stringify(historyStoreState));
      }
    }

    // ── Migrate measures → measureStore ───────────────────────────────────
    if (s.measures?.length) {
      const existingRaw = await AsyncStorage.getItem('smartgym-measures-v1');
      if (!existingRaw) {
        const measureStoreState = {
          state: { measures: s.measures },
          version: 1,
        };
        await AsyncStorage.setItem('smartgym-measures-v1', JSON.stringify(measureStoreState));
      }
    }

    // ── Migrate custom exercises + favorites → exerciseStore ──────────────
    if (s.customExercises?.length || s.favoriteExerciseIds?.length) {
      const existingRaw = await AsyncStorage.getItem('smartgym-exercises-v1');
      if (!existingRaw) {
        const exerciseStoreState = {
          state: {
            customExercises: s.customExercises ?? [],
            favoriteExerciseIds: s.favoriteExerciseIds ?? [],
            catalogLoadedAt: null,
          },
          version: 1,
        };
        await AsyncStorage.setItem('smartgym-exercises-v1', JSON.stringify(exerciseStoreState));
      }
    }

    // ── Migrate auth → authStore ──────────────────────────────────────────
    if (s.authUser) {
      const existingRaw = await AsyncStorage.getItem('smartgym-auth-v1');
      if (!existingRaw) {
        const authStoreState = {
          state: { authUser: s.authUser },
          version: 1,
        };
        await AsyncStorage.setItem('smartgym-auth-v1', JSON.stringify(authStoreState));
      }
    }

    // ── Migrate sync metadata → syncStore ─────────────────────────────────
    const syncStoreState = {
      state: {
        syncQueue: [],
        lastSyncAt: null,
        localSyncDone: s.localSyncDone ?? false,
      },
      version: 1,
    };
    const existingSyncRaw = await AsyncStorage.getItem('smartgym-sync-v1');
    if (!existingSyncRaw) {
      await AsyncStorage.setItem('smartgym-sync-v1', JSON.stringify(syncStoreState));
    }

    // Mark migration complete
    await AsyncStorage.setItem(MIGRATION_V6_DONE_KEY, 'true');

    console.log('[SmartGym] v6 migration complete');
    return true;
  } catch (err) {
    console.error('[SmartGym] v6 migration failed:', err);
    return false;
  }
}

/**
 * Reset migration flag (for testing purposes only).
 * @internal
 */
export async function _resetMigrationFlag(): Promise<void> {
  await AsyncStorage.removeItem(MIGRATION_V6_DONE_KEY);
}
