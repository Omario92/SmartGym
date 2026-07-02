import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
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
  <Animated.View style={styles.container} entering={FadeIn.duration(400)}>
    <Animated.Text
      style={styles.icon}
      entering={ZoomIn.duration(450).springify().damping(12)}
    >
      {icon}
    </Animated.Text>
    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
      <Text variant="h4" center style={styles.title}>
        {title}
      </Text>
      <Text color="secondary" center style={styles.subtitle}>
        {subtitle}
      </Text>
    </Animated.View>
    {action && (
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <Button
          title={action.label}
          onPress={action.onPress}
          variant="outline"
          style={styles.action}
        />
      </Animated.View>
    )}
  </Animated.View>
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
