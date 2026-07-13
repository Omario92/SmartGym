/**
 * store/historyStore.ts
 *
 * Manages workout session history, active workout runtime state, and PRs.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSession, ActiveWorkout, ExercisePR, SetLog, ExerciseLog } from '@/types/workout';
import { calculate1RM } from '@/lib/1rm';
import type { OneRMFormula } from '@/lib/1rm';

interface HistoryStoreState {
  sessions: WorkoutSession[];
  /** Runtime only — not persisted */
  activeWorkout: ActiveWorkout | null;
  exercisePRs: Record<string, ExercisePR>;

  // ── Session actions ──
  addSession: (session: WorkoutSession) => void;
  deleteSession: (id: string, isAuthenticated: boolean) => void;
  clearHistory: () => void;

  // ── Active workout actions ──
  startWorkout: (routineId: string | undefined, routineName: string, exercises: ExerciseLog[]) => void;
  updateSet: (exerciseIndex: number, setIndex: number, data: Partial<SetLog>) => void;
  addSet: (exerciseIndex: number) => void;
  updateExerciseRestTime: (exerciseIndex: number, restSeconds: number) => void;
  nextExercise: () => void;
  finishWorkout: (formula: OneRMFormula) => WorkoutSession | null;
  cancelWorkout: () => void;
  updateElapsed: (seconds: number) => void;
  startRest: (seconds: number) => void;
  skipRest: () => void;

  // ── PR actions ──
  mergeCloudPRs: (prs: Record<string, ExercisePR>) => void;

  // ── Sync merge ──
  mergeCloudSessions: (sessions: WorkoutSession[]) => void;
  clearUserData: () => void;
}

export const useHistoryStore = create<HistoryStoreState>()(
  persist(
    immer((set, get) => ({
      sessions: [],
      activeWorkout: null,
      exercisePRs: {},

      // ── Sessions ─────────────────────────────────────────────────────────

      addSession: (session) =>
        set((state) => {
          state.sessions.unshift({
            ...session,
            syncStatus: 'dirty',
            updatedAt: new Date().toISOString(),
          });
        }),

      deleteSession: (id, isAuthenticated) =>
        set((state) => {
          if (isAuthenticated) {
            const s = state.sessions.find((s) => s.id === id);
            if (s) {
              s.deletedAt = new Date().toISOString();
              s.syncStatus = 'deleted';
            }
          } else {
            state.sessions = state.sessions.filter((s) => s.id !== id);
          }
        }),

      clearHistory: () =>
        set((state) => { state.sessions = []; }),

      // ── Active workout ────────────────────────────────────────────────────

      startWorkout: (routineId, routineName, exercises) =>
        set((state) => {
          state.activeWorkout = {
            routineId,
            routineName,
            startedAt: new Date().toISOString(),
            exercises,
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            isResting: false,
            restSecondsLeft: 0,
            elapsedSeconds: 0,
          };
        }),

      updateSet: (exerciseIndex, setIndex, data) =>
        set((state) => {
          if (state.activeWorkout) {
            Object.assign(
              state.activeWorkout.exercises[exerciseIndex].sets[setIndex],
              data
            );
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

      finishWorkout: (formula) => {
        const workout = get().activeWorkout;
        if (!workout) return null;

        const finishedAt = new Date().toISOString();
        const totalSets = workout.exercises.reduce(
          (acc, e) => acc + e.sets.filter((s) => s.completed).length, 0
        );
        const totalVolume = workout.exercises.reduce(
          (acc, e) => acc + e.sets.filter((s) => s.completed).reduce((a, s) => a + s.weight * s.reps, 0), 0
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
          syncStatus: 'dirty',
          updatedAt: new Date().toISOString(),
        };

        set((state) => {
          // Update PRs
          workout.exercises.forEach((ex) => {
            let maxOneRM = 0;
            let bestWeight = 0;
            let bestReps = 0;
            ex.sets.forEach((s) => {
              if (s.completed && s.weight > 0 && s.reps > 0) {
                const oneRM = calculate1RM(s.weight, s.reps, formula);
                if (oneRM > maxOneRM) {
                  maxOneRM = oneRM;
                  bestWeight = s.weight;
                  bestReps = s.reps;
                }
              }
            });
            if (maxOneRM > 0) {
              const current = state.exercisePRs[ex.exerciseId];
              if (!current || maxOneRM > current.oneRM) {
                state.exercisePRs[ex.exerciseId] = {
                  oneRM: maxOneRM,
                  date: session.startedAt,
                  weight: bestWeight,
                  reps: bestReps,
                  formula,
                  bestSetDate: session.startedAt,
                  syncStatus: 'dirty',
                  updatedAt: new Date().toISOString(),
                };
              }
            }
          });

          state.sessions.unshift(session);
          state.activeWorkout = null;
        });

        return session;
      },

      cancelWorkout: () =>
        set((state) => { state.activeWorkout = null; }),

      updateElapsed: (seconds) =>
        set((state) => {
          if (state.activeWorkout) state.activeWorkout.elapsedSeconds = seconds;
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

      // ── Cloud merge ───────────────────────────────────────────────────────

      mergeCloudPRs: (cloudPRs) =>
        set((state) => {
          Object.entries(cloudPRs).forEach(([id, cPR]) => {
            const existing = state.exercisePRs[id];
            if (!existing || new Date(cPR.updatedAt ?? 0) > new Date(existing.updatedAt ?? 0)) {
              if (!cPR.deletedAt) {
                state.exercisePRs[id] = { ...cPR, syncStatus: 'synced' };
              } else {
                delete state.exercisePRs[id];
              }
            }
          });
        }),

      mergeCloudSessions: (cloudSessions) =>
        set((state) => {
          const map = new Map(state.sessions.map((s) => [s.id, s]));
          cloudSessions.forEach((cs) => {
            const existing = map.get(cs.id);
            if (!existing || new Date(cs.updatedAt ?? 0) > new Date(existing.updatedAt ?? 0)) {
              map.set(cs.id, { ...cs, syncStatus: 'synced' });
            }
          });
          state.sessions = Array.from(map.values())
            .filter((s) => !s.deletedAt)
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        }),

      clearUserData: () =>
        set((state) => {
          state.sessions = [];
          state.exercisePRs = {};
          state.activeWorkout = null;
        }),
    })),
    {
      name: 'smartgym-history-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        sessions: state.sessions,
        exercisePRs: state.exercisePRs,
        // activeWorkout is runtime only — not persisted
      }),
    }
  )
);

export const selectSessions = (s: HistoryStoreState) =>
  s.sessions.filter((s) => !s.deletedAt);
export const selectActiveWorkout = (s: HistoryStoreState) => s.activeWorkout;
export const selectExercisePRs = (s: HistoryStoreState) => s.exercisePRs;
