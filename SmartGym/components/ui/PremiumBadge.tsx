/**
 * PremiumBadge — small gold "PRO" / premium marker. Reserved for premium & AI
 * moments (the only place gold appears), so it reads as special.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { Colors, Spacing, Radius, FontSize, FontFamily, withAlpha } from '@/lib/theme';
import { Text } from './Text';

interface PremiumBadgeProps {
  label?: string;
  /** Show the sparkle glyph before the label */
  icon?: boolean;
  style?: ViewStyle;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  label = 'PRO',
  icon = true,
  style,
}) => (
  <View style={[styles.badge, style]}>
    {icon ? (
      <Icon name="sparkles" size={10} color={Colors.iconPremiumGold} style={styles.icon} />
    ) : null}
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: withAlpha(Colors.iconPremiumGold, 0.14),
    borderWidth: 1,
    borderColor: withAlpha(Colors.iconPremiumGold, 0.4),
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  icon: { marginRight: 3 },
  label: {
    color: Colors.iconPremiumGold,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 0.5,
  },
});
