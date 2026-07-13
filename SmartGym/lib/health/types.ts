/**
 * lib/health/types.ts
 *
 * Platform-agnostic health data types.
 * Used by healthService.ts abstraction layer.
 */

// ─── Permissions ──────────────────────────────────────────────────────────────

export type HealthPermission =
  | 'workout'
  | 'steps'
  | 'heartRate'
  | 'activeCalories'
  | 'weight'
  | 'bodyFat';

export type HealthPermissionStatus = 'granted' | 'denied' | 'notDetermined' | 'unavailable';

// ─── Data types ───────────────────────────────────────────────────────────────

export interface HealthWorkout {
  /** ISO duration in seconds */
  duration: number;
  /** Active calories burned */
  activeCalories?: number;
  /** ISO start date */
  startDate: string;
  /** ISO end date */
  endDate: string;
  /** Activity type identifier */
  activityType: string;
  /** Source app */
  sourceName?: string;
}

export interface HealthMetric {
  value: number;
  unit: string;
  date: string;
}

// ─── Service interface ────────────────────────────────────────────────────────

export interface IHealthService {
  /** True if health integration is available on this platform */
  isAvailable(): boolean;

  /** Request permissions for given data types */
  requestPermissions(permissions: HealthPermission[]): Promise<Record<HealthPermission, HealthPermissionStatus>>;

  /** Check current permission status */
  checkPermissions(permissions: HealthPermission[]): Promise<Record<HealthPermission, HealthPermissionStatus>>;

  /**
   * Write a completed workout to the health store.
   * Returns true if successful.
   */
  saveWorkout(workout: HealthWorkout): Promise<boolean>;

  /** Read recent workouts from health store */
  getRecentWorkouts(limit?: number): Promise<HealthWorkout[]>;

  /** Read latest body weight measurement */
  getLatestWeight(): Promise<HealthMetric | null>;

  /** Read latest body fat percentage */
  getLatestBodyFat(): Promise<HealthMetric | null>;
}
