/**
 * types/sync.ts
 *
 * Sync infrastructure domain types.
 * Used by syncStore, syncService, and all syncable entities.
 */

// ─── Status ───────────────────────────────────────────────────────────────────

export type SyncStatusValue = 'idle' | 'syncing' | 'done' | 'error';

/** Sync state attached to every syncable entity */
export interface SyncMetadata {
  /** Supabase row UUID — null until first sync */
  cloudId?: string;
  /** ISO timestamp of last mutation (local or remote) */
  updatedAt?: string;
  /** ISO timestamp if soft-deleted */
  deletedAt?: string | null;
  /**
   * local    — never synced to cloud
   * synced   — in sync with cloud
   * dirty    — local change not yet pushed
   * deleted  — soft-deleted, pending cloud deletion
   * conflict — cloud and local diverged — needs resolution
   */
  syncStatus?: 'local' | 'synced' | 'dirty' | 'deleted' | 'conflict';
}

// ─── Entity types ─────────────────────────────────────────────────────────────

export type SyncableEntityType =
  | 'routine'
  | 'session'
  | 'measure'
  | 'pr'
  | 'customExercise'
  | 'favorite';

// ─── Sync queue ───────────────────────────────────────────────────────────────

export interface SyncQueueItem {
  /** Unique queue entry ID */
  id: string;
  entityType: SyncableEntityType;
  entityId: string;
  operation: 'upsert' | 'delete';
  /** Full entity payload to push */
  payload: unknown;
  createdAt: string;
  /** Number of failed push attempts */
  retryCount: number;
  /** Last error message if any */
  lastError?: string;
  /** ISO timestamp of next retry — for exponential backoff */
  nextRetryAt?: string;
}

// ─── Sync result ──────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: string[];
  error?: string;
  durationMs?: number;
}

// ─── Cache entry wrapper ──────────────────────────────────────────────────────

export interface CacheEntry<T> {
  data: T;
  /** Version tag from the remote (CMS version string or Supabase etag) */
  version: string;
  /** ISO timestamp when data was fetched */
  fetchedAt: string;
  /** ISO timestamp after which cache is stale */
  expiresAt: string;
}

// ─── Conflict resolution ──────────────────────────────────────────────────────

export type ConflictStrategy = 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual';

export interface ConflictRecord {
  entityType: SyncableEntityType;
  entityId: string;
  localData: unknown;
  remoteData: unknown;
  detectedAt: string;
  strategy: ConflictStrategy;
}
