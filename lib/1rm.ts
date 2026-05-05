import type { SetLog, WorkoutSession } from '@/store';

export type OneRMFormula = 'epley' | 'brzycki' | 'lombardi';

/**
 * Calculate 1RM using standard formulas.
 * Epley: weight * (1 + reps / 30)
 * Brzycki: weight * (36 / (37 - reps))
 * Lombardi: weight * Math.pow(reps, 0.1)
 */
export const calculate1RM = (
  weight: number,
  reps: number,
  formula: OneRMFormula = 'epley'
): number => {
  if (weight <= 0 || reps < 1) return 0;
  
  // Formulas lose accuracy at high reps. Often capped at 10 or 12.
  // We'll calculate it but maybe we shouldn't trust it fully > 30 reps.
  if (reps === 1) return weight;

  let oneRM = 0;
  switch (formula) {
    case 'brzycki':
      // Brzycki breaks down at 37 reps (division by zero or negative)
      if (reps >= 37) return weight;
      oneRM = weight * (36 / (37 - reps));
      break;
    case 'lombardi':
      oneRM = weight * Math.pow(reps, 0.1);
      break;
    case 'epley':
    default:
      oneRM = weight * (1 + reps / 30);
      break;
  }

  // Return rounded to 1 decimal place
  return Math.round(oneRM * 10) / 10;
};

/**
 * Estimate max 1RM from an array of sets.
 */
export const estimate1RMFromSets = (
  sets: Pick<SetLog, 'weight' | 'reps' | 'completed'>[],
  formula: OneRMFormula = 'epley'
): number => {
  let max1RM = 0;
  for (const set of sets) {
    if (!set.completed) continue;
    const current1RM = calculate1RM(set.weight, set.reps, formula);
    if (current1RM > max1RM) {
      max1RM = current1RM;
    }
  }
  return max1RM;
};

export interface History1RMEstimate {
  current1RM: number;
  previous1RM: number | null;
  delta: number;
  lastDate: string | null;
  bestSet: { weight: number; reps: number; date: string } | null;
}

/**
 * Estimate 1RM progress by scanning past sessions for a specific exercise.
 * Returns the highest 1RM ever achieved and the previous 1RM to calculate a delta.
 * Note: Assumes sessions are sorted newest first (descending by date).
 */
export const estimate1RMFromHistory = (
  exerciseId: string,
  sessions: WorkoutSession[],
  formula: OneRMFormula = 'epley'
): History1RMEstimate | null => {
  if (!sessions || sessions.length === 0) return null;

  let current1RM = 0;
  let previous1RM: number | null = null;
  let lastDate: string | null = null;
  let bestSet: { weight: number; reps: number; date: string } | null = null;

  // Since sessions are newest first, we can find the most recent best.
  // We actually want the highest ever 1RM as current PR, or maybe the most recent session's 1RM?
  // Usually, 1RM is the All-Time PR. The prompt asks for "current 1RM", "previous 1RM", "delta".
  // Let's find the absolute highest 1RM (All-Time PR).
  // "previous 1RM" could mean the highest 1RM *before* the session where the PR was hit, 
  // or the 1RM of the immediate previous session. 
  // Let's iterate from oldest to newest to track the progression of the PR.
  
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  let pr = 0;
  let lastPR = 0;

  for (const session of sortedSessions) {
    const exerciseLogs = session.exercises.filter((e) => e.exerciseId === exerciseId);
    if (exerciseLogs.length === 0) continue;

    let sessionMax1RM = 0;
    let sessionBestSet = null;

    for (const log of exerciseLogs) {
      for (const set of log.sets) {
        if (!set.completed) continue;
        const oneRM = calculate1RM(set.weight, set.reps, formula);
        if (oneRM > sessionMax1RM) {
          sessionMax1RM = oneRM;
          sessionBestSet = { weight: set.weight, reps: set.reps, date: session.startedAt };
        }
      }
    }

    if (sessionMax1RM > 0) {
      lastDate = session.startedAt;
      if (sessionMax1RM > pr) {
        lastPR = pr;
        pr = sessionMax1RM;
        bestSet = sessionBestSet;
      }
    }
  }

  if (pr === 0) return null;

  current1RM = pr;
  previous1RM = lastPR > 0 ? lastPR : null;

  return {
    current1RM,
    previous1RM,
    delta: previous1RM !== null ? Math.round((current1RM - previous1RM) * 10) / 10 : 0,
    lastDate,
    bestSet,
  };
};
