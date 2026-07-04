import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Colors, FontSize, FontFamily } from '@/lib/theme';

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
  h1: { fontSize: FontSize['4xl'], fontFamily: FontFamily.display, letterSpacing: -1 },
  h2: { fontSize: FontSize['3xl'], fontFamily: FontFamily.display, letterSpacing: -0.5 },
  h3: { fontSize: FontSize['2xl'], fontFamily: FontFamily.display },
  h4: { fontSize: FontSize.xl, fontFamily: FontFamily.displayMedium },
  bodyLg: { fontSize: FontSize.lg, fontFamily: FontFamily.body },
  body: { fontSize: FontSize.md, fontFamily: FontFamily.body },
  bodySm: { fontSize: FontSize.sm, fontFamily: FontFamily.body },
  caption: { fontSize: FontSize.xs, fontFamily: FontFamily.body },
  label: { fontSize: FontSize.sm, fontFamily: FontFamily.bodyBold, letterSpacing: 0.5 },
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
        bold && { fontFamily: FontFamily.bodyBold },
        semibold && { fontFamily: FontFamily.bodyBold },
        center && { textAlign: 'center' },
        style,
      ]}
      {...props}
    />
  );
};
