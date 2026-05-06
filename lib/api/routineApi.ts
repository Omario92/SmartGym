/**
 * lib/api/routineApi.ts
 *
 * Raw data fetch layer for default/explore routines from CMS and Supabase.
 * User routines are managed through syncApi.ts and the Supabase routines table.
 */

import { supabase } from '@/lib/supabase';
import type { Routine } from '@/types/routine';

const CMS_ENABLED =
  !!process.env.EXPO_PUBLIC_CMS_BASE_URL &&
  process.env.EXPO_PUBLIC_CMS_BASE_URL !== 'PLACEHOLDER';

const CMS_BASE_URL = process.env.EXPO_PUBLIC_CMS_BASE_URL ?? '';

// ─── CMS ─────────────────────────────────────────────────────────────────────

export interface CMSRoutineResponse {
  version: string;
  count: number;
  routines: Routine[];
  generated_at: string;
}

export async function fetchRoutinesFromCMS(): Promise<CMSRoutineResponse> {
  if (!CMS_ENABLED) throw new Error('CMS not configured');

  const url = `${CMS_BASE_URL}?path=routines`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`CMS routines failed: ${res.status}`);

  const data = await res.json() as CMSRoutineResponse;
  if ('error' in data) throw new Error(`CMS error: ${(data as any).message}`);
  return data;
}

// ─── Supabase — user routines ─────────────────────────────────────────────────

/**
 * Fetch all non-deleted routines for the authenticated user, including their exercises.
 * Returns flat exercise list format (the primary structure used by existing UI).
 */
export async function fetchUserRoutinesFromSupabase(userId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select(`
      *,
      routine_exercises (
        id, exercise_id, exercise_name, display_order,
        sets, reps, weight, rest_seconds, note
      )
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Supabase routine fetch failed: ${error.message}`);

  return (data ?? []).map((row) => mapSupabaseRowToRoutine(row));
}

/**
 * Fetch routines modified after a given timestamp (for incremental sync).
 */
export async function fetchUserRoutinesSince(
  userId: string,
  sinceAt: string
): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select(`
      *,
      routine_exercises (
        id, exercise_id, exercise_name, display_order,
        sets, reps, weight, rest_seconds, note
      )
    `)
    .eq('user_id', userId)
    .gt('updated_at', sinceAt)
    .order('updated_at', { ascending: true });

  if (error) throw new Error(`Incremental routine fetch failed: ${error.message}`);
  return (data ?? []).map(mapSupabaseRowToRoutine);
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapSupabaseRowToRoutine(row: Record<string, any>): Routine {
  const exercises = (row.routine_exercises ?? [])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((ex: any) => ({
      id: ex.id,
      exerciseId: ex.exercise_id,
      exerciseName: ex.exercise_name,
      order: ex.display_order ?? 0,
      sets: ex.sets ?? 3,
      reps: ex.reps ?? undefined,
      weight: ex.weight ?? undefined,
      restSeconds: ex.rest_seconds ?? undefined,
      note: ex.note ?? undefined,
    }));

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    color: row.color ?? '#00FF9D',
    category: row.category ?? undefined,
    estimatedDuration: row.estimated_duration ?? undefined,
    difficulty: row.difficulty ?? undefined,
    source: (row.source ?? 'user') as Routine['source'],
    exercises,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastPerformed: row.last_performed_at ?? undefined,
    deletedAt: row.deleted_at ?? null,
    cloudId: row.id,
    syncStatus: 'synced',
  };
}
