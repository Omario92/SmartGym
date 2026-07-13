/**
 * GlobalExerciseSearch — Full-screen search modal over all exercises.
 * Filters: name, muscle group, equipment, difficulty, custom-only.
 * Shows favorite heart on every row.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import Animated from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { useStore, selectCustomExercises } from '@/store';
import {
  MUSCLE_GROUPS,
  type Exercise,
  type CustomExercise,
  type MuscleGroup,
} from '@/lib/exercises';
import { useCatalogExercises } from '@/lib/hooks/useCatalogExercises';

interface GlobalExerciseSearchProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (exercise: Exercise | CustomExercise) => void;
}

const DIFFICULTY_OPTS = [
  { id: 'beginner', label: '🟢 Beginner' },
  { id: 'intermediate', label: '🟡 Intermediate' },
  { id: 'advanced', label: '🔴 Advanced' },
] as const;

export const GlobalExerciseSearch: React.FC<GlobalExerciseSearchProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const customExercises = useStore(selectCustomExercises);
  const { exercises: catalogExercises } = useCatalogExercises();

  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [diffFilter, setDiffFilter] = useState<string | null>(null);
  const [customOnly, setCustomOnly] = useState(false);
  const [detailExercise, setDetailExercise] = useState<Exercise | CustomExercise | null>(null);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    const pool: (Exercise | CustomExercise)[] = customOnly
      ? [...customExercises]
      : [...catalogExercises, ...customExercises];

    return pool.filter((e) => {
      const matchQ =
        q.length === 0 ||
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.includes(q) ||
        e.equipment.includes(q);
      const matchMuscle = !muscleFilter || e.muscleGroup === muscleFilter;
      const matchDiff = !diffFilter || e.difficulty === diffFilter;
      return matchQ && matchMuscle && matchDiff;
    });
  }, [query, muscleFilter, diffFilter, customOnly, customExercises, catalogExercises]);

  const activeFilters =
    (muscleFilter ? 1 : 0) + (diffFilter ? 1 : 0) + (customOnly ? 1 : 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Icon name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises by name, muscle, equipment..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Icon name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Filter chips row */}
        <View style={styles.filterSection}>
          {/* Custom only toggle */}
          <TouchableOpacity
            style={[styles.filterChip, customOnly && styles.filterChipAccent]}
            onPress={() => setCustomOnly((v) => !v)}
          >
            <Text style={{ fontSize: FontSize.xs, color: customOnly ? '#000' : Colors.accent }}>
              ✨ My Custom
            </Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {/* Muscle filters */}
            {MUSCLE_GROUPS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.filterChip, muscleFilter === m.id && styles.filterChipActive]}
                onPress={() => setMuscleFilter(muscleFilter === m.id ? null : m.id)}
              >
                <Text style={{ fontSize: FontSize.xs, color: muscleFilter === m.id ? '#000' : Colors.textSecondary }}>
                  {m.icon} {m.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Difficulty */}
            {DIFFICULTY_OPTS.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.filterChip, diffFilter === d.id && styles.filterChipActive]}
                onPress={() => setDiffFilter(diffFilter === d.id ? null : d.id)}
              >
                <Text style={{ fontSize: FontSize.xs, color: diffFilter === d.id ? '#000' : Colors.textSecondary }}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activeFilters > 0 && (
            <TouchableOpacity
              onPress={() => { setMuscleFilter(null); setDiffFilter(null); setCustomOnly(false); }}
              style={styles.clearBtn}
            >
              <Icon name="close-circle" size={14} color={Colors.error} />
              <Text color="error" style={{ fontSize: FontSize.xs, marginLeft: 3 }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Results count */}
        <View style={styles.resultsBar}>
          <Text color="muted" style={{ fontSize: FontSize.xs }}>
            {results.length} exercise{results.length !== 1 ? 's' : ''} found
          </Text>
          {customExercises.length > 0 && (
            <Text color="accent" style={{ fontSize: FontSize.xs }}>
              {customExercises.length} custom
            </Text>
          )}
        </View>

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Animated.View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text semibold style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
                No exercises found
              </Text>
              <Text color="secondary" style={{ textAlign: 'center', fontSize: FontSize.sm }}>
                Try a different search term or clear the filters.
              </Text>
            </Animated.View>
          }
          renderItem={({ item }) => (
            <ExerciseCard
              exercise={item}
              compact
              showAdd={!!onSelect}
              showFavorite
              onPress={() => {
                if (onSelect) {
                  onSelect(item);
                } else {
                  setDetailExercise(item);
                }
              }}
            />
          )}
        />
      </SafeAreaView>

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={detailExercise as Exercise | null}
        visible={!!detailExercise}
        onClose={() => setDetailExercise(null)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgModal },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  filterScroll: { gap: Spacing.sm, paddingRight: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterChipAccent: {
    backgroundColor: Colors.accentGlow2,
    borderColor: Colors.accent,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },

  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },

  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },

  empty: {
    alignItems: 'center',
    paddingTop: Spacing['5xl'],
    paddingHorizontal: Spacing.lg,
  },
});
