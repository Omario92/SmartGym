/**
 * exerciseService.ts
 * All Supabase queries + React Query hooks for cloud exercises.
 * Falls back gracefully to local data when unauthenticated or offline.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { ExerciseRow, ExerciseInsert, ExerciseUpdate, CloudExercise } from './supabaseTypes';
import { dbRowToCloudExercise, localCustomToInsert } from './exerciseMapper';
import type { CustomExercise } from './exercises';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const EXERCISE_KEYS = {
  all: ['exercises'] as const,
  myCustom: (userId: string) => ['exercises', 'custom', userId] as const,
  detail: (id: string) => ['exercises', 'detail', id] as const,
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchMyCustomExercises(userId: string): Promise<CloudExercise[]> {
  // Ensure the Supabase auth session is restored before querying (RLS depends on it)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.warn('[exerciseService] getSession error:', sessionError.message);
  if (!session) {
    console.warn('[exerciseService] No active Supabase session — skipping query for userId:', userId);
    return [];
  }
  console.log('[exerciseService] Fetching exercises for user:', userId, '| session uid:', session.user.id);

  // Debug: check how many rows are visible to this session at all
  const { count } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', session.user.id);
  console.log('[exerciseService] Total visible exercises for user (no archived filter):', count);

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('created_by', session.user.id)   // always use session uid, not stale store value
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[exerciseService] fetchMyCustomExercises error:', error);
    throw new Error(error.message);
  }
  console.log('[exerciseService] Fetched', (data ?? []).length, 'exercises');
  return ((data ?? []) as unknown as ExerciseRow[]).map(dbRowToCloudExercise);
}

async function fetchExerciseById(id: string): Promise<CloudExercise> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session. Please sign in again.');

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[exerciseService] fetchExerciseById error:', error);
    throw new Error(error.message);
  }
  return dbRowToCloudExercise(data as unknown as ExerciseRow);
}

// ─── React Query Hooks ────────────────────────────────────────────────────────

/** Fetch all custom exercises owned by the authenticated user */
export function useMyCustomExercises(userId: string | null) {
  return useQuery({
    queryKey: userId ? EXERCISE_KEYS.myCustom(userId) : ['exercises', 'disabled'],
    queryFn: () => fetchMyCustomExercises(userId!),
    enabled: !!userId,
    staleTime: 0,         // always refetch on mount during debug
    gcTime: 0,            // don't cache between navigations
    retry: 1,
  });
}

/** Fetch a single exercise by ID */
export function useExerciseDetail(id: string | null) {
  return useQuery({
    queryKey: id ? EXERCISE_KEYS.detail(id) : ['exercises', 'detail', 'disabled'],
    queryFn: () => fetchExerciseById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Create a new custom exercise */
export function useCreateExercise(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ExerciseInsert): Promise<CloudExercise> => {
      const { data, error } = await supabase
        .from('exercises')
        .insert(payload as never)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return dbRowToCloudExercise(data as unknown as ExerciseRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EXERCISE_KEYS.myCustom(userId) });
    },
  });
}

/** Update an existing exercise */
export function useUpdateExercise(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ExerciseUpdate }): Promise<CloudExercise> => {
      const { data, error } = await supabase
        .from('exercises')
        .update(payload as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return dbRowToCloudExercise(data as unknown as ExerciseRow);
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: EXERCISE_KEYS.myCustom(userId) });
      qc.setQueryData(EXERCISE_KEYS.detail(updated.id), updated);
    },
  });
}

/** Soft-delete (archive) an exercise */
export function useArchiveExercise(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('exercises')
        .update({ is_archived: true } as never)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EXERCISE_KEYS.myCustom(userId) });
    },
  });
}

// ─── Migration: Local → Cloud ─────────────────────────────────────────────────

/**
 * Syncs local Zustand custom exercises to Supabase.
 * Runs once when a user logs in for the first time.
 * Returns a map of { oldLocalId → newCloudId } for store updates.
 */
export async function syncLocalCustomExercisesToSupabase(
  localExercises: CustomExercise[],
  userId: string
): Promise<Record<string, string>> {
  if (localExercises.length === 0) return {};

  const idMap: Record<string, string> = {};

  for (const ex of localExercises) {
    try {
      const payload = localCustomToInsert(ex, userId);
      const { data, error } = await supabase
        .from('exercises')
        .insert(payload as never)
        .select('id')
        .single();

      if (!error && data) {
        idMap[ex.id] = (data as unknown as { id: string }).id;
      }
    } catch {
      console.warn(`[syncLocal] Failed to sync exercise "${ex.name}"`);
    }
  }

  return idMap;
}
