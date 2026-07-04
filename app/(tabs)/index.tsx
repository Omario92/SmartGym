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
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import Animated, { FadeInDown, FadeIn, ZoomIn as ZoomInFab } from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontFamily, Shadow, Glass } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { GlowOrb } from '@/components/ui/GlowOrb';
import { AI_COACH_SVG, STREAK_SVG } from '@/components/ui/designIcons';
import { muscleIconForRoutine, hexToRgba } from '@/lib/muscleIcons';
import { TAB_BAR_HEIGHT } from './_layout';
import { useStore } from '@/store';
import type { Routine } from '@/store';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const STREAK_DAYS = 3;

// ─── Routine Card ─────────────────────────────────────────────────────────────

const RoutineCard: React.FC<{ routine: Routine; onPress: () => void; onMore: () => void }> = ({
  routine,
  onPress,
  onMore,
}) => {
  const accentColor = routine.color || Colors.accent;
  const muscleIcon = muscleIconForRoutine(routine);

  return (
    <View style={styles.routineCard}>
      <View style={[styles.routineIconPanel, { backgroundColor: hexToRgba(accentColor, 0.08) }]}>
        <Image source={muscleIcon} style={styles.routineIconImg} resizeMode="contain" />
      </View>

      <Pressable style={styles.routineContent} onPress={onMore} onLongPress={onMore}>
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

      <Pressable style={styles.goBtn} onPress={onPress} hitSlop={8}>
        <Image source={require('@/assets/icons/go-icon.png')} style={styles.goIcon} />
      </Pressable>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RoutinesScreen() {
  const rawRoutines = useStore(s => s.routines) || [];
  const deleteRoutine = useStore(s => s.deleteRoutine);
  const duplicateRoutine = useStore(s => s.duplicateRoutine);

  const [search, setSearch] = useState('');

  // Deduplicate routines by ID and content signature to prevent duplicates in UI
  const routines = React.useMemo(() => {
    const map = new Map<string, Routine>();
    const seenSignatures = new Set<string>();

    rawRoutines.forEach((r) => {
      if (!r.deletedAt && r.id) {
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
    useStore.getState().startWorkout(routine);
    router.push('/workout/active');
  };

  const handleMoreOptions = (routine: Routine) => {
    Alert.alert(routine.name, 'Choose an action', [
      { text: 'Edit', onPress: () => router.push(`/routine/${routine.id}`) },
      { text: 'Duplicate', onPress: () => duplicateRoutine(routine.id) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Routine', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteRoutine(routine.id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const insets = useSafeAreaInsets();
  const fabBottom = insets.bottom + TAB_BAR_HEIGHT + Spacing.lg;
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
        <Animated.View entering={FadeIn.duration(400)} style={styles.coachCard}>
          <LinearGradient
            colors={['#2A1A4D', '#0E2A3A']}
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
              <Text style={styles.coachSubtitle}>3-day streak — chest &amp; triceps today</Text>
            </View>
          </View>

          <View style={styles.coachBottomRow}>
            <Pressable style={styles.coachBtn} onPress={() => {}}>
              <LinearGradient
                colors={[Colors.iconCinematicViolet, Colors.iconEnergyCyan]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.coachBtnText}>View Suggestions</Text>
            </Pressable>

            <View style={styles.streakBox}>
              <SvgXml xml={STREAK_SVG} width={20} height={20} />
              <Text style={styles.streakValue}>{STREAK_DAYS}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Weekly streak strip */}
        <View style={styles.weekStrip}>
          {WEEK_DAYS.map((day, i) => (
            <View key={i} style={styles.weekDayItem}>
              <View style={[styles.weekDot, i < STREAK_DAYS && styles.weekDotActive]} />
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>MY ROUTINE</Text>
              <View style={styles.sectionDivider} />
            </View>

            {/* Routine List */}
            {filtered.map((routine, i) => (
              <Animated.View
                key={routine.id}
                entering={FadeInDown.duration(350).delay(Math.min(i, 8) * 60)}
              >
                <RoutineCard
                  routine={routine}
                  onPress={() => handleStartWorkout(routine)}
                  onMore={() => handleMoreOptions(routine)}
                />
              </Animated.View>
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

      {/* FAB — Add Routine, floats above the glass tab bar */}
      {routines.length > 0 && (
        <Animated.View
          entering={ZoomInFab.duration(300)}
          style={[styles.fab, { bottom: fabBottom }]}
        >
          <GlassSurface
            radius={30}
            intensity={Glass.intensityPill}
            accent
            strong
            onPress={() => router.push('/routine/create')}
            style={styles.fabInner}
          >
            <Ionicons name="add" size={28} color={Colors.accent} />
          </GlassSurface>
        </Animated.View>
      )}
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
    borderColor: 'rgba(150,151,190,0.2)',
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
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,255,0.35)',
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
    color: '#C8C8E0',
  },
  coachBottomRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  coachBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: 'rgba(150,151,190,0.2)',
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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textSecondary,
    letterSpacing: 1.2,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.glassBorder,
  },

  // Routine card
  routineCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 132,
    marginBottom: Spacing.md + 2,
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  fabInner: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
