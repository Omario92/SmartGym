import type { WorkoutSession, BodyMeasure } from '@/store';

export type HealthPermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface HealthPermissionResult {
  granted: boolean;
  error?: string;
}

export interface HealthWriteResult {
  success: boolean;
  recordId?: string;
  error?: string;
}

export interface HealthWorkoutSummary {
  recordId: string;
  startDate: string;
  endDate: string;
  source: string;
}

export interface HealthBodyMassSample {
  recordId: string;
  date: string;
  weightKg: number;
  source: string;
}

export interface HealthService {
  isAvailable(): Promise<boolean>;
  getPermissionStatus(): Promise<HealthPermissionStatus>;
  requestPermissions(): Promise<HealthPermissionResult>;
  writeWorkoutSession(session: WorkoutSession): Promise<HealthWriteResult>;
  readRecentWorkouts(startDate: string, endDate: string): Promise<HealthWorkoutSummary[]>;
  writeBodyMass?(measure: BodyMeasure): Promise<HealthWriteResult>;
  readBodyMass?(startDate: string, endDate: string): Promise<HealthBodyMassSample[]>;
}
