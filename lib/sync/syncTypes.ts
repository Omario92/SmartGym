export type SyncStatus = 'idle' | 'pulling' | 'pushing' | 'merging' | 'done' | 'error' | 'offline';

export interface SyncMetadata {
  syncStatus?: 'local' | 'synced' | 'dirty' | 'deleted' | 'conflict';
  lastSyncedAt?: string;
  cloudId?: string;
  deletedAt?: string | null;
}

export interface SyncStateRow {
  id: string;
  user_id: string;
  entity: string;
  last_pulled_at: string | null;
  last_pushed_at: string | null;
  cursor: string | null;
  metadata: any;
  updated_at: string;
}

export interface SyncResult {
  status: SyncStatus;
  entitiesSynced: number;
  error?: string;
}
