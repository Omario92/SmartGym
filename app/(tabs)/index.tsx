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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store';
import type { Routine } from '@/store';

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

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <View style={styles.routineCard}>
        {/* Color accent bar */}
        <View style={[styles.colorBar, { backgroundColor: routine.color }]} />

        <View style={styles.routineContent}>
          {/* Header */}
          <View style={styles.routineHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="h4" style={styles.routineName}>
                {routine.name}
              </Text>
              {routine.description && (
                <Text color="secondary" style={styles.routineDesc}>
                  {routine.description}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onMore} style={styles.moreBtn}>
              <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Ionicons name="barbell-outline" size={14} color={Colors.textMuted} />
              <Text color="muted" style={styles.statText}>
                {routine.exercises.length} exercises
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="layers-outline" size={14} color={Colors.textMuted} />
              <Text color="muted" style={styles.statText}>
                {totalSets} sets
              </Text>
            </View>
            {routine.estimatedDuration && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text color="muted" style={styles.statText}>
                    ~{routine.estimatedDuration} min
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.routineFooter}>
            <Text color="muted" style={styles.lastPerformed}>
              {lastPerformed ? `Last: ${lastPerformed}` : 'Never performed'}
            </Text>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={14} color="#000" />
              <Text style={styles.startBtnText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RoutinesScreen() {
  const routines = useStore(s => s.routines).filter(r => !r.deletedAt);
  const startTour = useStore(s => s.startTour);
  const deleteRoutine = useStore(s => s.deleteRoutine);
  const duplicateRoutine = useStore(s => s.duplicateRoutine);

  const [search, setSearch] = useState('');

  const filtered = routines.filter(
    (r) =>
      !r.deletedAt &&
      (r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase()))
  );

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="h2">Routines</Text>
          <Text color="secondary" style={{ marginTop: 2 }}>
            {routines.length} workout{routines.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/routine/create')}
        >
          <Ionicons name="add" size={26} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      {routines.length > 0 && (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routines..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {routines.length === 0 ? (
          <>
            <EmptyState
              icon="📋"
              title="No Routines Yet"
              subtitle="Create your first workout routine to get started on your fitness journey."
              action={{ label: '+ Create Routine', onPress: () => router.push('/routine/create') }}
            />

            {/* Guided Tour Card */}
            <Card style={styles.tourCard} onPress={startTour} glowing>
              <View style={styles.tourCardInner}>
                <Text style={styles.tourEmoji}>🗺️</Text>
                <View style={{ flex: 1 }}>
                  <Text semibold>App Guided Tour</Text>
                  <Text color="secondary" style={styles.tourSubtext}>
                    New to SmartGym? Take a 1-minute tour to discover all features.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.accent} />
              </View>
            </Card>

            {/* What are routines? */}
            <Card style={styles.infoCard}>
              <Text semibold style={styles.infoTitle}>
                💡 What are Routines?
              </Text>
              <Text color="secondary" style={styles.infoText}>
                Routines are pre-planned workout programs. Create one with your favorite exercises,
                set your reps and weights, then simply tap Start to begin your session.
              </Text>
              <View style={styles.infoFeatures}>
                {['📊 Track every set', '⏱ Built-in rest timer', '📈 See your progress'].map(
                  (f) => (
                    <Text key={f} color="secondary" style={styles.infoFeature}>
                      {f}
                    </Text>
                  )
                )}
              </View>
            </Card>
          </>
        ) : (
          <>
            {/* Tour reminder card if they haven't dismissed */}
            <Card style={styles.tourCard} onPress={startTour}>
              <View style={styles.tourCardInner}>
                <Text style={{ fontSize: 20 }}>🗺️</Text>
                <View style={{ flex: 1 }}>
                  <Text semibold>App Guided Tour</Text>
                  <Text color="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    Discover all features
                  </Text>
                </View>
                <Badge label="NEW" variant="accent" />
              </View>
            </Card>

            {/* Routine List */}
            {filtered.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onPress={() => handleStartWorkout(routine)}
                onMore={() => handleMoreOptions(routine)}
              />
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

      {/* FAB — Add Routine */}
      {routines.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/routine/create')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentGlow2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accentGlow,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['6xl'],
  },

  // Routine card
  routineCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.card,
  },
  colorBar: {
    width: 4,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  routineContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  routineName: { lineHeight: 22 },
  routineDesc: { fontSize: FontSize.sm, marginTop: 2 },
  moreBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  routineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastPerformed: { fontSize: FontSize.xs },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    gap: 4,
    ...Shadow.accentGlow,
  },
  startBtnText: {
    color: '#000',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // Tour card
  tourCard: {
    marginBottom: Spacing.md,
  },
  tourCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tourEmoji: { fontSize: 24 },
  tourSubtext: { fontSize: FontSize.sm, marginTop: 2 },

  // Info card
  infoCard: {
    marginBottom: Spacing.md,
  },
  infoTitle: { marginBottom: Spacing.sm },
  infoText: { lineHeight: 21, marginBottom: Spacing.md },
  infoFeatures: { gap: Spacing.xs },
  infoFeature: { fontSize: FontSize.sm },

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
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.accentGlow,
  },
});
