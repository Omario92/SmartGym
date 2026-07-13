/**
 * useCatalogExercises — single source of truth for the browsable exercise list.
 *
 * Reads the Supabase catalog (admin-managed) via exerciseRepository and maps it
 * to the legacy `Exercise` shape used by the cards + detail modal, so admin
 * edits (instructions, tips, description, image, video) actually reach the app.
 *
 * Falls back to the bundled EXERCISES literal until the catalog resolves (and if
 * the fetch fails), so the screen is never empty. Refreshes on focus, so edits
 * appear when the user returns to the screen.
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { exerciseRepository } from '@/lib/repositories/exerciseRepository';
import { EXERCISES, type Exercise } from '@/lib/exercises';
import type { MediaItem } from '@/lib/supabaseTypes';

/** Legacy Exercise plus the media fields the detail modal needs for video. */
export type CatalogExercise = Exercise & {
  media?: MediaItem[];
  videoUrl?: string;
};

/** Map a repository (types/exercise) row to the legacy shape the UI renders. */
function toCatalogExercise(e: Record<string, any>): CatalogExercise {
  const media: MediaItem[] | undefined = Array.isArray(e.media) ? e.media : undefined;
  const image =
    e.imageUrl ||
    e.image ||
    media?.find((m) => m.type === 'image')?.url ||
    '';
  return {
    id: e.id,
    name: e.name,
    muscleGroup: e.muscleGroup,
    secondaryMuscles: e.secondaryMuscles,
    equipment: e.equipment,
    type: e.type,
    description: e.description ?? '',
    instructions: e.instructions ?? [],
    tips: e.tips ?? [],
    difficulty: e.difficulty,
    isPopular: e.isPopular,
    image,
    gif: e.gifUrl ?? e.gif,
    media,
    videoUrl: e.videoUrl,
  };
}

export function useCatalogExercises() {
  const [exercises, setExercises] = useState<CatalogExercise[]>(() => EXERCISES);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await exerciseRepository.getAll();
      if (Array.isArray(list) && list.length > 0) {
        setExercises(list.map(toCatalogExercise));
      }
    } catch {
      // keep the bundled fallback already in state
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { exercises, loading, reload: load };
}
