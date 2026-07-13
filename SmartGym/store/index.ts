/**
 * SmartGym — Global Zustand store
 * Manages routines, workout sessions, history, measures, and app state.
 * Persisted to AsyncStorage via zustand/middleware's `persist` adapter.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomExercise } from '@/lib/exercises';
import { type OneRMFormula, calculate1RM } from '@/lib/1rm';
import type { AuthUser } from '@/lib/supabaseTypes';
import type { AIUserProfile, AISmartWeeklyPlan } from '@/services/ai/types';

// ─── Draft exercise (unsaved form state) ─────────────────────────────────────
export interface CustomExerciseDraft {
  name: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  description?: string;
  imageUrl?: string;
  savedAt: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SetLog {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  note?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  restSeconds?: number;
  sets: SetLog[];
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  createdAt: string;
  lastPerformed?: string;
  color: string;
  estimatedDuration?: number; // minutes
  category?: string;
  /** Local-only: hidden from the main list but not deleted (recoverable). */
  archived?: boolean;
  // Sync metadata
  cloudId?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  syncStatus?: 'local' | 'synced' | 'dirty' | 'deleted' | 'conflict';
}

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps?: number;
  weight?: number;
  restSeconds?: number;
  note?: string;
}

export interface WorkoutSession {
  id: string;
  routineId?: string;
  routineName: string;
  startedAt: string;
  finishedAt?: string;
  duration?: number; // seconds
  exercises: ExerciseLog[];
  totalVolume?: number; // kg * reps
  totalSets?: number;
  note?: string;
  // Sync metadata
  cloudId?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  syncStatus?: 'local' | 'synced' | 'dirty' | 'deleted' | 'conflict';
}

export interface ActiveWorkout {
  routineId?: string;
  routineName: string;
  startedAt: string;
  exercises: ExerciseLog[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  isResting: boolean;
  restSecondsLeft: number;
  elapsedSeconds: number;
}

export interface BodyMeasure {
  id: string;
  date: string;
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
  unit: 'metric' | 'imperial';
  // Sync metadata
  cloudId?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  syncStatus?: 'local' | 'synced' | 'dirty' | 'deleted' | 'conflict';
}

export interface AppSettings {
  weightUnit: 'kg' | 'lbs';
  theme: 'dark';
  restTimerDefault: number; // seconds
  hapticFeedback: boolean;
  soundEnabled: boolean;
  notifications: boolean;
  keepScreenOn: boolean;
  showTour: boolean;
  isPremium: boolean;
  language: string;
  oneRmFormula: OneRMFormula;
  // AI Smart Trainer
  geminiApiKey?: string;
  aiProfile?: AIUserProfile;
}

export interface ExercisePR {
  oneRM: number;
  date: string;
  weight: number;
  reps: number;
  formula: OneRMFormula;
  bestSetDate: string;
  // Sync metadata
  cloudId?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  syncStatus?: 'local' | 'synced' | 'dirty' | 'deleted' | 'conflict';
}

// ─── Store Interface ──────────────────────────────────────────────────────────

export interface SmartGymState {
  // App
  settings: AppSettings;
  isFirstLaunch: boolean;
  isTourVisible: boolean;
  tourStep: number;

  // Routines
  routines: Routine[];

  // Custom exercises
  customExercises: CustomExercise[];

  // Active workout (runtime only — not persisted)
  activeWorkout: ActiveWorkout | null;

  // History
  sessions: WorkoutSession[];

  // Measures
  measures: BodyMeasure[];

  // Favorites (exercise IDs — both default + custom)
  favoriteExerciseIds: string[];

  // Draft custom exercise (unsaved form)
  customExerciseDraft: CustomExerciseDraft | null;

  // 1RM Personal Records mapped by exerciseId
  exercisePRs: Record<string, ExercisePR>;

  // ── Auth (Supabase) ──────────────────────────────────────────────────────
  authUser: AuthUser | null;
  syncStatus: 'idle' | 'syncing' | 'done' | 'error';
  localSyncDone: boolean; // true once local→cloud migration has run

  // ── AI cache (runtime only — not persisted) ──────────────────────────────
  aiWeeklyPlanCache: { generatedAt: string; data: AISmartWeeklyPlan } | null;

  // ─── Actions ─────────────────────────────────────────────────────────

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateOneRmFormula: (formula: OneRMFormula) => void;
  setFirstLaunch: (value: boolean) => void;
  startTour: () => void;
  endTour: () => void;
  nextTourStep: () => void;
  setTourStep: (step: number) => void;

  // Routines
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  /** Permanently drop a routine from local state (used after a cloud hard-delete). */
  removeRoutineLocal: (id: string) => void;
  duplicateRoutine: (id: string) => void;
  archiveRoutine: (id: string) => void;
  unarchiveRoutine: (id: string) => void;

  // Custom Exercises
  addCustomExercise: (exercise: CustomExercise) => void;
  updateCustomExercise: (id: string, updates: Partial<CustomExercise>) => void;
  deleteCustomExercise: (id: string) => void;
  duplicateCustomExercise: (id: string) => void;

  // Favorites
  toggleFavoriteExercise: (exerciseId: string) => void;
  isFavorite: (exerciseId: string) => boolean;

  // Draft
  saveCustomExerciseDraft: (draft: CustomExerciseDraft) => void;
  clearCustomExerciseDraft: () => void;

  // Workout
  startWorkout: (routine: Routine | { name: string; exercises: ExerciseLog[] }) => void;
  updateSet: (exerciseIndex: number, setIndex: number, data: Partial<SetLog>) => void;
  addSet: (exerciseIndex: number) => void;
  updateExerciseRestTime: (exerciseIndex: number, restSeconds: number) => void;
  nextExercise: () => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  updateElapsed: (seconds: number) => void;
  startRest: (seconds: number) => void;
  skipRest: () => void;

  // History
  addSession: (session: WorkoutSession) => void;
  deleteSession: (id: string) => void;
  clearHistory: () => void; // ← NEW: wipe all sessions

  // Measures
  addMeasure: (measure: BodyMeasure) => void;
  updateMeasure: (id: string, updates: Partial<BodyMeasure>) => void;
  deleteMeasure: (id: string) => void;

  // Auth
  setAuthUser: (user: AuthUser | null) => void;
  clearAuthUser: () => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'done' | 'error') => void;
  setLocalSyncDone: (done: boolean) => void;

  // Sync Actions
  replaceExerciseIds: (idMap: Record<string, string>) => void;
  markEntityDirty: (entityType: 'routine' | 'session' | 'measure' | 'pr' | 'customExercise', id: string) => void;
  markEntitySynced: (entityType: 'routine' | 'session' | 'measure' | 'pr' | 'customExercise', id: string, cloudId?: string) => void;
  mergeCloudRoutines: (routines: Routine[]) => void;
  mergeCloudSessions: (sessions: WorkoutSession[]) => void;
  mergeCloudMeasures: (measures: BodyMeasure[]) => void;
  mergeCloudPRs: (prs: Record<string, ExercisePR>) => void;
  mergeCloudFavorites: (favoriteIds: string[]) => void;
  softDeleteRoutine: (id: string) => void;
  softDeleteSession: (id: string) => void;
  softDeleteMeasure: (id: string) => void;

  // AI cache
  setAIWeeklyPlanCache: (data: AISmartWeeklyPlan) => void;
  clearAIWeeklyPlanCache: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialSettings: AppSettings = {
  weightUnit: 'kg',
  theme: 'dark',
  restTimerDefault: 90,
  hapticFeedback: true,
  soundEnabled: true,
  notifications: true,
  keepScreenOn: true,
  showTour: true,
  isPremium: true, // Bypass premium for testing
  language: 'en',
  oneRmFormula: 'epley',
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY, // Loaded from .env
};

// Sample routines — only used on first ever launch (before persist kicks in)
const sampleRoutines: Routine[] = [
  {
    id: 'push_day',
    name: 'Push Day',
    description: 'Chest, shoulders & triceps',
    color: '#FF6B6B',
    category: 'strength',
    estimatedDuration: 60,
    createdAt: new Date().toISOString(),
    exercises: [
      { exerciseId: 'bench_press', exerciseName: 'Bench Press', sets: 4, reps: 8, weight: 80 },
      { exerciseId: 'incline_press', exerciseName: 'Incline Bench Press', sets: 3, reps: 10, weight: 60 },
      { exerciseId: 'overhead_press', exerciseName: 'Overhead Press', sets: 3, reps: 10, weight: 50 },
      { exerciseId: 'lateral_raises', exerciseName: 'Lateral Raises', sets: 4, reps: 15, weight: 12 },
      { exerciseId: 'tricep_dips', exerciseName: 'Tricep Dips', sets: 3, reps: 12 },
    ],
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<SmartGymState>()(
  persist(
    immer((set, get) => ({
      // ── State ──
      settings: initialSettings,
      isFirstLaunch: true,
      isTourVisible: false,
      tourStep: 0,
      routines: sampleRoutines,
      customExercises: [],
      activeWorkout: null,
      sessions: [],
      measures: [],
      favoriteExerciseIds: [],
      customExerciseDraft: null,
      exercisePRs: {},
      authUser: null,
      syncStatus: 'idle',
      localSyncDone: false,
      aiWeeklyPlanCache: null,

      // ── Settings ──
      updateSettings: (updates) =>
        set((state) => {
          Object.assign(state.settings, updates);
        }),
      
      updateOneRmFormula: (formula) =>
        set((state) => {
          state.settings.oneRmFormula = formula;
        }),

      setFirstLaunch: (value) =>
        set((state) => {
          state.isFirstLaunch = value;
        }),

      startTour: () =>
        set((state) => {
          state.isTourVisible = true;
          state.tourStep = 0;
        }),

      endTour: () =>
        set((state) => {
          state.isTourVisible = false;
          state.tourStep = 0;
          state.settings.showTour = false;
        }),

      nextTourStep: () =>
        set((state) => {
          state.tourStep += 1;
        }),

      setTourStep: (step) =>
        set((state) => {
          state.tourStep = step;
        }),

      // ── Routines ──
      addRoutine: (routine) =>
        set((state) => {
          state.routines.push({ ...routine, syncStatus: 'dirty', updatedAt: new Date().toISOString() });
        }),

      updateRoutine: (id, updates) =>
        set((state) => {
          const idx = state.routines.findIndex((r) => r.id === id);
          if (idx !== -1) {
            Object.assign(state.routines[idx], updates, { syncStatus: 'dirty', updatedAt: new Date().toISOString() });
          }
        }),

      deleteRoutine: (id) =>
        set((state) => {
          const r = state.routines.find((r) => r.id === id);
          if (r && state.authUser && r.cloudId) {
            // Signed-in and already in the cloud: keep a tombstone so sync can
            // hard-delete it from the database, then it's purged locally.
            r.deletedAt = new Date().toISOString();
            r.syncStatus = 'deleted';
          } else {
            // Local-only (never synced) or signed-out: remove immediately.
            state.routines = state.routines.filter((r) => r.id !== id);
          }
        }),

      removeRoutineLocal: (id) =>
        set((state) => {
          state.routines = state.routines.filter((r) => r.id !== id);
        }),

      duplicateRoutine: (id) =>
        set((state) => {
          const routine = state.routines.find((r) => r.id === id);
          if (routine) {
            state.routines.push({
              ...routine,
              id: Date.now().toString(),
              name: `${routine.name} (Copy)`,
              createdAt: new Date().toISOString(),
              lastPerformed: undefined,
              archived: false,
            });
          }
        }),

      archiveRoutine: (id) =>
        set((state) => {
          const r = state.routines.find((r) => r.id === id);
          if (r) {
            r.archived = true;
            r.syncStatus = 'dirty';
            r.updatedAt = new Date().toISOString();
          }
        }),

      unarchiveRoutine: (id) =>
        set((state) => {
          const r = state.routines.find((r) => r.id === id);
          if (r) {
            r.archived = false;
            r.syncStatus = 'dirty';
            r.updatedAt = new Date().toISOString();
          }
        }),

      // ── Custom Exercises ──
      addCustomExercise: (exercise) =>
        set((state) => {
          state.customExercises.push(exercise);
        }),

      updateCustomExercise: (id, updates) =>
        set((state) => {
          const idx = state.customExercises.findIndex((e) => e.id === id);
          if (idx !== -1) Object.assign(state.customExercises[idx], updates);
        }),

      deleteCustomExercise: (id) =>
        set((state) => {
          state.customExercises = state.customExercises.filter((e) => e.id !== id);
          state.favoriteExerciseIds = state.favoriteExerciseIds.filter((fid) => fid !== id);
        }),

      duplicateCustomExercise: (id) =>
        set((state) => {
          const original = state.customExercises.find((e) => e.id === id);
          if (original) {
            const newId = `${original.id}_copy_${Date.now().toString(36)}`;
            state.customExercises.push({
              ...original,
              id: newId,
              name: `${original.name} (Copy)`,
              createdAt: new Date().toISOString(),
            });
          }
        }),

      toggleFavoriteExercise: (exerciseId) =>
        set((state) => {
          const idx = state.favoriteExerciseIds.indexOf(exerciseId);
          if (idx === -1) {
            state.favoriteExerciseIds.push(exerciseId);
          } else {
            state.favoriteExerciseIds.splice(idx, 1);
          }
        }),

      isFavorite: (exerciseId) =>
        get().favoriteExerciseIds.includes(exerciseId),

      saveCustomExerciseDraft: (draft) =>
        set((state) => {
          state.customExerciseDraft = draft;
        }),

      clearCustomExerciseDraft: () =>
        set((state) => {
          state.customExerciseDraft = null;
        }),

      // ── Workout ──
      startWorkout: (input) => {
        const isRoutine = 'exercises' in input && !Array.isArray((input as any).exercises[0]?.sets);
        if (isRoutine && 'id' in input) {
          const routine = input as Routine;
          const exercises: ExerciseLog[] = routine.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
            restSeconds: e.restSeconds,
            sets: Array.from({ length: e.sets }, (_, i) => ({
              id: `${Date.now()}-${i}`,
              weight: e.weight ?? 0,
              reps: e.reps ?? 0,
              completed: false,
            })),
          }));

          set((state) => {
            state.activeWorkout = {
              routineId: routine.id,
              routineName: routine.name,
              startedAt: new Date().toISOString(),
              exercises,
              currentExerciseIndex: 0,
              currentSetIndex: 0,
              isResting: false,
              restSecondsLeft: 0,
              elapsedSeconds: 0,
            };
          });

          // Mark routine as last performed
          get().updateRoutine(routine.id, { lastPerformed: new Date().toISOString() });
        }
      },

      updateSet: (exerciseIndex, setIndex, data) =>
        set((state) => {
          if (state.activeWorkout) {
            Object.assign(state.activeWorkout.exercises[exerciseIndex].sets[setIndex], data);
          }
        }),

      addSet: (exerciseIndex) =>
        set((state) => {
          if (state.activeWorkout) {
            const exercise = state.activeWorkout.exercises[exerciseIndex];
            const lastSet = exercise.sets[exercise.sets.length - 1];
            exercise.sets.push({
              id: Date.now().toString(),
              weight: lastSet?.weight ?? 0,
              reps: lastSet?.reps ?? 0,
              completed: false,
            });
          }
        }),

      updateExerciseRestTime: (exerciseIndex, restSeconds) =>
        set((state) => {
          if (state.activeWorkout) {
            state.activeWorkout.exercises[exerciseIndex].restSeconds = restSeconds;
          }
        }),

      nextExercise: () =>
        set((state) => {
          if (state.activeWorkout) {
            state.activeWorkout.currentExerciseIndex += 1;
            state.activeWorkout.currentSetIndex = 0;
          }
        }),

      finishWorkout: () => {
        const workout = get().activeWorkout;
        if (!workout) return;

        const finishedAt = new Date().toISOString();
        const totalSets = workout.exercises.reduce(
          (acc, e) => acc + e.sets.filter((s) => s.completed).length,
          0
        );
        const totalVolume = workout.exercises.reduce(
          (acc, e) =>
            acc + e.sets.filter((s) => s.completed).reduce((a, s) => a + s.weight * s.reps, 0),
          0
        );

        const session: WorkoutSession = {
          id: Date.now().toString(),
          routineId: workout.routineId,
          routineName: workout.routineName,
          startedAt: workout.startedAt,
          finishedAt,
          duration: workout.elapsedSeconds,
          exercises: workout.exercises,
          totalVolume,
          totalSets,
        };

        set((state) => {
          // Process 1RM PRs for each exercise in this session
          workout.exercises.forEach((ex) => {
            let sessionMax1RM = 0;
            let bestWeight = 0;
            let bestReps = 0;
            
            ex.sets.forEach((s) => {
              if (s.completed && s.weight > 0 && s.reps > 0) {
                const oneRM = calculate1RM(s.weight, s.reps, state.settings.oneRmFormula);
                if (oneRM > sessionMax1RM) {
                  sessionMax1RM = oneRM;
                  bestWeight = s.weight;
                  bestReps = s.reps;
                }
              }
            });

            if (sessionMax1RM > 0) {
              const currentPR = state.exercisePRs[ex.exerciseId];
              if (!currentPR || sessionMax1RM > currentPR.oneRM) {
                state.exercisePRs[ex.exerciseId] = {
                  oneRM: sessionMax1RM,
                  date: session.startedAt,
                  weight: bestWeight,
                  reps: bestReps,
                  formula: state.settings.oneRmFormula,
                  bestSetDate: session.startedAt,
                };
              }
            }
          });

          state.sessions.unshift(session);
          state.activeWorkout = null;
        });
      },

      cancelWorkout: () =>
        set((state) => {
          state.activeWorkout = null;
        }),

      updateElapsed: (seconds) =>
        set((state) => {
          if (state.activeWorkout) {
            state.activeWorkout.elapsedSeconds = seconds;
          }
        }),

      startRest: (seconds) =>
        set((state) => {
          if (state.activeWorkout) {
            state.activeWorkout.isResting = true;
            state.activeWorkout.restSecondsLeft = seconds;
          }
        }),

      skipRest: () =>
        set((state) => {
          if (state.activeWorkout) {
            state.activeWorkout.isResting = false;
            state.activeWorkout.restSecondsLeft = 0;
          }
        }),

      // ── History ──
      addSession: (session) =>
        set((state) => {
          state.sessions.unshift({ ...session, syncStatus: 'dirty', updatedAt: new Date().toISOString() });
        }),

      deleteSession: (id) =>
        set((state) => {
          const s = state.sessions.find((s) => s.id === id);
          if (s && state.authUser) {
            s.deletedAt = new Date().toISOString();
            s.syncStatus = 'deleted';
          } else {
            state.sessions = state.sessions.filter((s) => s.id !== id);
          }
        }),

      /** Wipe all workout history */
      clearHistory: () =>
        set((state) => {
          state.sessions = [];
        }),

      // ── Measures ──
      addMeasure: (measure) =>
        set((state) => {
          state.measures.unshift({ ...measure, syncStatus: 'dirty', updatedAt: new Date().toISOString() });
        }),

      updateMeasure: (id, updates) =>
        set((state) => {
          const idx = state.measures.findIndex((m) => m.id === id);
          if (idx !== -1) {
            Object.assign(state.measures[idx], updates, { syncStatus: 'dirty', updatedAt: new Date().toISOString() });
          }
        }),

      deleteMeasure: (id) =>
        set((state) => {
          const m = state.measures.find((m) => m.id === id);
          if (m && state.authUser) {
            m.deletedAt = new Date().toISOString();
            m.syncStatus = 'deleted';
          } else {
            state.measures = state.measures.filter((m) => m.id !== id);
          }
        }),

      // ── Auth ──────────────────────────────────────────────────────────────

      setAuthUser: (user) =>
        set((state) => {
          state.authUser = user;
        }),

      clearAuthUser: () =>
        set((state) => {
          state.authUser = null;
          state.syncStatus = 'idle';
          state.localSyncDone = false;
          // Restore to clean guest state
          state.routines = [];
          state.customExercises = [];
          state.sessions = [];
          state.measures = [];
          state.favoriteExerciseIds = [];
          state.exercisePRs = {};
        }),

      setSyncStatus: (status) =>
        set((state) => {
          state.syncStatus = status;
        }),

      setLocalSyncDone: (done) =>
        set((state) => {
          state.localSyncDone = done;
        }),

      // ── Sync Actions ────────────────────────────────────────────────────────
      replaceExerciseIds: (idMap) =>
        set((state) => {
          // Update custom exercises themselves
          state.customExercises.forEach((ex) => {
            if (idMap[ex.id]) {
              ex.id = idMap[ex.id];
              ex.cloudId = idMap[ex.id];
              ex.syncStatus = 'synced';
            }
          });

          // Update routines
          state.routines.forEach((routine) => {
            routine.exercises.forEach((ex) => {
              if (idMap[ex.exerciseId]) {
                ex.exerciseId = idMap[ex.exerciseId];
              }
            });
            routine.syncStatus = 'dirty';
            routine.updatedAt = new Date().toISOString();
          });

          // Update active workout
          if (state.activeWorkout) {
            state.activeWorkout.exercises.forEach((ex) => {
              if (idMap[ex.exerciseId]) {
                ex.exerciseId = idMap[ex.exerciseId];
              }
            });
          }

          // Update sessions
          state.sessions.forEach((session) => {
            session.exercises.forEach((ex) => {
              if (idMap[ex.exerciseId]) {
                ex.exerciseId = idMap[ex.exerciseId];
              }
            });
            session.syncStatus = 'dirty';
            session.updatedAt = new Date().toISOString();
          });

          // Update favorites
          state.favoriteExerciseIds = state.favoriteExerciseIds.map((id) => idMap[id] || id);

          // Update PRs
          const newPRs: Record<string, ExercisePR> = {};
          Object.entries(state.exercisePRs).forEach(([oldId, pr]) => {
            const newId = idMap[oldId] || oldId;
            newPRs[newId] = { ...pr, syncStatus: 'dirty', updatedAt: new Date().toISOString() };
          });
          state.exercisePRs = newPRs;
        }),

      markEntityDirty: (entityType, id) =>
        set((state) => {
          if (!state.authUser) return; // Only track dirty if auth'd
          let entity: any = null;
          if (entityType === 'routine') entity = state.routines.find((r) => r.id === id);
          if (entityType === 'session') entity = state.sessions.find((s) => s.id === id);
          if (entityType === 'measure') entity = state.measures.find((m) => m.id === id);
          if (entityType === 'pr') entity = state.exercisePRs[id];
          if (entity) {
            entity.syncStatus = 'dirty';
            entity.updatedAt = new Date().toISOString();
          }
        }),

      markEntitySynced: (entityType, id, cloudId) =>
        set((state) => {
          let entity: any = null;
          if (entityType === 'routine') entity = state.routines.find((r) => r.id === id);
          if (entityType === 'session') entity = state.sessions.find((s) => s.id === id);
          if (entityType === 'measure') entity = state.measures.find((m) => m.id === id);
          if (entityType === 'pr') entity = state.exercisePRs[id];
          if (entity) {
            entity.syncStatus = 'synced';
            if (cloudId) entity.cloudId = cloudId;
          }
        }),

      mergeCloudRoutines: (cloudRoutines) =>
        set((state) => {
          const map = new Map(state.routines.map((r) => [r.id, r]));
          cloudRoutines.forEach((cr) => {
            const existing = map.get(cr.id);
            // Never let a cloud pull overwrite a local change that hasn't been
            // pushed yet (pending delete or edit) — local wins until synced.
            if (existing && (existing.syncStatus === 'dirty' || existing.syncStatus === 'deleted')) {
              return;
            }
            if (!existing || new Date(cr.updatedAt || 0) >= new Date(existing.updatedAt || 0)) {
              map.set(cr.id, { ...existing, ...cr, syncStatus: 'synced' });
            }
          });
          state.routines = Array.from(map.values()).filter(r => !r.deletedAt);
        }),

      mergeCloudSessions: (cloudSessions) =>
        set((state) => {
          const map = new Map(state.sessions.map((s) => [s.id, s]));
          cloudSessions.forEach((cs) => {
            const existing = map.get(cs.id);
            if (!existing || new Date(cs.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
              map.set(cs.id, { ...cs, syncStatus: 'synced' });
            }
          });
          state.sessions = Array.from(map.values()).filter(s => !s.deletedAt).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        }),

      mergeCloudMeasures: (cloudMeasures) =>
        set((state) => {
          const map = new Map(state.measures.map((m) => [m.id, m]));
          cloudMeasures.forEach((cm) => {
            const existing = map.get(cm.id);
            if (!existing || new Date(cm.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
              map.set(cm.id, { ...cm, syncStatus: 'synced' });
            }
          });
          state.measures = Array.from(map.values()).filter(m => !m.deletedAt).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }),

      mergeCloudPRs: (cloudPRs) =>
        set((state) => {
          Object.entries(cloudPRs).forEach(([id, cPR]) => {
            const existing = state.exercisePRs[id];
            if (!existing || new Date(cPR.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
              if (!cPR.deletedAt) {
                state.exercisePRs[id] = { ...cPR, syncStatus: 'synced' };
              } else {
                delete state.exercisePRs[id];
              }
            }
          });
        }),

      mergeCloudFavorites: (cloudFavIds) =>
        set((state) => {
          state.favoriteExerciseIds = Array.from(new Set([...state.favoriteExerciseIds, ...cloudFavIds]));
        }),

      softDeleteRoutine: (id) =>
        set((state) => {
          const r = state.routines.find((r) => r.id === id);
          if (r) {
            r.deletedAt = new Date().toISOString();
            r.syncStatus = 'deleted';
          }
        }),

      softDeleteSession: (id) =>
        set((state) => {
          const s = state.sessions.find((s) => s.id === id);
          if (s) {
            s.deletedAt = new Date().toISOString();
            s.syncStatus = 'deleted';
          }
        }),

      softDeleteMeasure: (id) =>
        set((state) => {
          const m = state.measures.find((m) => m.id === id);
          if (m) {
            m.deletedAt = new Date().toISOString();
            m.syncStatus = 'deleted';
          }
        }),

      // ── AI cache ─────────────────────────────────────────────────────────
      setAIWeeklyPlanCache: (data) =>
        set((state) => {
          state.aiWeeklyPlanCache = { generatedAt: new Date().toISOString(), data };
        }),

      clearAIWeeklyPlanCache: () =>
        set((state) => {
          state.aiWeeklyPlanCache = null;
        }),
    })),
    {
      /**
       * ARCHITECTURE NOTE (v6):
       * New split stores have been introduced alongside this monolithic store:
       *   store/exerciseStore.ts   — catalog + custom exercises + favorites
       *   store/routineStore.ts    — user routines + saved programs
       *   store/historyStore.ts    — sessions + active workout + PRs
       *   store/measureStore.ts    — body measurements
       *   store/authStore.ts       — auth user
       *   store/syncStore.ts       — sync queue + status
       *
       * This store remains as-is for backward compatibility.
       * Migrate components to new stores incrementally.
       * Run lib/migration/v6Migration.ts once on startup to copy persisted data.
       */
      name: 'smartgym-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 5,

      /**
       * Only persist data that should survive app restarts.
       * Exclude transient UI/runtime state: activeWorkout, isTourVisible, tourStep.
       */
      partialize: (state) => ({
        routines: state.routines,
        customExercises: state.customExercises,
        sessions: state.sessions,
        measures: state.measures,
        settings: state.settings,
        isFirstLaunch: state.isFirstLaunch,
        favoriteExerciseIds: state.favoriteExerciseIds,
        customExerciseDraft: state.customExerciseDraft,
        exercisePRs: state.exercisePRs,
        authUser: state.authUser,
        localSyncDone: state.localSyncDone,
      }),

      /**
       * Version migration — increment `version` and add cases here
       * when the persisted shape changes in a breaking way.
       */
      migrate: (persistedState: unknown, fromVersion: number) => {
        const s = persistedState as Partial<SmartGymState>;
        if (fromVersion < 2) {
          if (!s.customExercises) s.customExercises = [];
        }
        if (fromVersion < 3) {
          if (!s.favoriteExerciseIds) s.favoriteExerciseIds = [];
          if (s.customExerciseDraft === undefined) s.customExerciseDraft = null;
        }
        if (fromVersion < 4) {
          if (!s.exercisePRs) s.exercisePRs = {};
          if (s.settings && !s.settings.oneRmFormula) {
            s.settings.oneRmFormula = 'epley';
          }
        }
        if (fromVersion < 5) {
          // v2.1: Add auth fields
          if (s.authUser === undefined) (s as Partial<SmartGymState>).authUser = null;
          if ((s as Partial<SmartGymState>).localSyncDone === undefined) (s as Partial<SmartGymState>).localSyncDone = false;
        }
        return s as SmartGymState;
      },
    }
  )
);

// bump version to 5
// ─── Hydration helper ────────────────────────────────────────────────────────
// Call this in components to know when AsyncStorage data has been loaded.
export const useStoreHydrated = () => useStore.persist.hasHydrated();

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectRoutines = (s: SmartGymState) => s.routines;
export const selectCustomExercises = (s: SmartGymState) => s.customExercises;
export const selectSessions = (s: SmartGymState) => s.sessions;
export const selectMeasures = (s: SmartGymState) => s.measures;
export const selectActiveWorkout = (s: SmartGymState) => s.activeWorkout;
export const selectSettings = (s: SmartGymState) => s.settings;
export const selectTour = (s: SmartGymState) => ({
  isTourVisible: s.isTourVisible,
  tourStep: s.tourStep,
});
export const selectFavoriteIds = (s: SmartGymState) => s.favoriteExerciseIds;
export const selectCustomExerciseDraft = (s: SmartGymState) => s.customExerciseDraft;
export const selectExercisePRs = (s: SmartGymState) => s.exercisePRs;

export const getExercise1RMHistory = (s: SmartGymState, exerciseId: string) => {
  const history: { date: string; value: number; weight: number; reps: number }[] = [];
  const formula = s.settings.oneRmFormula;
  
  // Iterate sessions chronologically (oldest to newest) to plot progression
  const sortedSessions = [...s.sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  sortedSessions.forEach(session => {
    const exerciseLogs = session.exercises.filter((e) => e.exerciseId === exerciseId);
    let sessionMax1RM = 0;
    let bestWeight = 0;
    let bestReps = 0;
    
    exerciseLogs.forEach(log => {
      log.sets.forEach(set => {
        if (set.completed && set.weight > 0 && set.reps > 0) {
          const oneRM = calculate1RM(set.weight, set.reps, formula);
          if (oneRM > sessionMax1RM) {
            sessionMax1RM = oneRM;
            bestWeight = set.weight;
            bestReps = set.reps;
          }
        }
      });
    });

    if (sessionMax1RM > 0) {
      history.push({
        date: session.startedAt,
        value: sessionMax1RM,
        weight: bestWeight,
        reps: bestReps,
      });
    }
  });

  return history;
};
