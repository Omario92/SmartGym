/**
 * Bottom Tab Navigator — 5 tabs with custom dark styling and neon green active state
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '@/lib/theme';

export const TAB_BAR_HEIGHT = 64;

function FloatingTabBarBackground() {
  // Solid dark gradient instead of BlurView — real-time blur was causing
  // jank on Android (multiple concurrent blurred surfaces on screen).
  return (
    <LinearGradient
      colors={[Colors.bgCard3, Colors.tabBg]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  focused,
  label,
}: {
  name: IconName;
  focused: boolean;
  label: string;
}) {
  const scale = useSharedValue(focused ? 1 : 0.9);
  const glow = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.9, { damping: 12, stiffness: 220 });
    glow.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);

  const animatedWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: focused
      ? Colors.accentGlow2
      : 'transparent',
    opacity: 0.6 + glow.value * 0.4,
    shadowColor: Colors.accent,
    shadowOpacity: focused ? 0.5 * glow.value : 0,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  }));

  return (
    <View style={styles.tabItem}>
      <Animated.View style={[styles.iconWrap, animatedWrapStyle]}>
        <Ionicons
          name={name}
          size={22}
          color={focused ? Colors.tabActive : Colors.tabInactive}
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: Spacing.lg,
          right: Spacing.lg,
          bottom: insets.bottom + Spacing.sm,
          height: TAB_BAR_HEIGHT,
          borderRadius: Radius.full,
          borderWidth: 1,
          borderColor: Colors.glassBorder,
          backgroundColor: 'transparent',
          overflow: 'hidden',
          paddingTop: 0,
          paddingBottom: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 20,
        },
        tabBarBackground: () => <FloatingTabBarBackground />,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Routines',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'clipboard' : 'clipboard-outline'} focused={focused} label="Routines" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} label="Explore" />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'time' : 'time-outline'} focused={focused} label="History" />
          ),
        }}
      />
      <Tabs.Screen
        name="measures"
        options={{
          title: 'Measures',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'body' : 'body-outline'} focused={focused} label="Measures" />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline'} focused={focused} label="More" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.accentGlow2,
  },
});
