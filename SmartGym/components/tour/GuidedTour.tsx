/**
 * SmartGym Guided Tour — 7-step spotlight onboarding
 * Highlights tabs with glowing borders and animated tooltips
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, FontSize, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';

/** Height of the floating tab bar (mirrors app/(tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 64;

/** The screen each step reveals behind the overlay so the user sees it live. */
const STEP_ROUTE: Record<string, string> = {
  full: '/',
  tab_routines: '/',
  fab: '/',
  tab_explore: '/explore',
  tab_history: '/history',
  tab_measures: '/measures',
  tab_more: '/more',
};

const TAB_INDEX: Record<string, number> = {
  tab_routines: 0,
  tab_explore: 1,
  tab_history: 2,
  tab_measures: 3,
  tab_more: 4,
};

// ─── Tour Step Configuration ──────────────────────────────────────────────────

export interface TourStep {
  id: number;
  title: string;
  description: string;
  targetArea?: 'full' | 'tab_routines' | 'tab_explore' | 'tab_history' | 'tab_measures' | 'tab_more' | 'fab';
  tooltipPosition?: 'top' | 'bottom' | 'center';
  emoji?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 0,
    title: 'Welcome to SmartGym! 👋',
    description: "Your smart personal trainer lives here. Let's take a quick tour so you know exactly how to build your best body.",
    targetArea: 'full',
    tooltipPosition: 'center',
    emoji: '🏋️',
  },
  {
    id: 1,
    title: 'Routines',
    description: 'Create and manage your workout routines here. Build custom programs tailored to your goals.',
    targetArea: 'tab_routines',
    tooltipPosition: 'top',
    emoji: '📋',
  },
  {
    id: 2,
    title: 'Add Your First Routine',
    description: 'Tap the + button to create a new routine. Add exercises, set reps and weights — everything you need.',
    targetArea: 'fab',
    tooltipPosition: 'top',
    emoji: '➕',
  },
  {
    id: 3,
    title: 'Explore',
    description: 'Discover AI-powered workout plans, expert programs, and thousands of guided exercises.',
    targetArea: 'tab_explore',
    tooltipPosition: 'top',
    emoji: '🔍',
  },
  {
    id: 4,
    title: 'History',
    description: 'Track your progress with detailed stats, performance charts, and achievement awards.',
    targetArea: 'tab_history',
    tooltipPosition: 'top',
    emoji: '📊',
  },
  {
    id: 5,
    title: 'Measures',
    description: 'Log your body measurements and weight to see your transformation over time.',
    targetArea: 'tab_measures',
    tooltipPosition: 'top',
    emoji: '📏',
  },
  {
    id: 6,
    title: "You're All Set! 🎉",
    description: "You've got everything you need. Start building your first routine and let's crush those goals together!",
    targetArea: 'full',
    tooltipPosition: 'center',
    emoji: '🚀',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const GuidedTour: React.FC = () => {
  const { isTourVisible, tourStep, nextTourStep, endTour, setTourStep } = useStore(useShallow((s) => ({
    isTourVisible: s.isTourVisible,
    tourStep: s.tourStep,
    nextTourStep: s.nextTourStep,
    endTour: s.endTour,
    setTourStep: s.setTourStep,
  })));

  const insets = useSafeAreaInsets();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const step = TOUR_STEPS[tourStep];
  const isLastStep = tourStep === TOUR_STEPS.length - 1;

  // Animate on step change
  useEffect(() => {
    if (!isTourVisible) return;

    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 150, friction: 8, useNativeDriver: true }),
    ]).start();

    // Pulsing glow
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [tourStep, isTourVisible]);

  // Reveal the matching screen behind the overlay for the current step so the
  // user sees the real page being described.
  useEffect(() => {
    if (!isTourVisible || !step) return;
    const route = STEP_ROUTE[step.targetArea ?? 'full'];
    if (route) router.navigate(route as never);
  }, [tourStep, isTourVisible]);

  if (!isTourVisible || !step) return null;

  // Floating tab bar geometry (mirrors app/(tabs)/_layout.tsx).
  const barBottom = insets.bottom + Spacing.sm;
  const barTop = SCREEN_H - barBottom - TAB_BAR_HEIGHT;
  const tabW = (SCREEN_W - Spacing.lg * 2) / 5;

  let targetPos: { x: number; y: number; w: number; h: number } | null = null;
  if (step.targetArea === 'fab') {
    // Header "+" button on the Routines screen (top-right).
    targetPos = { x: SCREEN_W - Spacing.xl - 40, y: insets.top + Spacing.lg, w: 40, h: 40 };
  } else if (step.targetArea && step.targetArea in TAB_INDEX) {
    const i = TAB_INDEX[step.targetArea];
    targetPos = { x: Spacing.lg + i * tabW, y: barTop, w: tabW, h: TAB_BAR_HEIGHT };
  }

  const tooltipY = step.targetArea === 'fab'
    ? insets.top + 110
    : step.tooltipPosition === 'top'
    ? barTop - 240
    : step.tooltipPosition === 'bottom'
    ? barTop - 100
    : SCREEN_H / 2 - 160;

  // Lighter dim on screen-focused steps so the live page shows through.
  const overlayDim = step.targetArea && step.targetArea !== 'full' ? 0.45 : 0.8;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      {/* Dimmed overlay — lighter on screen-focused steps so the live page shows */}
      <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayDim})` }]}>

        {/* Spotlight highlight on target */}
        {targetPos && (
          <Animated.View
            style={[
              styles.spotlight,
              {
                left: targetPos.x - 6,
                top: targetPos.y - 6,
                width: targetPos.w + 12,
                height: targetPos.h + 12,
                borderColor: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [Colors.spotlightBorder, Colors.accent],
                }),
                shadowOpacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 0.9],
                }),
              },
            ]}
          />
        )}

        {/* Tooltip card */}
        <Animated.View
          style={[
            styles.tooltip,
            {
              top: tooltipY,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Step indicator */}
          <View style={styles.stepRow}>
            {TOUR_STEPS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setTourStep(i)}>
                <View
                  style={[
                    styles.dot,
                    i === tourStep && styles.dotActive,
                    i < tourStep && styles.dotDone,
                  ]}
                />
              </TouchableOpacity>
            ))}
            <Text color="muted" style={styles.stepLabel}>
              {tourStep + 1} of {TOUR_STEPS.length}
            </Text>
          </View>

          {/* Emoji */}
          {step.emoji && (
            <Text style={styles.emoji}>{step.emoji}</Text>
          )}

          {/* Title */}
          <Text variant="h3" style={styles.title}>
            {step.title}
          </Text>

          {/* Description */}
          <Text color="secondary" style={styles.description}>
            {step.description}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={endTour} style={styles.skipBtn}>
              <Text color="muted" style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <Button
              title={isLastStep ? "Let's Go! 🚀" : 'Next'}
              variant="primary"
              size="md"
              onPress={isLastStep ? endTour : nextTourStep}
              style={styles.nextBtn}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  spotlight: {
    position: 'absolute',
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 20,
  },
  tooltip: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.bgCard3,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    width: 18,
  },
  dotDone: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentDim,
  },
  stepLabel: {
    marginLeft: 'auto',
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  emoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  description: {
    lineHeight: 22,
    marginBottom: Spacing.xl,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: {
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  nextBtn: {
    minWidth: 120,
  },
});
