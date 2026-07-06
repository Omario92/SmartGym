/**
 * Bottom Tab Navigator — floating liquid-glass pill tab bar (see GlassTabBar).
 * The visual + sizing live in components/ui/GlassTabBar.tsx; this file just
 * registers the routes and wires the custom `tabBar`.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { GlassTabBar } from '@/components/ui/GlassTabBar';
import { TabBar } from '@/lib/theme';

/** Total pill height — screens use this to pad their scroll content clear of the bar. */
export const TAB_BAR_HEIGHT = TabBar.height;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Routines' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="measures" options={{ title: 'Measures' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
