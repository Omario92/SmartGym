/**
 * lib/cache/cacheManager.ts
 *
 * Centralized cache utility for AsyncStorage.
 * Implements versioned, TTL-aware, stale-while-revalidate caching.
 *
 * Design:
 *   - Each cache key stores a CacheEntry<T> JSON blob
 *   - On read: always return cached data; trigger background revalidation if stale
 *   - On write: always update cache immediately
 *   - Version mismatch: invalidate and return null (forces fresh fetch)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CacheEntry } from '@/types/sync';

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_PREFIX = '@smartgym_cache:';

/** Default TTL values in milliseconds */
export const CACHE_TTL = {
  EXERCISES: 24 * 60 * 60 * 1000,   // 24 hours
  ROUTINES:  24 * 60 * 60 * 1000,   // 24 hours
  EXPLORE:   6 * 60 * 60 * 1000,    // 6 hours
  VERSION:   1 * 60 * 60 * 1000,    // 1 hour
} as const;

// ─── Core cache operations ────────────────────────────────────────────────────

/**
 * Write a value to cache with TTL and version tag.
 */
export async function cacheWrite<T>(
  key: string,
  data: T,
  ttlMs: number,
  version: string = '1'
): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    version,
    fetchedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

/**
 * Read a value from cache.
 * Returns null if not found or version mismatch.
 * Returns the entry regardless of TTL — callers decide if it's stale.
 */
export async function cacheRead<T>(
  key: string,
  expectedVersion?: string
): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;

    // Version mismatch → treat as cache miss (invalidate)
    if (expectedVersion && entry.version !== expectedVersion) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry;
  } catch {
    return null;
  }
}

/**
 * Check if a cache entry is still fresh (within TTL).
 */
export function isCacheFresh(entry: CacheEntry<unknown>): boolean {
  return new Date(entry.expiresAt).getTime() > Date.now();
}

/**
 * Check if a cache entry exists and is fresh.
 */
export async function isCacheValid(key: string, expectedVersion?: string): Promise<boolean> {
  const entry = await cacheRead(key, expectedVersion);
  return entry !== null && isCacheFresh(entry);
}

/**
 * Delete a specific cache entry.
 */
export async function cacheInvalidate(key: string): Promise<void> {
  await AsyncStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Delete all SmartGym cache entries.
 */
export async function cacheInvalidateAll(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));
  if (cacheKeys.length > 0) {
    await AsyncStorage.multiRemove(cacheKeys);
  }
}

/**
 * Get total cache size in bytes (approximate).
 */
export async function getCacheSize(): Promise<number> {
  const allKeys = await AsyncStorage.getAllKeys();
  const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));
  let total = 0;
  for (const key of cacheKeys) {
    const val = await AsyncStorage.getItem(key);
    if (val) total += val.length * 2; // UTF-16
  }
  return total;
}

// ─── Stale-while-revalidate ──────────────────────────────────────────────────

/**
 * Stale-while-revalidate pattern:
 * 1. Return cached data immediately (if any)
 * 2. If stale, trigger background refresh (does not block)
 * 3. On next read, the fresh data is available
 */
export async function getWithSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
  version?: string
): Promise<T> {
  const entry = await cacheRead<T>(key, version);

  if (entry) {
    // Trigger background revalidation if stale
    if (!isCacheFresh(entry)) {
      // Fire and forget — do not await
      fetcher()
        .then((fresh) => cacheWrite(key, fresh, ttlMs, version))
        .catch(() => { /* silent fail */ });
    }
    return entry.data;
  }

  // No cache — must fetch synchronously
  const fresh = await fetcher();
  await cacheWrite(key, fresh, ttlMs, version);
  return fresh;
}
