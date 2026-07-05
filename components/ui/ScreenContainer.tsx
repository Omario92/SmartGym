/**
 * ScreenContainer — consistent screen scaffold: safe-area background + a shared
 * screen title header. Keeps horizontal padding, header spacing and the
 * title/subtitle treatment identical across tabs.
 *
 * Non-invasive: renders children as-is, so screens can keep their own
 * ScrollView / FlatList. Use `headerRight` for an action button (e.g. add).
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, FontFamily, Layout } from '@/lib/theme';
import { Text } from './Text';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Large screen title (omit to render no header) */
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  edges?: Edge[];
  /** Extra style for the outer SafeAreaView */
  style?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  title,
  subtitle,
  headerRight,
  edges = ['top'],
  style,
}) => (
  <SafeAreaView style={[styles.container, style]} edges={edges}>
    {title ? (
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? (
            <Text color="secondary" style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
      </View>
    ) : null}
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingX,
    paddingTop: Layout.headerPaddingTop,
    paddingBottom: Spacing.lg,
  },
  headerText: { flex: 1 },
  headerRight: { marginLeft: Spacing.md },
  title: {
    fontSize: FontSize['4xl'],
    fontFamily: FontFamily.display,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 4,
    fontSize: FontSize.sm,
  },
});
