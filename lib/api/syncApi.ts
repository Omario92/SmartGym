/**
 * lib/api/syncApi.ts
 *
 * Supabase push/pull sync operations for user data.
 * Called by syncService.ts — not directly from UI.
 *
 * Pattern:
 *   upsert: insert or update by local ID or cloud ID
 *   delete: soft-delete via deleted_at timestamp
 *   pull:   fetch all dirty/new records since last sync
 */

import { supabase } from '@/lib/supabase';
import type { Routine, RoutineExercise } from '@/types/routine';
import type { WorkoutSession, BodyMeasure, ExercisePR, CustomExercise } from '@/types';

// ─── Routines ────────────────────────────────────────────────────────────────

export async function upsertRoutine(
  userId: string,
  routine: Routine
): Promise<{ cloudId: string }> {
  // Upsert the routine header
  const { data, error } = await supabase
    .from('routines')
    .upsert(
      {
        ...(routine.cloudId ? { id: routine.cloudId } : {}),
        user_id: userId,
        name: routine.name,
        description: routine.description ?? null,
        color: routine.color,
        category: routine.category ?? null,
        estimated_duration: routine.estimatedDuration ?? null,
        difficulty: routine.difficulty ?? null,
        source: routine.source,
        image_url: routine.imageUrl ?? null,
        deleted_at: routine.deletedAt ?? null,
        last_performed_at: routine.lastPerformed ?? null,
        local_id: routine.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'local_id, user_id', ignoreDuplicates: false }
    )
    .select('id')
    .single();

  if (error) throw new Error(`Routine upsert failed: ${error.message}`);

  const cloudId = data.id as string;

  // Upsert exercises — delete all and re-insert (simple, correct for small lists)
  if (!routine.deletedAt && routine.exercises.length > 0) {
    await supabase.from('routine_exercises').delete().eq('routine_id', cloudId);

    const exerciseRows = routine.exercises.map((ex: RoutineExercise, idx: number) => ({
      routine_id: cloudId,
      exercise_id: ex.exerciseId,
      exercise_name: ex.exerciseName,
      display_order: idx,
      sets: ex.sets,
      reps: ex.reps ?? null,
      weight: ex.weight ?? null,
      rest_seconds: ex.restSeconds ?? null,
      note: ex.note ?? null,
    }));

    const { error: exError } = await supabase.from('routine_exercises').insert(exerciseRows);
    if (exError) throw new Error(`Routine exercises upsert failed: ${exError.message}`);
  }

  return { cloudId };
}

export async function deleteRoutineFromCloud(cloudId: string): Promise<void> {
  const { error } = await supabase
    .from('routines')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', cloudId);
  if (error) throw new Error(`Routine delete failed: ${error.message}`);
}

// ─── Workout sessions ────────────────────────────────────────────────────────

export async function upsertWorkoutSession(
  userId: string,
  session: WorkoutSession
): Promise<{ cloudId: string }> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .upsert(
      {
        ...(session.cloudId ? { id: session.cloudId } : {}),
        user_id: userId,
        routine_id: null, // we don't maintain routine FK for now
        routine_name: session.routineName,
        started_at: session.startedAt,
        finished_at: session.finishedAt ?? null,
        duration: session.duration ?? null,
        total_volume: session.totalVolume ?? null,
        total_sets: session.totalSets ?? null,
        note: session.note ?? null,
        deleted_at: session.deletedAt ?? null,
        local_id: session.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'local_id, user_id', ignoreDuplicates: false }
    )
    .select('id')
    .single();

  if (error) throw new Error(`Session upsert failed: ${error.message}`);

  const cloudId = data.id as string;

  // Upsert exercise logs + set logs
  if (!session.deletedAt && session.exercises.length > 0) {
    await supabase.from('workout_exercise_logs').delete().eq('session_id', cloudId);

    for (let i = 0; i < session.exercises.length; i++) {
      const ex = session.exercises[i];
      const { data: exLog, error: exError } = await supabase
        .from('workout_exercise_logs')
        .insert({
          session_id: cloudId,
          exercise_id: ex.exerciseId,
          exercise_name: ex.exerciseName,
          rest_seconds: ex.restSeconds ?? null,
          display_order: i,
        })
        .select('id')
        .single();

      if (exError) continue;

      const setRows = ex.sets.map((s, si) => ({
        exercise_log_id: exLog.id,
        set_order: si,
        weight: s.weight,
        reps: s.reps,
        completed: s.completed,
        note: s.note ?? null,
        completed_at: s.completedAt ?? null,
      }));

      if (setRows.length > 0) {
        await supabase.from('workout_set_logs').insert(setRows);
      }
    }
  }

  return { cloudId };
}

// ─── Body measures ────────────────────────────────────────────────────────────

export async function upsertBodyMeasure(
  userId: string,
  measure: BodyMeasure
): Promise<{ cloudId: string }> {
  const { data, error } = await supabase
    .from('body_measures')
    .upsert(
      {
        ...(measure.cloudId ? { id: measure.cloudId } : {}),
        user_id: userId,
        date: measure.date.substring(0, 10),
        weight: measure.weight ?? null,
        body_fat: measure.bodyFat ?? null,
        chest: measure.chest ?? null,
        waist: measure.waist ?? null,
        hips: measure.hips ?? null,
        arms: measure.arms ?? null,
        thighs: measure.thighs ?? null,
        calves: measure.calves ?? null,
        shoulders: measure.shoulders ?? null,
        neck: measure.neck ?? null,
        unit: measure.unit,
        note: measure.note ?? null,
        deleted_at: measure.deletedAt ?? null,
        local_id: measure.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'local_id, user_id', ignoreDuplicates: false }
    )
    .select('id')
    .single();

  if (error) throw new Error(`Measure upsert failed: ${error.message}`);
  return { cloudId: data.id as string };
}

// ─── Exercise PRs ─────────────────────────────────────────────────────────────

export async function upsertExercisePR(
  userId: string,
  exerciseId: string,
  pr: ExercisePR
): Promise<{ cloudId: string }> {
  const { data, error } = await supabase
    .from('exercise_prs')
    .upsert(
      {
        ...(pr.cloudId ? { id: pr.cloudId } : {}),
        user_id: userId,
        exercise_id: exerciseId,
        one_rm: pr.oneRM,
        achieved_at: pr.date,
        weight: pr.weight,
        reps: pr.reps,
        formula: pr.formula,
        best_set_date: pr.bestSetDate,
        deleted_at: pr.deletedAt ?? null,
        local_id: exerciseId + '_' + userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, exercise_id', ignoreDuplicates: false }
    )
    .select('id')
    .single();

  if (error) throw new Error(`PR upsert failed: ${error.message}`);
  return { cloudId: data.id as string };
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function syncFavorites(
  userId: string,
  exerciseIds: string[]
): Promise<void> {
  // Remove all existing favorites and re-insert
  await supabase.from('favorites').delete().eq('user_id', userId);
  if (exerciseIds.length === 0) return;

  const rows = exerciseIds.map((id) => ({ user_id: userId, exercise_id: id }));
  const { error } = await supabase.from('favorites').insert(rows);
  if (error) throw new Error(`Favorites sync failed: ${error.message}`);
}

export async function fetchFavorites(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('exercise_id')
    .eq('user_id', userId);
  if (error) return [];
  return (data ?? []).map((r: any) => r.exercise_id as string);
}

// ─── Custom exercises ─────────────────────────────────────────────────────────

export async function upsertCustomExercise(
  userId: string,
  exercise: CustomExercise
): Promise<{ cloudId: string }> {
  const { data, error } = await supabase
    .from('custom_exercises')
    .upsert(
      {
        ...(exercise.cloudId ? { id: exercise.cloudId } : {}),
        user_id: userId,
        name: exercise.name,
        description: exercise.description ?? null,
        muscle_group: exercise.muscleGroup,
        secondary_muscles: exercise.secondaryMuscles ?? [],
        equipment: exercise.equipment,
        type: exercise.type,
        difficulty: exercise.difficulty,
        instructions: exercise.instructions ?? [],
        tips: exercise.tips ?? [],
        image_url: exercise.imageUrl ?? null,
        notes: exercise.notes ?? null,
        deleted_at: exercise.deletedAt ?? null,
        local_id: exercise.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'local_id, user_id', ignoreDuplicates: false }
    )
    .select('id')
    .single();

  if (error) throw new Error(`Custom exercise upsert failed: ${error.message}`);
  return { cloudId: data.id as string };
}
