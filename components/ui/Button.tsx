import React from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight, Shadow } from '@/lib/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'premium';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

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
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
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
  text: { fontWeight: FontWeight.semibold },
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
