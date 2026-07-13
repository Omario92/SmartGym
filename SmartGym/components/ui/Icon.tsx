/**
 * Icon — the single icon entry point for the app.
 *
 * Backend: Ionicons (@expo/vector-icons) for UI, custom SVGs (fitnessIcons) for
 * fitness/anatomy glyphs.
 *
 * Usage:  <Icon name="chevron-back" size={22} color={Colors.accent} />
 */

import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/lib/theme';
import { FITNESS_ICONS } from './fitnessIcons';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  // Kept for backward compatibility with existing usages
  strokeWidth?: number;
  filled?: boolean;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = Colors.textPrimary,
  strokeWidth = 2,
  filled,
  style,
}) => {
  // 1) Custom fitness/anatomy SVG
  const Fitness = FITNESS_ICONS[name];
  if (Fitness) return <Fitness size={size} color={color} strokeWidth={strokeWidth} />;

  // 2) Check if it's a valid Ionicons name
  if (name in Ionicons.glyphMap) {
    return (
      <Ionicons
        name={name as any}
        size={size}
        color={color}
        style={style}
      />
    );
  }

  // 3) Unmapped → visible placeholder + warning (catches stragglers in dev)
  if (__DEV__) console.warn(`[Icon] Unmapped icon name: "${name}"`);
  return <Ionicons name="help-circle-outline" size={size} color={color} style={style} />;
};

export default Icon;
