/**
 * All Exercises Screen
 * Full searchable + filterable exercise library.
 * Route: /workout/all-exercises
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { ExerciseImage } from '@/components/exercise/ExerciseImage';
import { ExerciseDetailModal } from '@/components/exercise/ExerciseDetailModal';
import { useStore, selectCustomExercises } from '@/store';
import {
  EXERCISES,
  MUSCLE_GROUPS,
  type Exercise,
  type MuscleGroup,
  type CustomExercise,
} from '@/lib/exercises';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - Spacing.lg * 2 - Spacing.md) / 2;

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const;
const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbell', 'machine', 'cable',
  'bodyweight', 'kettlebell', 'resistance_band', 'smith_machine',
] as const;

const diffBadge = (d: string) =>
  d === 'beginner' ? 'accent' : d === 'intermediate' ? 'info' : ('error' as const);

export default function AllExercisesScreen() {
  const { muscle } = useLocalSearchParams<{ muscle?: string }>();
  const customExercises = useStore(selectCustomExercises);

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(
    (muscle as MuscleGroup) ?? null
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  const allExercises: Exercise[] = useMemo(
    () => [...EXERCISES, ...customExercises],
    [customExercises]
  );

  const filtered = useMemo(() => {
    return allExercises.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.includes(q) ||
        e.equipment.includes(q);
      const matchMuscle = !selectedMuscle || e.muscleGroup === selectedMuscle;
      const matchDiff = !selectedDifficulty || e.difficulty === selectedDifficulty;
      const matchEquip = !selectedEquipment || e.equipment === selectedEquipment;
      return matchSearch && matchMuscle && matchDiff && matchEquip;
    });
  }, [allExercises, search, selectedMuscle, selectedDifficulty, selectedEquipment]);

  const hasFilters = selectedMuscle || selectedDifficulty || selectedEquipment;

  const clearFilters = () => {
    setSelectedMuscle(null);
    setSelectedDifficulty(null);
    setSelectedEquipment(null);
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, hasFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options"
            size={18}
            color={hasFilters ? Colors.accent : Colors.textSecondary}
          />
          {hasFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Muscle filter chips - horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.muscleChips}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedMuscle && styles.chipActive]}
          onPress={() => setSelectedMuscle(null)}
        >
          <Text style={[styles.chipText, !selectedMuscle && styles.chipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {MUSCLE_GROUPS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.chip, selectedMuscle === m.id && styles.chipActive]}
            onPress={() => setSelectedMuscle(selectedMuscle === m.id ? null : m.id)}
          >
            <Text style={[styles.chipText, selectedMuscle === m.id && styles.chipTextActive]}>
              {m.icon} {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count + clear */}
      <View style={styles.resultsRow}>
        <Text color="muted" style={{ fontSize: FontSize.sm }}>
          {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
        </Text>
        {hasFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text color="accent" style={{ fontSize: FontSize.sm }}>
              Clear filters
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Exercise grid */}
      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 44, marginBottom: Spacing.md }}>🔍</Text>
            <Text semibold style={{ fontSize: FontSize.lg, marginBottom: Spacing.sm }}>
              No exercises found
            </Text>
            <Text color="secondary" style={{ textAlign: 'center' }}>
              Try adjusting your filters or search term
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setDetailExercise(item)}
            activeOpacity={0.85}
          >
            <ExerciseImage
              uri={item.image}
              width={CARD_W}
              height={CARD_W * 0.6}
              borderRadius={0}
            />
            <View style={styles.cardBody}>
              <Text semibold style={styles.cardName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text color="muted" style={styles.cardMuscle}>
                {item.muscleGroup.replace('_', ' ')}
              </Text>
              <View style={styles.cardFooter}>
                <Badge label={item.difficulty} variant={diffBadge(item.difficulty)} />
                {(item as CustomExercise).isCustom && (
                  <Badge label="Custom" variant="accent" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.filterModal} edges={['top', 'bottom']}>
          <View style={styles.filterHeader}>
            <Text semibold style={{ fontSize: FontSize.lg }}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.filterContent}>
            {/* Difficulty */}
            <Text color="secondary" style={styles.filterSectionLabel}>DIFFICULTY</Text>
            <View style={styles.filterChips}>
              {DIFFICULTY_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.filterChip, selectedDifficulty === d && styles.filterChipActive]}
                  onPress={() => setSelectedDifficulty(selectedDifficulty === d ? null : d)}
                >
                  <Text style={[styles.chipText, selectedDifficulty === d && styles.chipTextActive, { textTransform: 'capitalize' }]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Equipment */}
            <Text color="secondary" style={styles.filterSectionLabel}>EQUIPMENT</Text>
            <View style={styles.filterChips}>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <TouchableOpacity
                  key={eq}
                  style={[styles.filterChip, selectedEquipment === eq && styles.filterChipActive]}
                  onPress={() => setSelectedEquipment(selectedEquipment === eq ? null : eq)}
                >
                  <Text style={[styles.chipText, selectedEquipment === eq && styles.chipTextActive]}>
                    {eq.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text color="secondary">Clear all</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setShowFilters(false)}
            >
              <Text style={{ color: '#000', fontWeight: FontWeight.bold }}>
                Show {filtered.length} results
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Exercise detail modal */}
      <ExerciseDetailModal
        exercise={detailExercise}
        visible={!!detailExercise}
        onClose={() => setDetailExercise(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow2 },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },

  muscleChips: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    height: 36,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: {
    color: '#000',
    fontWeight: FontWeight.bold,
  },

  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'] },
  row: { gap: Spacing.md, marginBottom: Spacing.md },

  card: {
    width: CARD_W,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardBody: { padding: Spacing.sm },
  cardName: { fontSize: FontSize.sm, marginBottom: 2 },
  cardMuscle: { fontSize: FontSize.xs, marginBottom: Spacing.xs, textTransform: 'capitalize' },
  cardFooter: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },

  empty: {
    alignItems: 'center',
    paddingTop: Spacing['5xl'],
    paddingHorizontal: Spacing.xl,
  },

  // Filter modal
  filterModal: { flex: 1, backgroundColor: Colors.bgModal },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterContent: { padding: Spacing.lg },
  filterSectionLabel: {
    fontSize: FontSize.xs,
    letterSpacing: 1.2,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap' },
  filterChip: {
    height: 36,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearBtn: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  applyBtn: {
    flex: 2,
    padding: Spacing.md,
    alignItems: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
  },
});
