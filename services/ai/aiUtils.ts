/**
 * AI Smart Trainer — Context builders
 * Reads Zustand store state and assembles AIBuildContext for AI calls.
 */

import { EXERCISES } from '@/lib/exercises';
import type { SmartGymState } from '@/store';
import type { AIBuildContext, AIUserProfile } from './types';

/** Default profile used when user hasn't configured one yet */
export const DEFAULT_AI_PROFILE: AIUserProfile = {
  goals: ['muscle_gain'],
  experienceLevel: 'beginner',
  daysPerWeek: 3,
  equipment: ['bodyweight'],
  preferredSplit: 'full_body',
  focusMuscles: [],
};

// ─── Context builder ──────────────────────────────────────────────────────────

export function buildAIContext(state: SmartGymState): AIBuildContext {
  const profile: AIUserProfile =
    state.settings.aiProfile ?? DEFAULT_AI_PROFILE;

  // Recent workout names (last 10 unique)
  const recentWorkoutNames = state.sessions
    .slice(0, 20)
    .map((s) => s.routineName)
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .slice(0, 10);

  // Workout frequency: sessions in the last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const workoutFrequencyLastMonth = state.sessions.filter(
    (s) => new Date(s.startedAt).getTime() > thirtyDaysAgo
  ).length;

  // Sessions in last 4 weeks (same as above but stricter label)
  const sessionsLast4Weeks = workoutFrequencyLastMonth;

  // Build PR map
  const prsByExercise: AIBuildContext['prsByExercise'] = {};
  for (const [exId, pr] of Object.entries(state.exercisePRs)) {
    prsByExercise[exId] = {
      oneRM: pr.oneRM,
      weight: pr.weight,
      reps: pr.reps,
    };
  }

  // Body stats from latest measurement
  const latestMeasure = state.measures[0];
  const olderMeasure = state.measures.find(
    (m, i) =>
      i > 0 &&
      latestMeasure?.weight != null &&
      (m as typeof latestMeasure).weight != null
  );

  let weightTrend: AIBuildContext['bodyStats']['weightTrend'];
  if (latestMeasure?.weight != null && olderMeasure?.weight != null) {
    const delta = latestMeasure.weight - olderMeasure.weight;
    weightTrend = delta < -0.5 ? 'losing' : delta > 0.5 ? 'gaining' : 'stable';
  }

  const measurements: Partial<Record<string, number>> = {};
  if (latestMeasure) {
    const fields = [
      'chest', 'waist', 'hips', 'arms', 'thighs', 'calves', 'shoulders', 'neck',
    ] as const;
    for (const f of fields) {
      const val = (latestMeasure as Record<string, unknown>)[f];
      if (typeof val === 'number') measurements[f] = val;
    }
  }

  // Exercise library: built-in + custom, deduplicated
  const customRefs = state.customExercises.map((e) => ({
    id: e.id,
    name: e.name,
    muscleGroup: e.muscleGroup,
    equipment: e.equipment,
  }));
  const builtinRefs = EXERCISES.map((e) => ({
    id: e.id,
    name: e.name,
    muscleGroup: e.muscleGroup,
    equipment: e.equipment,
  }));
  const allExIds = new Set<string>();
  const exerciseLibrary: AIBuildContext['exerciseLibrary'] = [];
  for (const ex of [...builtinRefs, ...customRefs]) {
    if (!allExIds.has(ex.id)) {
      allExIds.add(ex.id);
      exerciseLibrary.push(ex);
    }
  }

  return {
    userProfile: profile,
    recentWorkoutNames,
    workoutFrequencyLastMonth,
    sessionsLast4Weeks,
    exerciseLibrary,
    prsByExercise,
    bodyStats: {
      currentWeight: latestMeasure?.weight,
      bodyFat: latestMeasure?.bodyFat,
      weightTrend,
      measurements,
    },
  };
}

// ─── Focus muscle inference ───────────────────────────────────────────────────

/**
 * Infer focus muscles from body measurements by finding fields that have
 * been tracked multiple times — signals the user cares about those areas.
 */
export function inferFocusMuscles(state: SmartGymState): string[] {
  const counts: Record<string, number> = {};
  const muscleFields = [
    'chest', 'waist', 'hips', 'arms', 'thighs', 'calves', 'shoulders',
  ];
  for (const m of state.measures) {
    for (const f of muscleFields) {
      if ((m as Record<string, unknown>)[f] != null) {
        counts[f] = (counts[f] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([field]) => field);
}

// ─── AI profile validation ────────────────────────────────────────────────────

export function isAIProfileComplete(
  profile: AIUserProfile | undefined | null
): profile is AIUserProfile {
  if (!profile) return false;
  return (
    profile.goals.length > 0 &&
    !!profile.experienceLevel &&
    profile.daysPerWeek >= 2 &&
    profile.equipment.length > 0 &&
    !!profile.preferredSplit
  );
}
