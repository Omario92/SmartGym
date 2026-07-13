/**
 * lib/health/noopHealthService.ts
 *
 * No-op implementation of IHealthService.
 * Used on platforms where health integration is unavailable
 * (web, simulator, or when react-native-health is not linked).
 *
 * All methods return safe defaults — no errors, no side effects.
 */

import type { IHealthService, HealthPermission, HealthPermissionStatus, HealthWorkout, HealthMetric } from './types';

export const noopHealthService: IHealthService = {
  isAvailable: () => false,

  requestPermissions: async (permissions: HealthPermission[]) =>
    Object.fromEntries(
      permissions.map((p) => [p, 'unavailable' as HealthPermissionStatus])
    ) as Record<HealthPermission, HealthPermissionStatus>,

  checkPermissions: async (permissions: HealthPermission[]) =>
    Object.fromEntries(
      permissions.map((p) => [p, 'unavailable' as HealthPermissionStatus])
    ) as Record<HealthPermission, HealthPermissionStatus>,

  saveWorkout: async (_workout: HealthWorkout): Promise<boolean> => false,

  getRecentWorkouts: async (_limit?: number): Promise<HealthWorkout[]> => [],

  getLatestWeight: async (): Promise<HealthMetric | null> => null,

  getLatestBodyFat: async (): Promise<HealthMetric | null> => null,
};
