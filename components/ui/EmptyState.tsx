import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/lib/theme';
import { Text } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, action }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>{icon}</Text>
    <Text variant="h4" center style={styles.title}>
      {title}
    </Text>
    <Text color="secondary" center style={styles.subtitle}>
      {subtitle}
    </Text>
    {action && (
      <Button
        title={action.label}
        onPress={action.onPress}
        variant="outline"
        style={styles.action}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing['4xl'],
  },
  icon: { fontSize: 56, marginBottom: Spacing.xl },
  title: { marginBottom: Spacing.sm },
  subtitle: { lineHeight: 22, textAlign: 'center' },
  action: { marginTop: Spacing.xl },
});
