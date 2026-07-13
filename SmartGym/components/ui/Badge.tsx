import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontFamily } from '@/lib/theme';
import { Text } from './Text';

type BadgeVariant = 'accent' | 'secondary' | 'error' | 'warning' | 'info' | 'premium' | 'cyan';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantConfig: Record<BadgeVariant, { bg: string; text: string }> = {
  accent: { bg: Colors.accentGlow, text: Colors.accent },
  secondary: { bg: Colors.bgCard2, text: Colors.textSecondary },
  error: { bg: 'rgba(255,77,109,0.15)', text: Colors.error },
  warning: { bg: 'rgba(255,181,71,0.15)', text: Colors.warning },
  info: { bg: 'rgba(77,166,255,0.15)', text: Colors.info },
  premium: { bg: Colors.premiumGlow, text: '#C044FF' },
  cyan: { bg: 'rgba(0,209,255,0.16)', text: Colors.iconEnergyCyan },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'accent', style }) => {
  const { bg, text } = variantConfig[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={{ color: text, fontSize: FontSize.xs, fontFamily: FontFamily.bodyBold }}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
});
