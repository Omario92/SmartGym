/**
 * Routines Tab — Lists all workout routines
 * Empty state, routine cards, FAB to add new routine
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontFamily, Shadow, Gradients } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeInView } from '@/components/ui/FadeInView';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { GlowOrb } from '@/components/ui/GlowOrb';
import { AI_COACH_SVG, STREAK_SVG } from '@/components/ui/designIcons';
import { muscleIconForRoutine, hexToRgba } from '@/lib/muscleIcons';
import { TAB_BAR_HEIGHT } from './_layout';
import { useStore } from '@/store';
import type { Routine } from '@/store';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Local YYYY-MM-DD key for a date */
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Monday-first index (0 = Mon … 6 = Sun) */
const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

/**
 * Derive real weekly activity + current streak from workout history, so the
 * Coach card reflects actual data instead of hardcoded placeholders.
 */
function computeActivity(sessionDates: string[]): {
  streak: number;
  weekActive: boolean[];
  todayIndex: number;
} {
  const days = new Set(sessionDates.map((iso) => dayKey(new Date(iso))));
  const today = new Date();

  // Streak: consecutive days worked out ending today or yesterday.
  let streak = 0;
  const cursor = new Date(today);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1); // allow "yesterday"
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // This week's activity (Monday → Sunday)
  const weekActive = Array<boolean>(7).fill(false);
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayIndex(today));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekActive[i] = days.has(dayKey(d));
  }

  return { streak, weekActive, todayIndex: mondayIndex(today) };
}

// ─── Routine Card ─────────────────────────────────────────────────────────────

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ACTIONS_WIDTH = 208;

/** The visual card — reused in the list and in the long-press preview. */
const RoutineCardBody: React.FC<{
  routine: Routine;
  onStart?: () => void;
  onPressBody?: () => void;
  onLongPress?: () => void;
  preview?: boolean;
}> = ({ routine, onStart, onPressBody, onLongPress, preview }) => {
  const accentColor = routine.color || Colors.accent;
  const muscleIcon = muscleIconForRoutine(routine);

  return (
    <View style={styles.routineCard}>
      <View style={[styles.routineIconPanel, { backgroundColor: hexToRgba(accentColor, 0.08) }]}>
        <Image source={muscleIcon} style={styles.routineIconImg} resizeMode="contain" />
      </View>

      <Pressable
        style={styles.routineContent}
        onPress={onPressBody}
        onLongPress={onLongPress}
        delayLongPress={280}
        disabled={preview}
      >
        <Text style={styles.routineName} numberOfLines={1}>
          {routine.name}
        </Text>
        {routine.description && (
          <Text style={styles.routineDesc} numberOfLines={2}>
            {routine.description}
          </Text>
        )}
        <View style={styles.statRow}>
          <Text style={styles.statText}>{routine.exercises.length} exercises</Text>
          {routine.estimatedDuration && (
            <Text style={styles.statText}>~{routine.estimatedDuration} min</Text>
          )}
        </View>
      </Pressable>

      <Pressable style={styles.goBtn} onPress={onStart} hitSlop={8} disabled={preview}>
        <Image source={require('@/assets/icons/go-icon.png')} style={styles.goIcon} />
      </Pressable>
    </View>
  );
};

/** A single circular quick-action revealed by swiping. */
const SwipeAction: React.FC<{
  icon: IconName;
  label: string;
  bg: string;
  color: string;
  onPress: () => void;
}> = ({ icon, label, bg, color, onPress }) => (
  <TouchableOpacity style={styles.swipeAction} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.swipeActionCircle, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.swipeActionLabel}>{label}</Text>
  </TouchableOpacity>
);

/** Routine row: swipe left to reveal More / Archive / Remove; long-press for the menu. */
const SwipeableRoutineCard: React.FC<{
  routine: Routine;
  isOpen: boolean;
  onRequestOpen: () => void;
  onRequestClose: () => void;
  onStart: () => void;
  onLongPress: () => void;
  onMore: () => void;
  onArchive: () => void;
  onRemove: () => void;
}> = ({ routine, isOpen, onRequestOpen, onRequestClose, onStart, onLongPress, onMore, onArchive, onRemove }) => {
  const tx = useSharedValue(0);
  const startX = useSharedValue(0);

  React.useEffect(() => {
    tx.value = withSpring(isOpen ? -ACTIONS_WIDTH : 0, { damping: 18, stiffness: 220 });
  }, [isOpen]);

  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      startX.value = tx.value;
    })
    .onUpdate((e) => {
      tx.value = Math.min(0, Math.max(-ACTIONS_WIDTH, startX.value + e.translationX));
    })
    .onEnd(() => {
      if (tx.value < -ACTIONS_WIDTH / 2) {
        tx.value = withSpring(-ACTIONS_WIDTH, { damping: 18, stiffness: 220 });
        runOnJS(onRequestOpen)();
      } else {
        tx.value = withSpring(0, { damping: 18, stiffness: 220 });
        runOnJS(onRequestClose)();
      }
    });

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <View style={styles.swipeWrap}>
      <View style={styles.swipeActionRow}>
        <SwipeAction icon="ellipsis-horizontal" label="More" bg={Colors.surfaceHigh} color={Colors.textPrimary} onPress={onMore} />
        <SwipeAction icon="archive" label="Archive" bg={Colors.info} color={Colors.textOnDark} onPress={onArchive} />
        <SwipeAction icon="trash" label="Remove" bg={Colors.error} color={Colors.textOnDark} onPress={onRemove} />
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={animStyle}>
          <RoutineCardBody
            routine={routine}
            onStart={() => (isOpen ? onRequestClose() : onStart())}
            onPressBody={() => (isOpen ? onRequestClose() : onLongPress())}
            onLongPress={onLongPress}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── Long-press context menu ───────────────────────────────────────────────────

const MenuRow: React.FC<{
  icon: IconName;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}> = ({ icon, label, destructive, onPress }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
    <Ionicons name={icon} size={20} color={destructive ? Colors.error : Colors.textPrimary} />
    <Text style={[styles.menuLabel, destructive && { color: Colors.error }]}>{label}</Text>
  </TouchableOpacity>
);

const RoutineContextMenu: React.FC<{
  routine: Routine | null;
  haptics?: boolean;
  onClose: () => void;
  onStart: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}> = ({ routine, haptics, onClose, onStart, onEdit, onDuplicate, onArchive, onDelete }) => {
  const scale = useSharedValue(0.94);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  React.useEffect(() => {
    if (routine) {
      // Snappy iOS-style "lift + settle" as the menu takes over.
      scale.value = withSpring(1, { damping: 16, stiffness: 240, mass: 0.6 });
      translateY.value = withSpring(0, { damping: 16, stiffness: 240, mass: 0.6 });
      opacity.value = withTiming(1, { duration: 130 });
    } else {
      scale.value = 0.94;
      translateY.value = 14;
      opacity.value = 0;
    }
  }, [routine]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const run = (fn: () => void) => {
    if (haptics) {
      Haptics.selectionAsync().catch(() => {});
    }
    onClose();
    fn();
  };

  return (
    <Modal visible={!!routine} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        {routine ? (
          <Animated.View style={[styles.menuContent, contentStyle]}>
            <View style={styles.menuPreview} pointerEvents="none">
              <RoutineCardBody routine={routine} preview />
            </View>

            {routine.exercises.length > 0 ? (
              <View style={styles.previewExercises} pointerEvents="none">
                <Text style={styles.previewExTitle}>
                  {routine.exercises.length} EXERCISE{routine.exercises.length > 1 ? 'S' : ''}
                </Text>
                {routine.exercises.slice(0, 5).map((ex, i) => (
                  <View key={`${ex.exerciseId}-${i}`} style={styles.previewExRow}>
                    <View style={styles.previewExDot} />
                    <Text style={styles.previewExName} numberOfLines={1}>
                      {ex.exerciseName}
                    </Text>
                    <Text style={styles.previewExMeta}>
                      {ex.sets} × {ex.reps ?? '—'}
                      {ex.weight ? ` · ${ex.weight}kg` : ''}
                    </Text>
                  </View>
                ))}
                {routine.exercises.length > 5 && (
                  <Text style={styles.previewExMore}>
                    +{routine.exercises.length - 5} more
                  </Text>
                )}
              </View>
            ) : null}

            <View style={styles.menuList}>
              <MenuRow icon="play" label="Start Workout" onPress={() => run(onStart)} />
              <View style={styles.menuDivider} />
              <MenuRow icon="create-outline" label="Edit" onPress={() => run(onEdit)} />
              <View style={styles.menuDivider} />
              <MenuRow icon="copy-outline" label="Duplicate" onPress={() => run(onDuplicate)} />
              <View style={styles.menuDivider} />
              <MenuRow icon="archive-outline" label="Archive" onPress={() => run(onArchive)} />
              <View style={styles.menuDivider} />
              <MenuRow icon="trash-outline" label="Delete" destructive onPress={() => run(onDelete)} />
            </View>
          </Animated.View>
        ) : null}
      </Pressable>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RoutinesScreen() {
  const rawRoutines = useStore(s => s.routines) || [];
  const deleteRoutine = useStore(s => s.deleteRoutine);
  const duplicateRoutine = useStore(s => s.duplicateRoutine);
  const archiveRoutine = useStore(s => s.archiveRoutine);
  const sessions = useStore(s => s.sessions) || [];
  const hapticsEnabled = useStore(s => s.settings.hapticFeedback);

  const [search, setSearch] = useState('');
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [menuRoutine, setMenuRoutine] = useState<Routine | null>(null);

  const { streak, weekActive } = React.useMemo(
    () => computeActivity(sessions.map((s) => s.startedAt)),
    [sessions]
  );

  // Deduplicate routines by ID and content signature to prevent duplicates in UI
  const routines = React.useMemo(() => {
    const map = new Map<string, Routine>();
    const seenSignatures = new Set<string>();

    rawRoutines.forEach((r) => {
      if (!r.deletedAt && !r.archived && r.id) {
        const signature = `${r.name.trim()}_${(r.description || '').trim()}_${r.exercises.length}`;
        if (!map.has(r.id) && !seenSignatures.has(signature)) {
          map.set(r.id, r);
          seenSignatures.add(signature);
        }
      }
    });
    return Array.from(map.values());
  }, [rawRoutines]);

  const filtered = React.useMemo(() => {
    return routines.filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [routines, search]);

  const handleStartWorkout = (routine: Routine) => {
    setOpenSwipeId(null);
    useStore.getState().startWorkout(routine);
    router.push('/workout/active');
  };

  const openMenu = (routine: Routine) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setOpenSwipeId(null);
    setMenuRoutine(routine);
  };

  const handleArchive = (routine: Routine) => {
    setOpenSwipeId(null);
    archiveRoutine(routine.id);
  };

  const handleRemove = (routine: Routine) => {
    setOpenSwipeId(null);
    Alert.alert('Delete Routine', `Delete "${routine.name}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRoutine(routine.id) },
    ]);
  };

  const insets = useSafeAreaInsets();
  const scrollBottomPad = insets.bottom + TAB_BAR_HEIGHT + Spacing.xxxl;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Routines</Text>
          <Text color="secondary" style={styles.subtitle}>
            Your workouts, organized.
          </Text>
        </View>
        <GlassSurface
          radius={20}
          accent
          strong
          onPress={() => router.push('/routine/create')}
          style={styles.headerBtnInner}
        >
          <Ionicons name="add" size={22} color={Colors.accent} />
        </GlassSurface>
      </View>

      {/* Search */}
      {routines.length > 0 && (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.iconInactive} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routines..."
            placeholderTextColor={Colors.iconInactive}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.iconInactive} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Coach AI Hero Card */}
        <FadeInView style={styles.coachCard}>
          <LinearGradient
            colors={Gradients.coach}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <GlowOrb size={160} color="rgba(0,209,255,0.28)" style={{ top: -60, right: -40 }} />

          <View style={styles.coachTopRow}>
            <SvgXml xml={AI_COACH_SVG} width={52} height={52} />
            <View style={{ flex: 1 }}>
              <View style={styles.coachTitleRow}>
                <Text style={styles.coachTitle}>Coach AI</Text>
                <Badge label="BETA" variant="cyan" />
              </View>
              <Text style={styles.coachSubtitle}>
                {streak > 0
                  ? `${streak}-day streak — keep the momentum going`
                  : 'Start a workout to build your streak'}
              </Text>
            </View>
          </View>

          <View style={styles.coachBottomRow}>
            <Pressable style={styles.coachBtn} onPress={() => router.push('/explore')}>
              <LinearGradient
                colors={Gradients.aiButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.coachBtnText}>Build a Plan</Text>
              <Ionicons name="arrow-forward" size={15} color={Colors.textPrimary} />
            </Pressable>

            <View style={styles.streakBox}>
              <SvgXml xml={STREAK_SVG} width={20} height={20} />
              <Text style={styles.streakValue}>{streak}</Text>
            </View>
          </View>
        </FadeInView>

        {/* Weekly streak strip */}
        <View style={styles.weekStrip}>
          {WEEK_DAYS.map((day, i) => (
            <View key={i} style={styles.weekDayItem}>
              <View style={[styles.weekDot, weekActive[i] && styles.weekDotActive]} />
              <Text style={styles.weekDayLabel}>{day}</Text>
            </View>
          ))}
        </View>

        {routines.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No Routines Yet"
            subtitle="Create your first workout routine to get started on your fitness journey."
            action={{ label: '+ Create Routine', onPress: () => router.push('/routine/create') }}
          />
        ) : (
          <>
            <SectionHeader
              title="My Routine"
              uppercase
              divider
              style={styles.routineSectionHeader}
            />

            {/* Routine List */}
            {filtered.map((routine, i) => (
              <FadeInView key={routine.id} delay={Math.min(i, 6) * 50}>
                <SwipeableRoutineCard
                  routine={routine}
                  isOpen={openSwipeId === routine.id}
                  onRequestOpen={() => setOpenSwipeId(routine.id)}
                  onRequestClose={() => setOpenSwipeId((cur) => (cur === routine.id ? null : cur))}
                  onStart={() => handleStartWorkout(routine)}
                  onLongPress={() => openMenu(routine)}
                  onMore={() => openMenu(routine)}
                  onArchive={() => handleArchive(routine)}
                  onRemove={() => handleRemove(routine)}
                />
              </FadeInView>
            ))}

            {filtered.length === 0 && search.length > 0 && (
              <View style={styles.noResults}>
                <Text color="muted" center>
                  No routines matching &quot;{search}&quot;
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Long-press context menu */}
      <RoutineContextMenu
        routine={menuRoutine}
        haptics={hapticsEnabled}
        onClose={() => setMenuRoutine(null)}
        onStart={() => menuRoutine && handleStartWorkout(menuRoutine)}
        onEdit={() => menuRoutine && router.push(`/routine/${menuRoutine.id}`)}
        onDuplicate={() => menuRoutine && duplicateRoutine(menuRoutine.id)}
        onArchive={() => menuRoutine && archiveRoutine(menuRoutine.id)}
        onDelete={() => menuRoutine && handleRemove(menuRoutine)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
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
  headerBtnInner: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.iconPanel,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.sm,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    height: 50,
    color: Colors.textPrimary,
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },

  // Coach AI Hero Card
  coachCard: {
    borderRadius: Radius.xxl,
    borderCurve: 'continuous',
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderViolet,
    shadowColor: Colors.iconCinematicViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  coachTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  coachTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  coachTitle: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'] - 2,
    color: Colors.textPrimary,
  },
  coachSubtitle: {
    marginTop: 2,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.body,
    color: Colors.textCoach,
  },
  coachBottomRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  coachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    paddingVertical: 11,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  coachBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textPrimary,
  },
  streakBox: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  streakValue: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bodyBlack,
    color: Colors.iconPremiumGold,
  },

  // Weekly streak strip
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.iconPanel,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.xl,
  },
  weekDayItem: {
    alignItems: 'center',
    gap: 4,
  },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.iconPanel,
    borderWidth: 1,
    borderColor: 'rgba(150,151,190,0.3)',
  },
  weekDotActive: {
    backgroundColor: Colors.iconActive,
    borderWidth: 0,
    shadowColor: Colors.iconActive,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  weekDayLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.body,
    color: Colors.iconInactive,
  },

  routineSectionHeader: {
    marginBottom: Spacing.lg,
  },

  // Routine card
  swipeWrap: {
    marginBottom: Spacing.md + 2,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  swipeActionRow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  swipeAction: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeActionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.body,
    color: Colors.iconInactive,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 132,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.iconPanel,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  routineIconPanel: {
    width: 64,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineIconImg: {
    width: 48,
    height: 48,
  },
  routineContent: {
    flex: 1,
    padding: Spacing.md + 2,
    justifyContent: 'center',
  },
  routineName: {
    fontSize: FontSize.md + 1,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  routineDesc: {
    fontSize: FontSize.sm - 1,
    fontFamily: FontFamily.body,
    color: Colors.iconInactive,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
  },
  statText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.body,
    color: Colors.iconInactive,
  },
  goBtn: {
    width: 84,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goIcon: {
    width: 68,
    height: 68,
  },

  // No results
  noResults: {
    paddingVertical: Spacing.xl,
  },

  // Long-press context menu
  menuOverlay: {
    flex: 1,
    backgroundColor: Colors.scrimStrong,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  menuContent: {
    gap: Spacing.md,
  },
  menuPreview: {
    borderRadius: Radius.xl,
    ...Shadow.card,
  },
  previewExercises: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  previewExTitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 1,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  previewExRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewExDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  previewExName: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyMedium,
    color: Colors.textPrimary,
  },
  previewExMeta: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.body,
    color: Colors.iconInactive,
  },
  previewExMore: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.body,
    color: Colors.textMuted,
    marginTop: 2,
  },
  menuList: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  menuLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bodyMedium,
    color: Colors.textPrimary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.lg + 20 + Spacing.md,
  },
});
