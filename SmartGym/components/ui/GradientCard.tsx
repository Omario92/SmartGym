/**
 * GradientCard — the premium "Coach AI" card container: a dark diagonal
 * gradient, soft violet border and a subtle violet shadow. No accent glow and
 * no GlowOrb — just the clean gradient framing, reusable across screens.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Gradients } from '@/lib/theme';

interface GradientCardProps {
  children: React.ReactNode;
  /** Gradient tuple (defaults to the Coach AI gradient) */
  colors?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  /** Override the inner padding wrapper */
  contentStyle?: StyleProp<ViewStyle>;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  colors = Gradients.coach,
  style,
  contentStyle,
}) => (
  <View style={[styles.card, style]}>
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View style={[styles.inner, contentStyle]}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xxl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderViolet,
    shadowColor: Colors.iconCinematicViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  inner: {
    padding: Spacing.xl,
  },
});
