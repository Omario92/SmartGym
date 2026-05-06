import { supabase } from '../supabase';
import { useStore } from '@/store';
import { syncLocalCustomExercisesToSupabase } from '../exerciseService';
import type { RoutineRow, WorkoutSessionRow, WorkoutExerciseLogRow, WorkoutSetLogRow, BodyMeasureRow, ExercisePRRow } from './mappers';
import {
  routineToRow, rowToRoutine, routineExerciseToRow, rowToRoutineExercise,
  sessionToRow, rowsToSession, exerciseLogToRow, setLogToRow,
  measureToRow, rowToMeasure, prToRow, rowToPR
} from './mappers';

export async function syncAllUserData(userId: string) {
  const store = useStore.getState();
  store.setSyncStatus('syncing');

  try {
    // 1. Sync custom exercises (push local ones, pull cloud ones)
    const localDrafts = store.customExercises.filter(ex => ex.syncStatus !== 'synced');
    if (localDrafts.length > 0) {
      const idMap = await syncLocalCustomExercisesToSupabase(localDrafts, userId);
      if (Object.keys(idMap).length > 0) {
        store.replaceExerciseIds(idMap);
      }
    }

    // 2. Pull Routines
    const { data: cloudRoutines, error: rErr } = await supabase.from('routines').select('*, routine_exercises(*)').eq('user_id', userId);
    if (!rErr && cloudRoutines) {
      const parsedRoutines = cloudRoutines.map(r => rowToRoutine(r, r.routine_exercises.map(re => rowToRoutineExercise(re))));
      store.mergeCloudRoutines(parsedRoutines);
    }

    // 3. Push Dirty Routines
    const dirtyRoutines = store.routines.filter(r => r.syncStatus === 'dirty' || r.syncStatus === 'deleted');
    for (const r of dirtyRoutines) {
      if (r.syncStatus === 'deleted') {
        if (r.cloudId) await supabase.from('routines').update({ deleted_at: new Date().toISOString() }).eq('id', r.cloudId);
      } else {
        const payload = routineToRow(r, userId, r.cloudId);
        const { data, error } = await supabase.from('routines').upsert(payload as any).select('id').single();
        if (data && !error) {
          store.markEntitySynced('routine', r.id, data.id);
          // Delete old exercises, re-insert
          await supabase.from('routine_exercises').delete().eq('routine_id', data.id);
          const exercisesPayload = r.exercises.map((ex, i) => routineExerciseToRow(ex, data.id, userId, i));
          await supabase.from('routine_exercises').insert(exercisesPayload as any);
        }
      }
    }

    // 4. Pull Measures
    const { data: cloudMeasures, error: mErr } = await supabase.from('body_measures').select('*').eq('user_id', userId);
    if (!mErr && cloudMeasures) {
      store.mergeCloudMeasures(cloudMeasures.map(m => rowToMeasure(m)));
    }

    // 5. Push Dirty Measures
    const dirtyMeasures = store.measures.filter(m => m.syncStatus === 'dirty' || m.syncStatus === 'deleted');
    for (const m of dirtyMeasures) {
      if (m.syncStatus === 'deleted') {
        if (m.cloudId) await supabase.from('body_measures').update({ deleted_at: new Date().toISOString() }).eq('id', m.cloudId);
      } else {
        const payload = measureToRow(m, userId, m.cloudId);
        const { data, error } = await supabase.from('body_measures').upsert(payload as any).select('id').single();
        if (data && !error) store.markEntitySynced('measure', m.id, data.id);
      }
    }

    // 6. Pull Sessions (History)
    const { data: cloudSessions, error: sErr } = await supabase.from('workout_sessions').select('*, workout_exercise_logs(*), workout_set_logs(*)').eq('user_id', userId);
    if (!sErr && cloudSessions) {
      const parsedSessions = cloudSessions.map(s => rowsToSession(s, s.workout_exercise_logs, s.workout_set_logs));
      store.mergeCloudSessions(parsedSessions);
    }

    // 7. Push Dirty Sessions
    const dirtySessions = store.sessions.filter(s => s.syncStatus === 'dirty' || s.syncStatus === 'deleted');
    for (const s of dirtySessions) {
      if (s.syncStatus === 'deleted') {
        if (s.cloudId) await supabase.from('workout_sessions').update({ deleted_at: new Date().toISOString() }).eq('id', s.cloudId);
      } else {
        const payload = sessionToRow(s, userId, s.cloudId);
        const { data, error } = await supabase.from('workout_sessions').upsert(payload as any).select('id').single();
        if (data && !error) {
          store.markEntitySynced('session', s.id, data.id);
          // Insert exercises and sets (simplified for now - just wipe and rewrite)
          await supabase.from('workout_exercise_logs').delete().eq('session_id', data.id);
          // Need to write exercises sequentially to get IDs for sets
          for (let i = 0; i < s.exercises.length; i++) {
            const exLog = s.exercises[i];
            const exPayload = exerciseLogToRow(exLog, data.id, userId, i);
            const { data: exData } = await supabase.from('workout_exercise_logs').insert(exPayload as any).select('id').single();
            if (exData) {
               const setsPayload = exLog.sets.map((set, j) => setLogToRow(set, exData.id, data.id, userId, j));
               await supabase.from('workout_set_logs').insert(setsPayload as any);
            }
          }
        }
      }
    }

    store.setSyncStatus('done');
    store.setLocalSyncDone(true);
  } catch (error) {
    console.error('Sync error:', error);
    store.setSyncStatus('error');
  }
}
