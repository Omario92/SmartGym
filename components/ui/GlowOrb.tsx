/**
 * GlowOrb — soft blurred color blob used behind glass panels to create
 * the refraction/depth look typical of "liquid glass" UI.
 */
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlowOrbProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
  opacity?: number;
}

export const GlowOrb: React.FC<GlowOrbProps> = ({
  size = 180,
  color = 'rgba(0,255,157,0.35)',
  style,
  opacity = 1,
}) => {
  return (
    <LinearGradient
      colors={[color, 'rgba(0,0,0,0)']}
      start={{ x: 0.5, y: 0.5 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
};
