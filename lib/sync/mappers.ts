import type { Routine, RoutineExercise, WorkoutSession, ExerciseLog, SetLog, BodyMeasure, ExercisePR } from '@/store';

// We need to define some row types mapping to our sql
export interface RoutineRow {
  id: string;
  user_id: string;
  local_id: string;
  name: string;
  description: string | null;
  color: string;
  category: string | null;
  estimated_duration: number | null;
  last_performed: string | null;
  sort_order: number;
  metadata: any;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RoutineExerciseRow {
  id: string;
  routine_id: string;
  user_id: string;
  exercise_id: string;
  cloud_exercise_id: string | null;
  exercise_name: string;
  sets: number;
  reps: number | null;
  weight: number | null;
  rest_seconds: number | null;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkoutSessionRow {
  id: string;
  user_id: string;
  local_id: string;
  routine_id: string | null;
  local_routine_id: string | null;
  routine_name: string;
  started_at: string;
  finished_at: string | null;
  duration: number | null;
  total_volume: number | null;
  total_sets: number | null;
  note: string | null;
  source: string;
  health_sync_status: string;
  health_platform: string | null;
  health_record_id: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkoutExerciseLogRow {
  id: string;
  session_id: string;
  user_id: string;
  exercise_id: string;
  cloud_exercise_id: string | null;
  exercise_name: string;
  rest_seconds: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSetLogRow {
  id: string;
  exercise_log_id: string;
  session_id: string;
  user_id: string;
  weight: number;
  reps: number;
  completed: boolean;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BodyMeasureRow {
  id: string;
  user_id: string;
  local_id: string;
  date: string;
  weight: number | null;
  body_fat: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  thighs: number | null;
  calves: number | null;
  shoulders: number | null;
  neck: number | null;
  unit: string;
  source: string;
  health_sync_status: string;
  health_record_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ExercisePRRow {
  id: string;
  user_id: string;
  exercise_id: string;
  cloud_exercise_id: string | null;
  one_rm: number;
  date: string;
  weight: number;
  reps: number;
  formula: string;
  best_set_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ─── Routine Mappers ──────────────────────────────────────────────────────────

export function routineToRow(routine: Routine, userId: string, cloudId?: string): Partial<RoutineRow> {
  return {
    ...(cloudId ? { id: cloudId } : {}),
    user_id: userId,
    local_id: routine.id,
    name: routine.name,
    description: routine.description || null,
    color: routine.color,
    category: routine.category || null,
    estimated_duration: routine.estimatedDuration || null,
    last_performed: routine.lastPerformed || null,
    created_at: routine.createdAt,
    updated_at: new Date().toISOString(),
  };
}

export function rowToRoutine(row: RoutineRow, exercises: RoutineExercise[]): Routine {
  return {
    id: row.local_id || row.id,
    name: row.name,
    description: row.description || undefined,
    color: row.color,
    category: row.category || undefined,
    estimatedDuration: row.estimated_duration || undefined,
    lastPerformed: row.last_performed || undefined,
    createdAt: row.created_at,
    exercises,
  };
}

export function routineExerciseToRow(
  ex: RoutineExercise,
  routineCloudId: string,
  userId: string,
  sortOrder: number
): Partial<RoutineExerciseRow> {
  return {
    routine_id: routineCloudId,
    user_id: userId,
    exercise_id: ex.exerciseId,
    exercise_name: ex.exerciseName,
    sets: ex.sets,
    reps: ex.reps || null,
    weight: ex.weight || null,
    rest_seconds: ex.restSeconds || null,
    note: ex.note || null,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export function rowToRoutineExercise(row: RoutineExerciseRow): RoutineExercise {
  return {
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    sets: row.sets,
    reps: row.reps || undefined,
    weight: row.weight || undefined,
    restSeconds: row.rest_seconds || undefined,
    note: row.note || undefined,
  };
}

// ─── Session Mappers ──────────────────────────────────────────────────────────

export function sessionToRow(session: WorkoutSession, userId: string, cloudId?: string): Partial<WorkoutSessionRow> {
  return {
    ...(cloudId ? { id: cloudId } : {}),
    user_id: userId,
    local_id: session.id,
    local_routine_id: session.routineId || null,
    routine_name: session.routineName,
    started_at: session.startedAt,
    finished_at: session.finishedAt || null,
    duration: session.duration || null,
    total_volume: session.totalVolume || null,
    total_sets: session.totalSets || null,
    note: session.note || null,
    updated_at: new Date().toISOString(),
  };
}

export function exerciseLogToRow(
  log: ExerciseLog,
  sessionCloudId: string,
  userId: string,
  sortOrder: number
): Partial<WorkoutExerciseLogRow> {
  return {
    session_id: sessionCloudId,
    user_id: userId,
    exercise_id: log.exerciseId,
    exercise_name: log.exerciseName,
    rest_seconds: log.restSeconds || null,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export function setLogToRow(
  set: SetLog,
  exerciseLogCloudId: string,
  sessionCloudId: string,
  userId: string,
  sortOrder: number
): Partial<WorkoutSetLogRow> {
  return {
    exercise_log_id: exerciseLogCloudId,
    session_id: sessionCloudId,
    user_id: userId,
    weight: set.weight,
    reps: set.reps,
    completed: set.completed,
    note: set.note || null,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export function rowsToSession(
  sessionRow: WorkoutSessionRow,
  exerciseRows: WorkoutExerciseLogRow[],
  setRows: WorkoutSetLogRow[]
): WorkoutSession {
  const exercises: ExerciseLog[] = exerciseRows
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((exRow) => {
      const sets: SetLog[] = setRows
        .filter((s) => s.exercise_log_id === exRow.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((sRow) => ({
          id: sRow.id,
          weight: sRow.weight,
          reps: sRow.reps,
          completed: sRow.completed,
          note: sRow.note || undefined,
        }));

      return {
        exerciseId: exRow.exercise_id,
        exerciseName: exRow.exercise_name,
        restSeconds: exRow.rest_seconds || undefined,
        sets,
      };
    });

  return {
    id: sessionRow.local_id || sessionRow.id,
    routineId: sessionRow.local_routine_id || undefined,
    routineName: sessionRow.routine_name,
    startedAt: sessionRow.started_at,
    finishedAt: sessionRow.finished_at || undefined,
    duration: sessionRow.duration || undefined,
    totalVolume: sessionRow.total_volume || undefined,
    totalSets: sessionRow.total_sets || undefined,
    note: sessionRow.note || undefined,
    exercises,
  };
}

// ─── Measure Mappers ──────────────────────────────────────────────────────────

export function measureToRow(measure: BodyMeasure, userId: string, cloudId?: string): Partial<BodyMeasureRow> {
  return {
    ...(cloudId ? { id: cloudId } : {}),
    user_id: userId,
    local_id: measure.id,
    date: measure.date,
    weight: measure.weight || null,
    body_fat: measure.bodyFat || null,
    chest: measure.chest || null,
    waist: measure.waist || null,
    hips: measure.hips || null,
    arms: measure.arms || null,
    thighs: measure.thighs || null,
    calves: measure.calves || null,
    shoulders: measure.shoulders || null,
    neck: measure.neck || null,
    unit: measure.unit,
    updated_at: new Date().toISOString(),
  };
}

export function rowToMeasure(row: BodyMeasureRow): BodyMeasure {
  return {
    id: row.local_id || row.id,
    date: row.date,
    weight: row.weight || undefined,
    bodyFat: row.body_fat || undefined,
    chest: row.chest || undefined,
    waist: row.waist || undefined,
    hips: row.hips || undefined,
    arms: row.arms || undefined,
    thighs: row.thighs || undefined,
    calves: row.calves || undefined,
    shoulders: row.shoulders || undefined,
    neck: row.neck || undefined,
    unit: row.unit as 'metric' | 'imperial',
  };
}

// ─── PR Mappers ───────────────────────────────────────────────────────────────

export function prToRow(pr: ExercisePR, exerciseId: string, userId: string): Partial<ExercisePRRow> {
  return {
    user_id: userId,
    exercise_id: exerciseId,
    one_rm: pr.oneRM,
    date: pr.date,
    weight: pr.weight,
    reps: pr.reps,
    formula: pr.formula,
    best_set_date: pr.bestSetDate,
    updated_at: new Date().toISOString(),
  };
}

export function rowToPR(row: ExercisePRRow): ExercisePR {
  return {
    oneRM: row.one_rm,
    date: row.date,
    weight: row.weight,
    reps: row.reps,
    formula: row.formula as any,
    bestSetDate: row.best_set_date,
  };
}
