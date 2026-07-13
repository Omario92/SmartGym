/**
 * LoadingState — centered spinner with an optional label. Use in place of a
 * bare <ActivityIndicator> so loading feels intentional and on-brand.
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '@/lib/theme';
import { Text } from './Text';

interface LoadingStateProps {
  label?: string;
  /** Fill the available space and center vertically */
  fill?: boolean;
  /** Fixed min height when not filling (default 160) */
  minHeight?: number;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label,
  fill = false,
  minHeight = 160,
  style,
}) => (
  <View style={[styles.container, fill ? styles.fill : { minHeight }, style]}>
    <ActivityIndicator size="large" color={Colors.accent} />
    {label ? (
      <Text color="secondary" style={styles.label}>
        {label}
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  fill: { flex: 1 },
  label: { marginTop: Spacing.md },
});

// Kept as a named export only; screens import { LoadingState }.
