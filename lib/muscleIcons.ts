/**
 * Maps a routine's accent color / category / name to a muscle-group icon.
 * Colors mirror the muscle-group palette in lib/theme.ts (Colors.chest, .back, etc).
 */
import { Colors } from '@/lib/theme';

export const muscleIcons = {
  chest: require('@/assets/icons/muscle-chest.png'),
  back: require('@/assets/icons/muscle-back.png'),
  legs: require('@/assets/icons/muscle-legs.png'),
  shoulders: require('@/assets/icons/muscle-shoulders.png'),
  arms: require('@/assets/icons/muscle-arms.png'),
  core: require('@/assets/icons/muscle-core.png'),
} as const;

type MuscleKey = keyof typeof muscleIcons;

const colorToMuscle: Record<string, MuscleKey> = {
  [Colors.chest.toUpperCase()]: 'chest',
  [Colors.back.toUpperCase()]: 'back',
  [Colors.legs.toUpperCase()]: 'legs',
  [Colors.shoulders.toUpperCase()]: 'shoulders',
  [Colors.arms.toUpperCase()]: 'arms',
  [Colors.core.toUpperCase()]: 'core',
};

export function muscleIconForRoutine(routine: { color?: string; category?: string; name: string }) {
  if (routine.color) {
    const key = colorToMuscle[routine.color.toUpperCase()];
    if (key) return muscleIcons[key];
  }
  const s = `${routine.category || ''} ${routine.name}`.toLowerCase();
  if (s.includes('leg') || s.includes('lower')) return muscleIcons.legs;
  if (s.includes('shoulder')) return muscleIcons.shoulders;
  if (s.includes('arm') || s.includes('bicep') || s.includes('tricep')) return muscleIcons.arms;
  if (s.includes('back') || s.includes('pull')) return muscleIcons.back;
  if (s.includes('core') || s.includes('ab')) return muscleIcons.core;
  return muscleIcons.chest;
}

/** #RRGGBB -> rgba(r,g,b,alpha) */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
