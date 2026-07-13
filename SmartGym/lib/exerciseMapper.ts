/**
 * exerciseMapper.ts
 * Converts between Supabase DB rows and the app-level Exercise / CloudExercise type.
 */

import type { Exercise, CustomExercise } from './exercises';
import type { ExerciseRow, ExerciseInsert, CloudExercise, MediaItem } from './supabaseTypes';
import { getExerciseImage, EXERCISE_FALLBACK_IMAGE } from './exerciseImages';

// ─── DB → App ─────────────────────────────────────────────────────────────────

export function dbRowToCloudExercise(row: ExerciseRow): CloudExercise {
  const media: MediaItem[] = Array.isArray(row.media) ? row.media : [];
  const imageItem = media.find((m) => m.type === 'image');
  const gifItem = media.find((m) => m.type === 'gif');

  // Normalize name to snake_case slug as a backup key (since row.id might be a random UUID)
  const nameSlug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '');
  const idImage = getExerciseImage(row.id);
  const resolvedImage = imageItem?.url ?? gifItem?.thumbnailUrl ?? (idImage !== EXERCISE_FALLBACK_IMAGE ? idImage : getExerciseImage(nameSlug));

  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    secondaryMuscles: row.secondary_muscles ?? [],
    equipment: row.equipment,
    type: row.type,
    description: row.description ?? '',
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    tips: Array.isArray(row.tips) ? row.tips : [],
    difficulty: row.difficulty,
    image: resolvedImage,
    gif: gifItem?.url,
    media,
    source: row.is_public && !row.created_by ? 'default' : 'custom',
    isCustom: row.is_public && !row.created_by ? undefined : true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.created_by ?? undefined,
    notes: row.notes ?? undefined,
    isArchived: row.is_archived,
  };
}

// ─── CloudExercise → CustomExercise (for use in local pickers/routines) ──────

export function cloudExerciseToCustom(ex: CloudExercise): CustomExercise {
  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup as CustomExercise['muscleGroup'],
    secondaryMuscles: ex.secondaryMuscles,
    equipment: ex.equipment as CustomExercise['equipment'],
    type: ex.type as CustomExercise['type'],
    description: ex.description,
    instructions: ex.instructions,
    tips: ex.tips,
    difficulty: ex.difficulty as CustomExercise['difficulty'],
    image: ex.image || '',
    gif: ex.gif,
    isCustom: true as const,
    isCloud: true,               // marker: originated from Supabase
    userId: ex.userId,
    notes: ex.notes,
    createdAt: ex.createdAt ?? new Date().toISOString(),
  };
}

// ─── Local Exercise → CloudExercise (for unified lists) ──────────────────────

export function localExerciseToCloud(ex: Exercise | CustomExercise): CloudExercise {
  const isCustom = 'isCustom' in ex && ex.isCustom;
  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    secondaryMuscles: ex.secondaryMuscles ?? [],
    equipment: ex.equipment,
    type: ex.type,
    description: ex.description,
    instructions: ex.instructions,
    tips: ex.tips,
    difficulty: ex.difficulty,
    image: ex.image ?? '',
    gif: ex.gif,
    media: ex.image ? [{ url: ex.image, type: 'image' }] : [],
    source: isCustom ? 'custom' : 'default',
    isCustom: isCustom ? true : undefined,
    isPopular: ex.isPopular,
    userId: isCustom ? (ex as CustomExercise).userId : undefined,
    notes: isCustom ? (ex as CustomExercise).notes : undefined,
    createdAt: isCustom ? (ex as CustomExercise).createdAt : undefined,
  };
}

// ─── App form data → DB Insert ────────────────────────────────────────────────

export interface ExerciseFormData {
  name: string;
  muscleGroup: string;
  equipment: string;
  type: string;
  difficulty: string;
  description: string;
  instructions: string[];
  tips: string[];
  notes: string;
  media: MediaItem[];
  isPublic: boolean;
}

export function formDataToInsert(
  data: ExerciseFormData,
  userId: string
): ExerciseInsert {
  return {
    name: data.name.trim(),
    slug: null,
    muscle_group: data.muscleGroup as ExerciseRow['muscle_group'],
    secondary_muscles: [],
    equipment: data.equipment as ExerciseRow['equipment'],
    type: (data.type || 'strength') as ExerciseRow['type'],
    description: data.description.trim() || null,
    instructions: data.instructions.filter(Boolean),
    tips: data.tips.filter(Boolean),
    difficulty: (data.difficulty || 'intermediate') as ExerciseRow['difficulty'],
    is_public: data.isPublic,
    created_by: userId,
    media: data.media,
    notes: data.notes.trim() || null,
    is_archived: false,
  };
}

/** Convert a local CustomExercise to an insert payload for migration */
export function localCustomToInsert(
  ex: CustomExercise,
  userId: string
): ExerciseInsert {
  const mediaItems: MediaItem[] = ex.image
    ? [{ url: ex.image, type: ex.imageIsLocal ? 'image' : 'image', storagePath: undefined }]
    : [];
  return {
    name: ex.name,
    slug: null,
    muscle_group: ex.muscleGroup,
    secondary_muscles: ex.secondaryMuscles ?? [],
    equipment: ex.equipment,
    type: ex.type,
    description: ex.description || null,
    instructions: ex.instructions,
    tips: ex.tips,
    difficulty: ex.difficulty,
    is_public: false,
    created_by: userId,
    media: mediaItems,
    notes: ex.notes ?? null,
    is_archived: false,
  };
}
