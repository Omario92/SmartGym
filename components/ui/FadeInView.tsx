/**
 * FadeInView — a mount fade/rise animation driven by a Reanimated shared value
 * (worklet), NOT the layout `entering=` API.
 *
 * Why: Reanimated 4's `entering={FadeIn}` layout animations don't fire in the
 * Expo Go runtime and leave the view stuck at opacity 0. Worklet-driven values
 * (useSharedValue + withTiming in an effect) DO run there — the same mechanism
 * used by the swipe rows and context menu — so this restores the polish without
 * the "invisible content" bug.
 */
import React from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface FadeInViewProps extends ViewProps {
  /** Delay before animating in (ms) */
  delay?: number;
  /** Fade duration (ms) */
  duration?: number;
  /** Upward travel distance (px). Set 0 for a pure fade. */
  distance?: number;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  delay = 0,
  duration = 350,
  distance = 10,
  style,
  children,
  ...props
}) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return (
    <Animated.View {...props} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};
