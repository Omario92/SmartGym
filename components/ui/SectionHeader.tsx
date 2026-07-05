/**
 * SectionHeader — one consistent way to title a section across every screen.
 *
 * Two looks:
 *  • default  → title (h4) on the left, optional "See all"-style action on the right
 *  • uppercase → small letter-spaced eyebrow label with an optional trailing divider
 *    (matches the "MY ROUTINE" strip on the Routines tab)
 */
import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontFamily, Layout } from '@/lib/theme';
import { Text } from './Text';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned text action (e.g. "See all") */
  action?: { label: string; onPress: () => void };
  /** Render the small uppercase eyebrow style instead of the h4 title */
  uppercase?: boolean;
  /** Show a divider line filling the remaining width (uppercase style only) */
  divider?: boolean;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  uppercase = false,
  divider = false,
  style,
}) => {
  if (uppercase) {
    return (
      <View style={[styles.row, styles.uppercaseRow, style]}>
        <Text style={styles.eyebrow}>{title.toUpperCase()}</Text>
        {divider && <View style={styles.dividerLine} />}
        {action && (
          <Pressable
            onPress={action.onPress}
            hitSlop={12}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text color="accent" style={styles.actionText}>
              {action.label}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <View style={styles.titleWrap}>
        <Text variant="h4">{title}</Text>
        {subtitle ? (
          <Text color="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action && (
        <Pressable
          onPress={action.onPress}
          hitSlop={12}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text color="accent" style={styles.actionText}>
            {action.label}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  uppercaseRow: {
    gap: Spacing.md,
  },
  titleWrap: { flex: 1 },
  subtitle: { marginTop: 2, fontSize: FontSize.sm },
  eyebrow: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textSecondary,
    letterSpacing: 1.2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.glassBorder,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: Layout.minTapTarget,
    paddingLeft: Spacing.sm,
    justifyContent: 'flex-end',
  },
  actionPressed: { opacity: 0.6 },
  actionText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
  },
});
