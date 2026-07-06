/**
 * lib/api/exerciseApi.ts
 *
 * Raw data fetch layer for exercises.
 * Fetches from Google Apps Script CMS and/or Supabase catalog_exercises table.
 *
 * This layer:
 *  - Makes HTTP/Supabase calls
 *  - Returns raw payloads (no business logic)
 *  - Does NOT cache
 *  - Does NOT transform to domain types
 *
 * Architecture:
 *   Phase 1 → Feature flag OFF → local fallback only
 *   Phase 2 → Feature flag ON  → CMS fetch enabled
 *   Phase 3 → CMS + Supabase   → Supabase becomes primary source
 */

import { supabase } from '@/lib/supabase';
import type { Exercise } from '@/types/exercise';

// ─── Feature flags ────────────────────────────────────────────────────────────

/**
 * Set to true once the CMS URL is configured in .env.
 * Phase 1: false (local fallback)
 * Phase 2: true (CMS fetch enabled)
 */
const CMS_ENABLED =
  !!process.env.EXPO_PUBLIC_CMS_BASE_URL &&
  process.env.EXPO_PUBLIC_CMS_BASE_URL !== 'PLACEHOLDER';

const SUPABASE_CATALOG_ENABLED =
  !!process.env.EXPO_PUBLIC_SUPABASE_URL;

const CMS_BASE_URL = process.env.EXPO_PUBLIC_CMS_BASE_URL ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CMSExerciseResponse {
  version: string;
  count: number;
  exercises: Exercise[];
  generated_at: string;
}

export interface CMSVersionResponse {
  version: string;
  exercises_updated_at: string | null;
  routines_updated_at: string | null;
  generated_at: string;
}

// ─── CMS API calls ────────────────────────────────────────────────────────────

/**
 * Fetch the full exercise catalog from Google Apps Script CMS.
 * Throws if the network request fails.
 */
export async function fetchExercisesFromCMS(): Promise<CMSExerciseResponse> {
  if (!CMS_ENABLED) {
    throw new Error('CMS not configured. Set EXPO_PUBLIC_CMS_BASE_URL in .env');
  }

  const url = `${CMS_BASE_URL}?path=exercises`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`CMS request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as CMSExerciseResponse;

  if ('error' in data) {
    throw new Error(`CMS error: ${(data as any).message}`);
  }

  return data;
}

/**
 * Fetch only the CMS version metadata (lightweight, for stale-check).
 */
export async function fetchCMSVersion(): Promise<CMSVersionResponse> {
  if (!CMS_ENABLED) {
    throw new Error('CMS not configured');
  }

  const url = `${CMS_BASE_URL}?path=version`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });

  if (!res.ok) throw new Error(`CMS version check failed: ${res.status}`);
  return (await res.json()) as CMSVersionResponse;
}

// ─── Supabase catalog calls ───────────────────────────────────────────────────

/**
 * Fetch the exercise catalog from Supabase catalog_exercises table.
 * This is the Phase 3 primary source.
 */
export async function fetchExercisesFromSupabase(): Promise<Exercise[]> {
  if (!SUPABASE_CATALOG_ENABLED) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('catalog_exercises')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(`Supabase exercise fetch failed: ${error.message}`);

  // Map Supabase snake_case rows to app camelCase type
  return (data ?? []).map(mapSupabaseRowToExercise);
}

/**
 * Lightweight change-detection tag for the Supabase catalog: `${count}:${latest_updated_at}`.
 * Changes whenever an active exercise is added, removed, or edited — used to bust the
 * client cache so admin updates appear on the next app open (no 24h wait).
 * Returns null on any failure so callers gracefully keep their existing cache.
 */
export async function fetchSupabaseCatalogVersion(): Promise<string | null> {
  if (!SUPABASE_CATALOG_ENABLED) return null;
  try {
    const { count, error: countErr } = await supabase
      .from('catalog_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    if (countErr) return null;

    const { data, error } = await supabase
      .from('catalog_exercises')
      .select('updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;

    return `${count ?? 0}:${data?.updated_at ?? 'none'}`;
  } catch {
    return null;
  }
}

/**
 * Fetch a single exercise from Supabase by ID.
 */
export async function fetchExerciseByIdFromSupabase(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('catalog_exercises')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data ? mapSupabaseRowToExercise(data) : null;
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapSupabaseRowToExercise(row: Record<string, any>): Exercise {
  return {
    id: row.id,
    slug: row.slug ?? '',
    name: row.name,
    description: row.description ?? '',
    muscleGroup: row.muscle_group,
    secondaryMuscles: row.secondary_muscles ?? [],
    category: row.category ?? undefined,
    equipment: row.equipment,
    type: row.type ?? 'strength',
    difficulty: row.difficulty ?? 'intermediate',
    instructions: row.instructions ?? [],
    tips: row.tips ?? [],
    imageUrl: row.image_url ?? '',
    gifUrl: row.gif_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    media: Array.isArray(row.media) ? row.media : [],
    caloriesPerMinute: row.calories_per_minute ?? undefined,
    isPopular: row.is_popular ?? false,
    source: 'cms',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Health check ─────────────────────────────────────────────────────────────

export function isCMSConfigured(): boolean {
  return CMS_ENABLED;
}

export function isSupabaseCatalogConfigured(): boolean {
  return SUPABASE_CATALOG_ENABLED;
}
