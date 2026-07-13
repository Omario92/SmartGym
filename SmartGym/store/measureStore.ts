/**
 * store/measureStore.ts
 *
 * Manages body measurement history.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyMeasure } from '@/types/measure';

interface MeasureStoreState {
  measures: BodyMeasure[];

  addMeasure: (measure: BodyMeasure) => void;
  updateMeasure: (id: string, updates: Partial<BodyMeasure>) => void;
  deleteMeasure: (id: string, isAuthenticated: boolean) => void;

  mergeCloudMeasures: (measures: BodyMeasure[]) => void;
  clearUserData: () => void;
}

export const useMeasureStore = create<MeasureStoreState>()(
  persist(
    immer((set) => ({
      measures: [],

      addMeasure: (measure) =>
        set((state) => {
          state.measures.unshift({
            ...measure,
            syncStatus: 'dirty',
            updatedAt: new Date().toISOString(),
          });
        }),

      updateMeasure: (id, updates) =>
        set((state) => {
          const idx = state.measures.findIndex((m) => m.id === id);
          if (idx !== -1) {
            Object.assign(state.measures[idx], updates, {
              syncStatus: 'dirty',
              updatedAt: new Date().toISOString(),
            });
          }
        }),

      deleteMeasure: (id, isAuthenticated) =>
        set((state) => {
          if (isAuthenticated) {
            const m = state.measures.find((m) => m.id === id);
            if (m) {
              m.deletedAt = new Date().toISOString();
              m.syncStatus = 'deleted';
            }
          } else {
            state.measures = state.measures.filter((m) => m.id !== id);
          }
        }),

      mergeCloudMeasures: (cloudMeasures) =>
        set((state) => {
          const map = new Map(state.measures.map((m) => [m.id, m]));
          cloudMeasures.forEach((cm) => {
            const existing = map.get(cm.id);
            if (!existing || new Date(cm.updatedAt ?? 0) > new Date(existing.updatedAt ?? 0)) {
              map.set(cm.id, { ...cm, syncStatus: 'synced' });
            }
          });
          state.measures = Array.from(map.values())
            .filter((m) => !m.deletedAt)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }),

      clearUserData: () =>
        set((state) => { state.measures = []; }),
    })),
    {
      name: 'smartgym-measures-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ measures: state.measures }),
    }
  )
);

export const selectMeasures = (s: MeasureStoreState) =>
  s.measures.filter((m) => !m.deletedAt);
export const selectDirtyMeasures = (s: MeasureStoreState) =>
  s.measures.filter((m) => m.syncStatus === 'dirty' || m.syncStatus === 'deleted');
