import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '@/lib/theme';

type Variant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyLg' | 'bodySm' | 'caption' | 'label';
type Color = 'primary' | 'secondary' | 'muted' | 'accent' | 'error' | 'warning' | 'disabled';

interface Props extends TextProps {
  variant?: Variant;
  color?: Color;
  bold?: boolean;
  semibold?: boolean;
  center?: boolean;
}

const variantStyles: Record<Variant, object> = {
  h1: { fontSize: FontSize['4xl'], fontWeight: FontWeight.black, letterSpacing: -1 },
  h2: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, letterSpacing: -0.5 },
  h3: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  h4: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold },
  bodyLg: { fontSize: FontSize.lg, fontWeight: FontWeight.regular },
  body: { fontSize: FontSize.md, fontWeight: FontWeight.regular },
  bodySm: { fontSize: FontSize.sm, fontWeight: FontWeight.regular },
  caption: { fontSize: FontSize.xs, fontWeight: FontWeight.regular },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, letterSpacing: 0.5 },
};

const colorStyles: Record<Color, string> = {
  primary: Colors.textPrimary,
  secondary: Colors.textSecondary,
  muted: Colors.textMuted,
  accent: Colors.accent,
  error: Colors.error,
  warning: Colors.warning,
  disabled: Colors.textDisabled,
};

export const Text: React.FC<Props> = ({
  variant = 'body',
  color = 'primary',
  bold,
  semibold,
  center,
  style,
  ...props
}) => {
  return (
    <RNText
      style={[
        variantStyles[variant],
        { color: colorStyles[color] },
        bold && { fontWeight: FontWeight.bold },
        semibold && { fontWeight: FontWeight.semibold },
        center && { textAlign: 'center' },
        style,
      ]}
      {...props}
    />
  );
};
