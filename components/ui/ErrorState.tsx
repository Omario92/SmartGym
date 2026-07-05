/**
 * ErrorState — friendly inline error with an optional retry. Mirrors the
 * EmptyState layout so failures don't feel like a different app.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/lib/theme';
import { Text } from './Text';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Fill available space and center vertically */
  fill?: boolean;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Please check your connection and try again.',
  onRetry,
  retryLabel = 'Try Again',
  fill = false,
  style,
}) => (
  <View style={[styles.container, fill && styles.fill, style]}>
    <View style={styles.iconWrap}>
      <Ionicons name="cloud-offline-outline" size={30} color={Colors.error} />
    </View>
    <Text variant="h4" center style={styles.title}>
      {title}
    </Text>
    <Text color="secondary" center style={styles.message}>
      {message}
    </Text>
    {onRetry ? (
      <Button
        title={retryLabel}
        variant="outline"
        onPress={onRetry}
        icon={<Ionicons name="refresh" size={16} color={Colors.accent} />}
        style={styles.retry}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing['4xl'],
  },
  fill: { flex: 1 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,77,109,0.12)',
    marginBottom: Spacing.lg,
  },
  title: { marginBottom: Spacing.sm },
  message: { lineHeight: 22 },
  retry: { marginTop: Spacing.xl },
});
