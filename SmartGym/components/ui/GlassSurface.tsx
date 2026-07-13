/**
 * GlassSurface — premium dark "neon glass" panel, WITHOUT runtime blur.
 *
 * expo-blur (BlurView) is expensive on Android — many concurrent blurred
 * panels (cards, tab bar, header buttons, FAB) caused visible jank on
 * emulator/low-end devices. This component keeps the same visual language
 * (translucent-looking surface, soft emerald border, subtle sheen) using
 * only solid gradients — no blur, no per-frame compositing cost.
 *
 * API is unchanged so callers don't need to change (radius/accent/strong/
 * onPress/noBorder). `intensity`/`tint` are accepted but unused, kept for
 * backwards compatibility with existing call sites.
 */
import React from 'react';
import { View, ViewProps, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Radius } from '@/lib/theme';

interface GlassSurfaceProps extends ViewProps {
  radius?: number;
  /** @deprecated kept for API compatibility, no longer used (blur removed) */
  intensity?: number;
  /** @deprecated kept for API compatibility, no longer used (blur removed) */
  tint?: 'dark' | 'light' | 'default';
  accent?: boolean;
  strong?: boolean;
  onPress?: () => void;
  noBorder?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  radius = Radius.lg,
  accent = false,
  strong = false,
  onPress,
  noBorder = false,
  style,
  children,
  ...props
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const gradientColors = strong
    ? [Colors.bgCard3, Colors.bgCard2]
    : [Colors.bgCard2, Colors.bgCard];

  const inner = (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: noBorder
            ? 'transparent'
            : accent
            ? Colors.glassBorderAccent
            : Colors.border,
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors as [string, string]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {accent && (
        <LinearGradient
          colors={[Colors.accentGlow2, 'rgba(0,255,157,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          pointerEvents="none"
        />
      )}
      <View {...props} style={style}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.96, { duration: 90 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        }}
        style={animatedStyle}
      >
        {inner}
      </AnimatedPressable>
    );
  }

  return inner;
};
