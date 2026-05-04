/**
 * SmartGym — Global Zustand store
 * Manages routines, workout sessions, history, measures, and app state.
 * Persisted to AsyncStorage via zustand/middleware's `persist` adapter.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface SmartGymState {
  // App
  settings: AppSettings;
  isFirstLaunch: boolean;
  isTourVisible: boolean;
  tourStep: number;

  // Routines
  routines: Routine[];

  // Active workout (runtime only — not persisted)
  activeWorkout: ActiveWorkout | null;

  // History
  sessions: WorkoutSession[];

  // Measures
  measures: BodyMeasure[];

  // ─── Actions ─────────────────────────────────────────────────────────

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  setFirstLaunch: (value: boolean) => void;
  startTour: () => void;
  endTour: () => void;
  nextTourStep: () => void;
  setTourStep: (step: number) => void;

  // Routines
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  duplicateRoutine: (id: string) => void;

  // Workout
  startWorkout: (routine: Routine | { name: string; exercises: ExerciseLog[] }) => void;
  updateSet: (exerciseIndex: number, setIndex: number, data: Partial<SetLog>) => void;
  addSet: (exerciseIndex: number) => void;
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
  isPremium: false,
  language: 'en',
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
      activeWorkout: null,
      sessions: [],
      measures: [],

      // ── Settings ──
      updateSettings: (updates) =>
        set((state) => {
          Object.assign(state.settings, updates);
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
          state.routines.push(routine);
        }),

      updateRoutine: (id, updates) =>
        set((state) => {
          const idx = state.routines.findIndex((r) => r.id === id);
          if (idx !== -1) Object.assign(state.routines[idx], updates);
        }),

      deleteRoutine: (id) =>
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
            });
          }
        }),

      // ── Workout ──
      startWorkout: (input) => {
        const isRoutine = 'exercises' in input && !Array.isArray((input as any).exercises[0]?.sets);
        if (isRoutine && 'id' in input) {
          const routine = input as Routine;
          const exercises: ExerciseLog[] = routine.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
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
          state.sessions.unshift(session);
        }),

      deleteSession: (id) =>
        set((state) => {
          state.sessions = state.sessions.filter((s) => s.id !== id);
        }),

      /** Wipe all workout history */
      clearHistory: () =>
        set((state) => {
          state.sessions = [];
        }),

      // ── Measures ──
      addMeasure: (measure) =>
        set((state) => {
          state.measures.unshift(measure);
        }),

      updateMeasure: (id, updates) =>
        set((state) => {
          const idx = state.measures.findIndex((m) => m.id === id);
          if (idx !== -1) Object.assign(state.measures[idx], updates);
        }),

      deleteMeasure: (id) =>
        set((state) => {
          state.measures = state.measures.filter((m) => m.id !== id);
        }),
    })),
    {
      name: 'smartgym-store-v1', // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,

      /**
       * Only persist data that should survive app restarts.
       * Exclude transient UI/runtime state: activeWorkout, isTourVisible, tourStep.
       */
      partialize: (state) => ({
        routines: state.routines,
        sessions: state.sessions,
        measures: state.measures,
        settings: state.settings,
        isFirstLaunch: state.isFirstLaunch,
      }),

      /**
       * Version migration — increment `version` and add cases here
       * when the persisted shape changes in a breaking way.
       */
      migrate: (persistedState: any, fromVersion: number) => {
        // v0 → v1: no breaking changes, just pass through
        return persistedState as SmartGymState;
      },
    }
  )
);

// ─── Hydration helper ────────────────────────────────────────────────────────
// Call this in components to know when AsyncStorage data has been loaded.
export const useStoreHydrated = () => useStore.persist.hasHydrated();

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectRoutines = (s: SmartGymState) => s.routines;
export const selectSessions = (s: SmartGymState) => s.sessions;
export const selectMeasures = (s: SmartGymState) => s.measures;
export const selectActiveWorkout = (s: SmartGymState) => s.activeWorkout;
export const selectSettings = (s: SmartGymState) => s.settings;
export const selectTour = (s: SmartGymState) => ({
  isTourVisible: s.isTourVisible,
  tourStep: s.tourStep,
});
