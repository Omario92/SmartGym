import React from 'react';
import { View, ViewProps, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing, Shadow } from '@/lib/theme';

interface CardProps extends ViewProps {
  onPress?: () => void;
  glowing?: boolean;
  premium?: boolean;
  noPadding?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card: React.FC<CardProps> = ({
  onPress,
  glowing,
  premium,
  noPadding,
  style,
  children,
  ...props
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <View
      style={[
        styles.card,
        glowing && styles.glowing,
        premium && styles.premium,
        noPadding && { padding: 0 },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 90 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        }}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  glowing: {
    borderColor: Colors.accentGlow,
    ...Shadow.accentGlow,
  },
  premium: {
    borderColor: Colors.premiumGlow,
    ...Shadow.premiumGlow,
  },
});
