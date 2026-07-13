/**
 * fitnessIcons.tsx — custom fitness/anatomy SVG icons (app identity).
 *
 * Lucide covers generic UI + a few fitness glyphs (Dumbbell, Activity, Flame…),
 * but muscle-group / equipment / training-concept icons are custom so the app
 * has its own identity. Drop the SVG path data from your designer here.
 *
 * HOW TO ADD ONE:
 *   1. Export the icon from your design tool as a 24×24 SVG, stroke-based,
 *      strokeWidth ~2, no fills (so `color` tints it).
 *   2. Copy the inner path(s) — everything inside <svg>…</svg>.
 *   3. Add an entry below via `svgIcon('<path d="…" />')`.
 *
 * Each icon is a component taking { size, color, strokeWidth }.
 */

import React from 'react';
import Svg, { SvgProps } from 'react-native-svg';

export interface FitnessIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Build a stroke icon component from raw SVG inner markup (paths/lines/etc).
 * `inner` is a function returning the child elements so color/strokeWidth apply.
 */
export function svgIcon(
  inner: (p: { color: string; strokeWidth: number }) => React.ReactNode,
  viewBox = '0 0 24 24'
) {
  const Comp: React.FC<FitnessIconProps> = ({ size = 24, color = '#FFFFFF', strokeWidth = 2 }) => {
    const props: SvgProps = {
      width: size,
      height: size,
      viewBox,
      fill: 'none',
      stroke: color,
      strokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    };
    return <Svg {...props}>{inner({ color, strokeWidth })}</Svg>;
  };
  return Comp;
}

/**
 * Registry: custom fitness icon name → component.
 *
 * The names below are the agreed set to provide as custom SVGs. Until an entry
 * is added here, <Icon> falls back to a Lucide placeholder so the app never
 * shows a blank. Fill these in as SVGs arrive.
 *
 * Muscle groups: muscle-chest, muscle-back, muscle-shoulders, muscle-biceps,
 *   muscle-triceps, muscle-core, muscle-glutes, muscle-quads, muscle-hamstrings,
 *   muscle-calves, muscle-fullbody, muscle-map
 * Equipment: eq-barbell, eq-dumbbell, eq-cable, eq-machine, eq-smith,
 *   eq-resistance-band, eq-bodyweight, eq-kettlebell
 * Training: cat-cardio, cat-mobility, cat-stretching, cat-warmup, cat-rest
 * Concepts: routine, routine-template, routine-archived, workout-history
 */
export const FITNESS_ICONS: Record<string, React.FC<FitnessIconProps>> = {
  // Example (replace with real designer SVG):
  // 'muscle-chest': svgIcon(({ color, strokeWidth }) => (
  //   <Path d="M4 7c…" stroke={color} strokeWidth={strokeWidth} />
  // )),
};

/** True if a name is served by the custom fitness registry. */
export function isFitnessIcon(name: string): boolean {
  return name in FITNESS_ICONS;
}
