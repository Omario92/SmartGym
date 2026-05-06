/**
 * lib/cache/routineCache.ts
 *
 * Default / explore routine cache — not for user routines (those live in Zustand).
 */

import type { Routine } from '@/types/routine';
import { cacheRead, cacheWrite, cacheInvalidate, isCacheFresh, CACHE_TTL } from './cacheManager';

const KEYS = {
  EXPLORE:  'routines:explore',
  DEFAULTS: 'routines:defaults',
} as const;

export interface RoutineCachePayload {
  routines: Routine[];
  version: string;
  fetchedAt: string;
}

export async function cacheExploreRoutines(
  routines: Routine[],
  version: string
): Promise<void> {
  const payload: RoutineCachePayload = { routines, version, fetchedAt: new Date().toISOString() };
  await cacheWrite(KEYS.EXPLORE, payload, CACHE_TTL.EXPLORE, version);
}

export async function getCachedExploreRoutines(
  expectedVersion?: string
): Promise<RoutineCachePayload | null> {
  const entry = await cacheRead<RoutineCachePayload>(KEYS.EXPLORE, expectedVersion);
  return entry?.data ?? null;
}

export async function getCachedExploreRoutinesOffline(): Promise<Routine[]> {
  const entry = await cacheRead<RoutineCachePayload>(KEYS.EXPLORE);
  return entry?.data.routines ?? [];
}

export async function isExploreRoutineCacheFresh(expectedVersion?: string): Promise<boolean> {
  const entry = await cacheRead<RoutineCachePayload>(KEYS.EXPLORE, expectedVersion);
  return entry !== null && isCacheFresh(entry);
}

export async function invalidateRoutineCache(): Promise<void> {
  await cacheInvalidate(KEYS.EXPLORE);
  await cacheInvalidate(KEYS.DEFAULTS);
}
