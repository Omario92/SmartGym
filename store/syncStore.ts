/**
 * store/syncStore.ts
 *
 * Manages sync state: status, queue, last sync timestamp.
 * Drives SyncProvider UI indicators.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SyncStatusValue, SyncQueueItem } from '@/types/sync';

interface SyncStoreState {
  syncStatus: SyncStatusValue;
  syncQueue: SyncQueueItem[];
  lastSyncAt: string | null;
  localSyncDone: boolean;
  lastSyncError: string | null;

  setSyncStatus: (status: SyncStatusValue) => void;
  setLastSyncAt: (at: string) => void;
  setLocalSyncDone: (done: boolean) => void;
  setLastSyncError: (error: string | null) => void;

  addToQueue: (item: SyncQueueItem) => void;
  removeFromQueue: (id: string) => void;
  incrementRetry: (id: string, error?: string) => void;
  clearQueue: () => void;

  reset: () => void;
}

export const useSyncStore = create<SyncStoreState>()(
  persist(
    immer((set) => ({
      syncStatus: 'idle',
      syncQueue: [],
      lastSyncAt: null,
      localSyncDone: false,
      lastSyncError: null,

      setSyncStatus: (status) =>
        set((state) => { state.syncStatus = status; }),

      setLastSyncAt: (at) =>
        set((state) => { state.lastSyncAt = at; }),

      setLocalSyncDone: (done) =>
        set((state) => { state.localSyncDone = done; }),

      setLastSyncError: (error) =>
        set((state) => { state.lastSyncError = error; }),

      addToQueue: (item) =>
        set((state) => {
          const exists = state.syncQueue.some((q) => q.id === item.id);
          if (!exists) state.syncQueue.push(item);
        }),

      removeFromQueue: (id) =>
        set((state) => {
          state.syncQueue = state.syncQueue.filter((q) => q.id !== id);
        }),

      incrementRetry: (id, error) =>
        set((state) => {
          const item = state.syncQueue.find((q) => q.id === id);
          if (item) {
            item.retryCount += 1;
            if (error) item.lastError = error;
            // Exponential backoff: 1s, 2s, 4s...
            const delayMs = 1000 * Math.pow(2, item.retryCount - 1);
            item.nextRetryAt = new Date(Date.now() + delayMs).toISOString();
          }
        }),

      clearQueue: () =>
        set((state) => { state.syncQueue = []; }),

      reset: () =>
        set((state) => {
          state.syncStatus = 'idle';
          state.syncQueue = [];
          state.lastSyncAt = null;
          state.localSyncDone = false;
          state.lastSyncError = null;
        }),
    })),
    {
      name: 'smartgym-sync-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        syncQueue: state.syncQueue,
        lastSyncAt: state.lastSyncAt,
        localSyncDone: state.localSyncDone,
      }),
    }
  )
);

export const selectSyncStatus = (s: SyncStoreState) => s.syncStatus;
export const selectSyncQueue = (s: SyncStoreState) => s.syncQueue;
export const selectLastSyncAt = (s: SyncStoreState) => s.lastSyncAt;
