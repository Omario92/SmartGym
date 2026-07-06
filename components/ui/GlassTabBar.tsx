/**
 * GlassTabBar — floating pill-shaped tab bar with an authentic iOS "liquid
 * glass" (frosted blur) effect. Rendered via expo-router's `tabBar` prop.
 *
 * • iOS   → real `expo-blur` BlurView (dark tint) + a subtle frosted overlay,
 *           glass border and soft shadow.
 * • Android → solid translucent dark surface + border (blur is expensive and
 *           bands on Android, so we degrade gracefully as required).
 *
 * Only the visual treatment + sizing changed: icon shapes/colors, the active
 * green highlight, and tab order are all preserved.
 */
import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Radius, FontFamily, TabBar } from '@/lib/theme';
import { Text } from './Text';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Route → icon / label. Mirrors the previous per-screen config; kept here so the
// custom bar fully controls sizing.
const TABS: Record<string, { active: IconName; inactive: IconName; label: string }> = {
  index: { active: 'clipboard', inactive: 'clipboard-outline', label: 'Routines' },
  explore: { active: 'grid', inactive: 'grid-outline', label: 'Explore' },
  history: { active: 'time', inactive: 'time-outline', label: 'History' },
  measures: { active: 'body', inactive: 'body-outline', label: 'Measures' },
  more: {
    active: 'ellipsis-horizontal-circle',
    inactive: 'ellipsis-horizontal-circle-outline',
    label: 'More',
  },
};

// Minimal structural type for the props expo-router hands the tabBar. The
// navigation object's real type is broad, so keep it loose to avoid friction.
interface GlassTabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}

const TabItem: React.FC<{
  focused: boolean;
  icon: IconName;
  label: string;
  onPress: () => void;
}> = ({ focused, icon, label, onPress }) => {
  const t = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused]);

  const pillStyle = useAnimatedStyle(() => ({ opacity: t.value }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.92 + t.value * 0.08 }] }));

  const color = focused ? Colors.tabActive : Colors.tabInactive;

  return (
    <Pressable style={styles.item} onPress={onPress} hitSlop={6} accessibilityRole="tab">
      <Animated.View style={[styles.itemInner, scaleStyle]}>
        <Animated.View style={[styles.itemPill, pillStyle]} pointerEvents="none" />
        <Ionicons name={icon} size={TabBar.iconSize} color={color} />
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export const GlassTabBar: React.FC<GlassTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrap, { bottom: insets.bottom + TabBar.gap }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        {/* Frosted background */}
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={TabBar.blurIntensity}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
        )}
        {/* Subtle dark frost + top sheen so it reads as glass on any content */}
        <View style={[StyleSheet.absoluteFill, styles.frost]} pointerEvents="none" />
        <View style={styles.sheen} pointerEvents="none" />

        {/* Tabs */}
        <View style={styles.row}>
          {state.routes.map((route, i) => {
            const cfg = TABS[route.name];
            if (!cfg) return null;
            const focused = state.index === i;
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return (
              <TabItem
                key={route.key}
                focused={focused}
                icon={focused ? cfg.active : cfg.inactive}
                label={cfg.label}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: TabBar.marginX,
    right: TabBar.marginX,
    height: TabBar.height,
    // Soft floating shadow (iOS); Android draws its own via elevation on pill.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  pill: {
    flex: 1,
    borderRadius: Radius.full,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    elevation: 20,
  },
  androidBg: {
    backgroundColor: Colors.tabBarSolid,
  },
  frost: {
    backgroundColor: Colors.tabBarTint,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.glassSheenTop,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.lg,
    minWidth: 56,
  },
  itemPill: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.lg,
    backgroundColor: Colors.tabBarActivePill,
  },
  label: {
    fontSize: TabBar.labelSize,
    fontFamily: FontFamily.bodyBold,
    marginTop: 1,
  },
});
