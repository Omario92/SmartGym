/**
 * MetricCard — compact stat tile (label + value + optional unit / icon / delta).
 * Use for streaks, volume, PRs, weekly totals, etc. Android-safe: solid surface
 * + subtle border, no colored glow.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontFamily, withAlpha } from '@/lib/theme';
import { Text } from './Text';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  /** Accent color for the value / icon chip (defaults to brand accent) */
  accent?: string;
  /** Optional trend caption, e.g. "+12% this week" */
  caption?: string;
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon,
  accent = Colors.accent,
  caption,
  style,
}) => (
  <View style={[styles.card, style]}>
    {icon ? (
      <View style={[styles.iconChip, { backgroundColor: withAlpha(accent, 0.14) }]}>{icon}</View>
    ) : null}
    <Text color="secondary" style={styles.label} numberOfLines={1}>
      {label}
    </Text>
    <View style={styles.valueRow}>
      <Text selectable style={[styles.value, { color: accent }]}>{value}</Text>
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
    {caption ? (
      <Text color="muted" style={styles.caption} numberOfLines={1}>
        {caption}
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    minHeight: 96,
    justifyContent: 'center',
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.xs,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  value: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.display,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  caption: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});
