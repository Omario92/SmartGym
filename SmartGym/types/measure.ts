/**
 * types/measure.ts
 *
 * Body measurement domain types.
 */

import type { SyncMetadata } from './sync';

export interface BodyMeasure {
  id: string;
  date: string; // ISO date string
  // ── Measurements ────────────────────────────────────────────────────────
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  calves?: number;
  shoulders?: number;
  neck?: number;
  /** 'metric' = kg/cm, 'imperial' = lbs/in */
  unit: 'metric' | 'imperial';
  /** Optional note for this measurement entry */
  note?: string;
  // ── Sync ────────────────────────────────────────────────────────────────
  cloudId?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  syncStatus?: SyncMetadata['syncStatus'];
}

/** Measurement field keys (excludes metadata fields) */
export type MeasureField = Exclude<
  keyof BodyMeasure,
  'id' | 'date' | 'unit' | 'note' | 'cloudId' | 'updatedAt' | 'deletedAt' | 'syncStatus'
>;

export interface MeasureFieldMeta {
  key: MeasureField;
  label: string;
  unit: (system: 'metric' | 'imperial') => string;
  icon: string;
}
