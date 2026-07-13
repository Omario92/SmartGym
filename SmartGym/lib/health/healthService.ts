/**
 * lib/health/healthService.ts
 *
 * Platform-aware health integration bridge.
 *
 * Architecture:
 *   iOS (Apple HealthKit)         → react-native-health
 *   Android (Health Connect)      → react-native-health-connect
 *   Other (web, emulator)         → noopHealthService (silent no-ops)
 *
 * Usage:
 *   import { healthService } from '@/lib/health/healthService';
 *   await healthService.saveWorkout(workout);
 */

import { Platform } from 'react-native';
import type {
  IHealthService,
  HealthPermission,
  HealthPermissionStatus,
  HealthWorkout,
  HealthMetric,
} from './types';
import { noopHealthService } from './noopHealthService';

// ─── iOS HealthKit adapter ────────────────────────────────────────────────────

class AppleHealthService implements IHealthService {
  private _rnh: typeof import('react-native-health') | null = null;
  private _initialized = false;

  private async _sdk(): Promise<any> {
    if (!this._rnh) {
      // react-native-health uses AppleHealthKit as a property of the module object
      this._rnh = require('react-native-health') as any;
    }
    // Access via default export or module root
    const mod = this._rnh as any;
    return mod.default ?? mod;
  }

  isAvailable(): boolean {
    return Platform.OS === 'ios';
  }

  async requestPermissions(
    permissions: HealthPermission[]
  ): Promise<Record<HealthPermission, HealthPermissionStatus>> {
    try {
      const sdk = await this._sdk();
      const Permissions = sdk.AppleHealthKit.Constants.Permissions;
      const readPerms = permissions.flatMap((p) => this._mapPermission(Permissions, p));

      await new Promise<void>((resolve, reject) => {
        sdk.AppleHealthKit.initHealthKit(
          { permissions: { read: readPerms, write: readPerms } },
          (err: Error | null) => { if (err) reject(err); else resolve(); }
        );
      });
      this._initialized = true;
      return Object.fromEntries(permissions.map((p) => [p, 'granted'])) as Record<HealthPermission, HealthPermissionStatus>;
    } catch {
      return Object.fromEntries(permissions.map((p) => [p, 'denied'])) as Record<HealthPermission, HealthPermissionStatus>;
    }
  }

  async checkPermissions(
    permissions: HealthPermission[]
  ): Promise<Record<HealthPermission, HealthPermissionStatus>> {
    return Object.fromEntries(
      permissions.map((p) => [p, 'notDetermined'])
    ) as Record<HealthPermission, HealthPermissionStatus>;
  }

  async saveWorkout(workout: HealthWorkout): Promise<boolean> {
    if (!this._initialized) return false;
    try {
      const sdk = await this._sdk();
      const options = {
        type: sdk.AppleHealthKit.Constants.Activities.FunctionalStrengthTraining,
        startDate: workout.startDate,
        endDate: workout.endDate,
        energyBurned: workout.activeCalories ?? 0,
        energyBurnedUnit: 'calorie' as const,
        distance: 0,
        distanceUnit: 'meter' as const,
      };
      await new Promise<void>((resolve, reject) => {
        sdk.AppleHealthKit.saveWorkout(options, (err: Error | null) => {
          if (err) reject(err); else resolve();
        });
      });
      return true;
    } catch {
      return false;
    }
  }

  async getRecentWorkouts(limit = 10): Promise<HealthWorkout[]> {
    if (!this._initialized) return [];
    try {
      const sdk = await this._sdk();
      return await new Promise((resolve, reject) => {
        sdk.AppleHealthKit.getSamples(
          {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
            limit,
            type: 'Workout',
          },
          (err: Error | null, results: any[]) => {
            if (err) { reject(err); return; }
            resolve(results.map((r) => ({
              duration: r.duration,
              activeCalories: r.calories,
              startDate: r.startDate,
              endDate: r.endDate,
              activityType: r.activityName ?? 'Other',
              sourceName: r.sourceName,
            })));
          }
        );
      });
    } catch {
      return [];
    }
  }

  async getLatestWeight(): Promise<HealthMetric | null> {
    if (!this._initialized) return null;
    try {
      const sdk = await this._sdk();
      return await new Promise((resolve) => {
        sdk.AppleHealthKit.getLatestWeight({}, (err: Error | null, result: any) => {
          if (err || !result) { resolve(null); return; }
          resolve({ value: result.value, unit: 'kg', date: result.startDate });
        });
      });
    } catch {
      return null;
    }
  }

  async getLatestBodyFat(): Promise<HealthMetric | null> {
    if (!this._initialized) return null;
    try {
      const sdk = await this._sdk();
      return await new Promise((resolve) => {
        sdk.AppleHealthKit.getLatestBodyFatPercentage({}, (err: Error | null, result: any) => {
          if (err || !result) { resolve(null); return; }
          resolve({ value: result.value, unit: '%', date: result.startDate });
        });
      });
    } catch {
      return null;
    }
  }

  private _mapPermission(Permissions: any, p: HealthPermission): string[] {
    const map: Record<HealthPermission, string[]> = {
      workout: [Permissions.Workout],
      steps: [Permissions.Steps],
      heartRate: [Permissions.HeartRate],
      activeCalories: [Permissions.ActiveEnergyBurned],
      weight: [Permissions.Weight],
      bodyFat: [Permissions.BodyFatPercentage],
    };
    return map[p] ?? [];
  }
}

// ─── Android Health Connect adapter ──────────────────────────────────────────

class AndroidHealthService implements IHealthService {
  isAvailable(): boolean {
    return Platform.OS === 'android';
  }

  async requestPermissions(
    permissions: HealthPermission[]
  ): Promise<Record<HealthPermission, HealthPermissionStatus>> {
    try {
      const { initialize, requestPermission, getSdkStatus, SdkAvailabilityStatus } = await import('react-native-health-connect');
      const status = await getSdkStatus();
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) throw new Error('SDK not available');
      
      await initialize();
      const hcPermissions = permissions.flatMap((p) => this._mapPermission(p));
      const granted = await requestPermission(hcPermissions as any);
      return Object.fromEntries(
        permissions.map((p) => [p, granted.some((g: any) => g.granted) ? 'granted' : 'denied'])
      ) as Record<HealthPermission, HealthPermissionStatus>;
    } catch {
      return Object.fromEntries(permissions.map((p) => [p, 'unavailable'])) as Record<HealthPermission, HealthPermissionStatus>;
    }
  }

  async checkPermissions(
    permissions: HealthPermission[]
  ): Promise<Record<HealthPermission, HealthPermissionStatus>> {
    try {
      const { initialize, getGrantedPermissions, getSdkStatus, SdkAvailabilityStatus } = await import('react-native-health-connect');
      const status = await getSdkStatus();
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) throw new Error('SDK not available');
      
      await initialize();
      const granted = await getGrantedPermissions();
      return Object.fromEntries(
        permissions.map((p) => {
          const required = this._mapPermission(p);
          const isGranted = required.every(req => 
            granted.some((g: any) => g.recordType === req.recordType && g.accessType === req.accessType)
          );
          return [p, isGranted ? 'granted' : 'notDetermined'];
        })
      ) as Record<HealthPermission, HealthPermissionStatus>;
    } catch {
      return Object.fromEntries(permissions.map((p) => [p, 'notDetermined'])) as Record<HealthPermission, HealthPermissionStatus>;
    }
  }

  async saveWorkout(workout: HealthWorkout): Promise<boolean> {
    try {
      const { insertRecords } = await import('react-native-health-connect');
      await insertRecords([{
        recordType: 'ExerciseSession',
        startTime: workout.startDate,
        endTime: workout.endDate,
        exerciseType: 2, // STRENGTH_TRAINING
      }] as any);
      return true;
    } catch {
      return false;
    }
  }

  async getRecentWorkouts(limit = 10): Promise<HealthWorkout[]> {
    try {
      const { readRecords } = await import('react-native-health-connect');
      const result = await (readRecords as any)('ExerciseSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date().toISOString(),
        },
      });
      return result.records.slice(0, limit).map((r: any) => ({
        duration: (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 1000,
        startDate: r.startTime,
        endDate: r.endTime,
        activityType: 'ExerciseSession',
      }));
    } catch {
      return [];
    }
  }

  async getLatestWeight(): Promise<HealthMetric | null> {
    try {
      const { readRecords } = await import('react-native-health-connect');
      const result = await (readRecords as any)('Weight', {
        timeRangeFilter: { operator: 'between', startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), endTime: new Date().toISOString() },
      });
      const last = result.records[result.records.length - 1] as any;
      return last ? { value: last.weight.inKilograms, unit: 'kg', date: last.time } : null;
    } catch {
      return null;
    }
  }

  async getLatestBodyFat(): Promise<HealthMetric | null> {
    try {
      const { readRecords } = await import('react-native-health-connect');
      const result = await (readRecords as any)('BodyFat', {
        timeRangeFilter: { operator: 'between', startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), endTime: new Date().toISOString() },
      });
      const last = result.records[result.records.length - 1] as any;
      return last ? { value: last.percentage * 100, unit: '%', date: last.time } : null;
    } catch {
      return null;
    }
  }

  private _mapPermission(p: HealthPermission): { accessType: string; recordType: string }[] {
    const map: Record<HealthPermission, { accessType: string; recordType: string }[]> = {
      workout: [{ accessType: 'write', recordType: 'ExerciseSession' }],
      steps: [{ accessType: 'read', recordType: 'Steps' }],
      heartRate: [{ accessType: 'read', recordType: 'HeartRate' }],
      activeCalories: [{ accessType: 'read', recordType: 'ActiveCaloriesBurned' }],
      weight: [{ accessType: 'read', recordType: 'Weight' }],
      bodyFat: [{ accessType: 'read', recordType: 'BodyFat' }],
    };
    return map[p] ?? [];
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function createHealthService(): IHealthService {
  if (Platform.OS === 'ios') return new AppleHealthService();
  if (Platform.OS === 'android') return new AndroidHealthService();
  return noopHealthService;
}

export const healthService: IHealthService = createHealthService();
