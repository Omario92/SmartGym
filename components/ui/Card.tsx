import React from 'react';
import { View, ViewProps, StyleSheet, Pressable } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '@/lib/theme';

interface CardProps extends ViewProps {
  onPress?: () => void;
  glowing?: boolean;
  premium?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  onPress,
  glowing,
  premium,
  noPadding,
  style,
  children,
  ...props
}) => {
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
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
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
