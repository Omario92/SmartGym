/**
 * Routines Tab — Lists all workout routines
 * Empty state, routine cards, FAB to add new routine
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, ZoomIn as ZoomInFab } from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow, Glass } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { GlowOrb } from '@/components/ui/GlowOrb';
import { TAB_BAR_HEIGHT } from './_layout';
import { useStore } from '@/store';
import type { Routine } from '@/store';

// Derive a presentational icon for a routine without touching the data model.
function iconForRoutine(routine: Routine): React.ComponentProps<typeof Ionicons>['name'] {
  const s = `${routine.category || ''} ${routine.name}`.toLowerCase();
  if (s.includes('leg') || s.includes('lower')) return 'body-outline';
  if (s.includes('arm') || s.includes('bicep') || s.includes('tricep') || s.includes('upper')) return 'barbell-outline';
  if (s.includes('cardio') || s.includes('hiit') || s.includes('heart')) return 'pulse-outline';
  if (s.includes('7') || s.includes('quick') || s.includes('min')) return 'timer-outline';
  if (s.includes('core') || s.includes('ab')) return 'sync-outline';
  return 'flame-outline';
}

// ─── Routine Card ─────────────────────────────────────────────────────────────

const RoutineCard: React.FC<{ routine: Routine; onPress: () => void; onMore: () => void }> = ({
  routine,
  onPress,
  onMore,
}) => {
  const totalSets = routine.exercises.reduce((acc, e) => acc + e.sets, 0);

  const lastPerformed = routine.lastPerformed
    ? new Date(routine.lastPerformed).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const accentColor = routine.color || Colors.accent;
  const icon = iconForRoutine(routine);

  return (
    <GlassSurface radius={24} intensity={Glass.intensityCard} style={styles.routineCard}>
      {/* Premium color indicator bar with glow */}
      <View style={[styles.colorBar, { backgroundColor: accentColor, shadowColor: accentColor }]} />

      <View style={styles.routineContent}>
        {/* Icon + title row */}
        <View style={styles.routineHeader}>
          <View style={[styles.routineIconWrap, { borderColor: `${accentColor}55` }]}>
            <Ionicons name={icon} size={20} color={accentColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h4" style={styles.routineName} numberOfLines={1}>
              {routine.name}
            </Text>
            {routine.description && (
              <Text color="secondary" style={styles.routineDesc} numberOfLines={2}>
                {routine.description}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onMore} style={styles.moreBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Ionicons name="barbell" size={13} color={Colors.textMuted} />
            <Text color="muted" style={styles.statText}>
              {routine.exercises.length} exercises
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Ionicons name="layers" size={13} color={Colors.textMuted} />
            <Text color="muted" style={styles.statText}>
              {totalSets} sets
            </Text>
          </View>
          {routine.estimatedDuration && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Ionicons name="time" size={13} color={Colors.textMuted} />
                <Text color="muted" style={styles.statText}>
                  ~{routine.estimatedDuration} min
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Last Performed */}
        {lastPerformed && (
          <Text color="muted" style={styles.lastPerformed}>
            Last active: {lastPerformed}
          </Text>
        )}
      </View>

      {/* Start Workout — block button on the right, full card height */}
      <GlassSurface
        radius={20}
        intensity={Glass.intensityPill}
        accent
        strong
        onPress={onPress}
        style={styles.startBtnBlock}
      >
        <Ionicons name="play" size={18} color={Colors.accent} />
        <Text style={styles.startBtnBlockText}>Start{'\n'}Workout</Text>
      </GlassSurface>
    </GlassSurface>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RoutinesScreen() {
  const rawRoutines = useStore(s => s.routines) || [];
  const startTour = useStore(s => s.startTour);
  const deleteRoutine = useStore(s => s.deleteRoutine);
  const duplicateRoutine = useStore(s => s.duplicateRoutine);

  const [search, setSearch] = useState('');
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);

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

  const handleHeaderMore = () => {
    setMoreMenuVisible(true);
  };

  const insets = useSafeAreaInsets();
  const fabBottom = insets.bottom + TAB_BAR_HEIGHT + Spacing.lg;
  const scrollBottomPad = insets.bottom + TAB_BAR_HEIGHT + Spacing.xxxl;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Ambient glass glow orbs */}
      <GlowOrb size={300} color="rgba(0,255,157,0.20)" style={{ top: -80, right: -80 }} />
      <GlowOrb size={240} color="rgba(123,47,255,0.14)" style={{ top: 300, left: -100 }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Routines</Text>
          <Text color="secondary" style={styles.subtitle}>
            Your workouts, organized.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <GlassSurface
            radius={20}
            intensity={Glass.intensityPill}
            onPress={handleHeaderMore}
            style={styles.headerBtnInner}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textPrimary} />
          </GlassSurface>
          <GlassSurface
            radius={20}
            intensity={Glass.intensityPill}
            accent
            strong
            onPress={() => router.push('/routine/create')}
            style={styles.headerBtnInner}
          >
            <Ionicons name="add" size={24} color={Colors.accent} />
          </GlassSurface>
        </View>
      </View>

      {/* Search */}
      {routines.length > 0 && (
        <GlassSurface radius={Radius.xl} intensity={Glass.intensityPill} style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routines..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          <View style={styles.searchDivider} />
          <TouchableOpacity hitSlop={8}>
            <Ionicons name="options-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </GlassSurface>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Coach AI Hero Card */}
        <Animated.View entering={FadeIn.duration(400)} style={{ position: 'relative' }}>
          <GlowOrb size={240} color="rgba(0,255,157,0.32)" style={{ top: -60, right: -60 }} />
          <GlassSurface radius={28} intensity={Glass.intensityPanel} accent strong style={styles.coachCard}>
            <View style={styles.coachCardInner}>
              <View style={styles.coachTopRow}>
                {/* Left: copy */}
                <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                  <Badge label="BETA" variant="accent" style={{ marginBottom: Spacing.sm }} />
                  <Text style={styles.coachTitle}>
                    Coach <Text style={styles.coachTitleAI}>AI</Text>
                  </Text>
                  <Text color="secondary" style={styles.coachSubtitle}>
                    Your intelligent fitness coach.
                  </Text>
                </View>

                {/* Right: AI orb visual */}
                <View style={styles.coachOrbWrap}>
                  <GlowOrb size={110} color="rgba(0,255,157,0.45)" style={{ top: -10, left: -10 }} />
                  <GlassSurface radius={Radius.xl} intensity={Glass.intensityPill} accent style={styles.coachAvatarWrap}>
                    <Text style={{ fontSize: 34 }}>🤖</Text>
                  </GlassSurface>
                </View>
              </View>

              {/* Message box */}
              <View style={styles.coachMessageBox}>
                <Text color="secondary" style={styles.coachText}>
                  Based on your recent activity, I suggest focusing on chest & triceps today. You're on a 3-day streak! 🔥
                </Text>
              </View>

              <View style={styles.coachBottomRow}>
                <GlassSurface
                  radius={Radius.full}
                  intensity={Glass.intensityPill}
                  accent
                  strong
                  onPress={() => {}}
                  style={styles.coachBtn}
                >
                  <Text style={styles.coachBtnText}>View AI Suggestions</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.accent} />
                </GlassSurface>

                {/* Streak mini stat */}
                <GlassSurface radius={Radius.lg} intensity={Glass.intensityPill} style={styles.streakCard}>
                  <Text color="secondary" style={styles.streakLabel}>Streak</Text>
                  <Text style={styles.streakValue}>3<Text style={styles.streakUnit}> days</Text></Text>
                </GlassSurface>
              </View>
            </View>
          </GlassSurface>
        </Animated.View>

        {routines.length === 0 ? (
          <>
            <EmptyState
              icon="📋"
              title="No Routines Yet"
              subtitle="Create your first workout routine to get started on your fitness journey."
              action={{ label: '+ Create Routine', onPress: () => router.push('/routine/create') }}
            />
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text color="secondary" style={styles.sectionTitle}>MY ROUTINE</Text>
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
                  No routines matching "{search}"
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

      {/* Header More Menu Dropdown */}
      <Modal visible={moreMenuVisible} transparent animationType="fade" onRequestClose={() => setMoreMenuVisible(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMoreMenuVisible(false)}>
          <View
            style={{
              position: 'absolute',
              top: 80,
              right: Spacing.lg,
              backgroundColor: Colors.bgCard,
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: Colors.border,
              minWidth: 200,
              paddingVertical: Spacing.sm,
              ...Shadow.card,
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.sm,
                gap: Spacing.md,
              }}
              onPress={() => {
                setMoreMenuVisible(false);
                startTour();
              }}
            >
              <Ionicons name="map-outline" size={20} color={Colors.textPrimary} />
              <Text style={{ color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '500' }}>App Guided Tour</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    fontSize: 36,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
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
    height: 60,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 58,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  searchDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.glassBorder,
    marginHorizontal: Spacing.md,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },

  // Coach AI Hero Card
  coachCard: {
    marginBottom: Spacing.xxxl,
    ...Shadow.accentGlow,
  },
  coachCardInner: {
    padding: Spacing.xl,
  },
  coachTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  coachTitle: {
    fontSize: 30,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  coachTitleAI: {
    color: Colors.accent,
  },
  coachSubtitle: {
    marginTop: 4,
    fontSize: FontSize.sm,
  },
  coachOrbWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachAvatarWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachMessageBox: {
    marginBottom: Spacing.xl,
  },
  coachText: {
    fontSize: FontSize.sm,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  coachBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  coachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xs,
    ...Shadow.accentGlow,
  },
  coachBtnText: {
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  streakCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'flex-start',
  },
  streakLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  streakValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.accent,
  },
  streakUnit: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.glassBorder,
  },

  // Routine card
  routineCard: {
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 138,
    ...Shadow.card,
  },
  colorBar: {
    width: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  routineContent: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  routineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  routineName: { lineHeight: 22, fontWeight: 'bold' },
  routineDesc: { fontSize: FontSize.sm, marginTop: 2, lineHeight: 18 },
  moreBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
    alignSelf: 'flex-start',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: { fontSize: FontSize.xs },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  lastPerformed: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.md,
  },
  startBtnBlock: {
    width: 78,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  startBtnBlockText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Tour card
  tourCard: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    padding: 0,
  },
  tourCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  tourEmoji: { fontSize: 32 },
  tourSubtext: { fontSize: FontSize.sm, marginTop: 2 },

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
