import React from 'react';
import {
  Pressable,
  View,
  ActivityIndicator,
  StyleSheet,
  PressableProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, FontSize, FontFamily, Shadow } from '@/lib/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'premium';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  style?: PressableProps['style'];
  haptics?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  iconRight,
  fullWidth,
  style,
  disabled,
  haptics = true,
  onPress,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      onPress={(e) => {
        if (haptics && !isDisabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.(e);
      }}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style as any,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.accent : '#000'}
        />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.text,
              styles[`text_${variant}` as keyof typeof styles],
              styles[`text_${size}` as keyof typeof styles],
            ]}
          >
            {title}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },

  // Variants
  primary: {
    backgroundColor: Colors.accent,
    ...Shadow.accentGlow,
  },
  secondary: {
    backgroundColor: Colors.bgCard2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
  },
  premium: {
    backgroundColor: Colors.premiumStart,
    ...Shadow.premiumGlow,
  },

  // Sizes
  sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm - 2, minHeight: 36 },
  md: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, minHeight: 44 },
  lg: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, minHeight: 52 },

  // Text base
  text: { fontFamily: FontFamily.bodyBold },
  text_primary: { color: '#000' },
  text_secondary: { color: Colors.textPrimary },
  text_outline: { color: Colors.accent },
  text_ghost: { color: Colors.accent },
  text_danger: { color: '#fff' },
  text_premium: { color: '#fff' },

  text_sm: { fontSize: FontSize.sm },
  text_md: { fontSize: FontSize.md },
  text_lg: { fontSize: FontSize.lg },

  // Disabled
  disabled: { opacity: 0.5 },
});
