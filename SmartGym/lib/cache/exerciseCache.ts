/**
 * lib/cache/exerciseCache.ts
 *
 * Exercise catalog cache — wraps cacheManager for the exercise domain.
 * Caches both the full catalog and the schema version separately.
 */

import type { Exercise } from '@/types/exercise';
import { cacheRead, cacheWrite, cacheInvalidate, isCacheFresh, CACHE_TTL } from './cacheManager';

// ─── Cache keys ───────────────────────────────────────────────────────────────

const KEYS = {
  CATALOG:  'exercises:catalog',
  VERSION:  'exercises:version',
} as const;

// ─── Exercise catalog cache ───────────────────────────────────────────────────

export interface ExerciseCachePayload {
  exercises: Exercise[];
  version: string;
  fetchedAt: string;
}

/**
 * Write the full exercise catalog to cache.
 */
export async function cacheExercises(
  exercises: Exercise[],
  version: string
): Promise<void> {
  const payload: ExerciseCachePayload = {
    exercises,
    version,
    fetchedAt: new Date().toISOString(),
  };
  await cacheWrite(KEYS.CATALOG, payload, CACHE_TTL.EXERCISES, version);
  await cacheWrite(KEYS.VERSION, version, CACHE_TTL.VERSION);
}

/**
 * Read the cached exercise catalog.
 * Returns null if not cached or version mismatch.
 */
export async function getCachedExercises(
  expectedVersion?: string
): Promise<ExerciseCachePayload | null> {
  const entry = await cacheRead<ExerciseCachePayload>(KEYS.CATALOG, expectedVersion);
  if (!entry) return null;
  return entry.data;
}

/**
 * Returns the cached exercises if available (regardless of TTL).
 * Used as offline fallback.
 */
export async function getCachedExercisesOffline(): Promise<Exercise[]> {
  const entry = await cacheRead<ExerciseCachePayload>(KEYS.CATALOG);
  return entry?.data.exercises ?? [];
}

/**
 * Check if the exercise catalog cache is fresh.
 */
export async function isExerciseCacheFresh(expectedVersion?: string): Promise<boolean> {
  const entry = await cacheRead<ExerciseCachePayload>(KEYS.CATALOG, expectedVersion);
  return entry !== null && isCacheFresh(entry);
}

/**
 * Get the currently cached schema version string.
 * Returns null if no version cached.
 */
export async function getCachedExerciseVersion(): Promise<string | null> {
  const entry = await cacheRead<string>(KEYS.VERSION);
  return entry?.data ?? null;
}

/**
 * Invalidate all exercise cache entries.
 */
export async function invalidateExerciseCache(): Promise<void> {
  await cacheInvalidate(KEYS.CATALOG);
  await cacheInvalidate(KEYS.VERSION);
}
