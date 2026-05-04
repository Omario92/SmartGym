/**
 * CustomExerciseManager — "My Exercises" panel v2.0
 * Search + filter by muscle/equipment/difficulty, duplicate, edit, delete.
 * Used inside exercise pickers (create/edit routine) and the More tab.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { ExerciseImage } from './ExerciseImage';
import { useStore, selectCustomExercises } from '@/store';
import { MUSCLE_GROUPS, EQUIPMENT_LABELS, type CustomExercise, type MuscleGroup, type Equipment } from '@/lib/exercises';

interface CustomExerciseManagerProps {
  onSelect?: (exercise: CustomExercise) => void;
  onCreateNew: () => void;
  onEdit: (exercise: CustomExercise) => void;
  /** If true, renders as standalone full list (no "select" action) */
  standalone?: boolean;
}

const DIFFICULTY_FILTER = [
  { id: 'beginner', label: '🟢 Beginner', color: Colors.success },
  { id: 'intermediate', label: '🟡 Mid', color: Colors.info },
  { id: 'advanced', label: '🔴 Adv', color: Colors.error },
] as const;

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: Colors.success,
  intermediate: Colors.info,
  advanced: Colors.error,
};

export const CustomExerciseManager: React.FC<CustomExerciseManagerProps> = ({
  onSelect,
  onCreateNew,
  onEdit,
  standalone = false,
}) => {
  const customExercises = useStore(selectCustomExercises);
  const deleteCustomExercise = useStore((s) => s.deleteCustomExercise);
  const duplicateCustomExercise = useStore((s) => s.duplicateCustomExercise);
  const toggleFavorite = useStore((s) => s.toggleFavoriteExercise);
  const favoriteIds = useStore((s) => s.favoriteExerciseIds);

  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [diffFilter, setDiffFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount =
    (muscleFilter ? 1 : 0) + (diffFilter ? 1 : 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customExercises.filter((e) => {
      const matchQ =
        q.length === 0 ||
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.includes(q) ||
        e.equipment.includes(q);
      const matchMuscle = !muscleFilter || e.muscleGroup === muscleFilter;
      const matchDiff = !diffFilter || e.difficulty === diffFilter;
      return matchQ && matchMuscle && matchDiff;
    });
  }, [customExercises, search, muscleFilter, diffFilter]);

  const handleDelete = (exercise: CustomExercise) => {
    Alert.alert(
      'Delete Exercise',
      `Delete "${exercise.name}"?\n\nIt will be removed from any routines that use it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCustomExercise(exercise.id),
        },
      ]
    );
  };

  const handleDuplicate = (exercise: CustomExercise) => {
    duplicateCustomExercise(exercise.id);
    Alert.alert('Duplicated', `"${exercise.name} (Copy)" has been added to My Exercises.`);
  };

  const renderItem = ({ item }: { item: CustomExercise }) => {
    const isFav = favoriteIds.includes(item.id);
    return (
      <Animated.View entering={FadeIn.duration(250)}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => onSelect?.(item)}
          activeOpacity={onSelect ? 0.8 : 1}
        >
          {/* Thumbnail */}
          <ExerciseImage
            uri={item.image}
            width={64}
            height={48}
            borderRadius={Radius.md}
          />

          {/* Info */}
          <View style={styles.itemInfo}>
            <View style={styles.itemTitleRow}>
              <Text semibold style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>✨</Text>
              </View>
            </View>
            <Text color="muted" style={styles.itemMeta}>
              {item.muscleGroup.replace(/_/g, ' ')} · {item.equipment.replace(/_/g, ' ')}
            </Text>
            <View
              style={[
                styles.diffBadge,
                { backgroundColor: DIFFICULTY_COLOR[item.difficulty] + '22' },
              ]}
            >
              <Text
                style={{
                  color: DIFFICULTY_COLOR[item.difficulty],
                  fontSize: FontSize.xs,
                  fontWeight: FontWeight.semibold,
                  textTransform: 'capitalize',
                }}
              >
                {item.difficulty}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => toggleFavorite(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={16}
                color={isFav ? Colors.error : Colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onEdit(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil" size={15} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDuplicate(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="copy-outline" size={15} color={Colors.info} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={15} color={Colors.error} />
            </TouchableOpacity>
            {onSelect && (
              <Ionicons
                name="add-circle"
                size={24}
                color={Colors.accent}
                style={{ marginLeft: Spacing.xs }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Create new button */}
      <TouchableOpacity style={styles.createBtn} onPress={onCreateNew}>
        <Ionicons name="add-circle" size={20} color="#000" />
        <Text style={styles.createBtnText}>Create New Exercise</Text>
      </TouchableOpacity>

      {customExercises.length > 0 && (
        <>
          {/* Search bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search my exercises..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                showFilters && styles.filterBtnActive,
              ]}
              onPress={() => setShowFilters((v) => !v)}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={showFilters ? '#000' : Colors.textSecondary}
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterCount}>
                  <Text style={{ color: '#000', fontSize: 9, fontWeight: FontWeight.bold }}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Filter panel */}
          {showFilters && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.filterPanel}>
              {/* Muscle filter */}
              <Text color="muted" style={styles.filterLabel}>Muscle Group</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.xs, paddingBottom: Spacing.sm }}
              >
                <TouchableOpacity
                  style={[styles.filterChip, !muscleFilter && styles.filterChipActive]}
                  onPress={() => setMuscleFilter(null)}
                >
                  <Text style={{ fontSize: FontSize.xs, color: !muscleFilter ? '#000' : Colors.textSecondary }}>
                    All
                  </Text>
                </TouchableOpacity>
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
              </ScrollView>

              {/* Difficulty filter */}
              <Text color="muted" style={styles.filterLabel}>Difficulty</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <TouchableOpacity
                  style={[styles.filterChip, !diffFilter && styles.filterChipActive]}
                  onPress={() => setDiffFilter(null)}
                >
                  <Text style={{ fontSize: FontSize.xs, color: !diffFilter ? '#000' : Colors.textSecondary }}>All</Text>
                </TouchableOpacity>
                {DIFFICULTY_FILTER.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.filterChip,
                      diffFilter === d.id && { backgroundColor: d.color, borderColor: d.color },
                    ]}
                    onPress={() => setDiffFilter(diffFilter === d.id ? null : d.id)}
                  >
                    <Text style={{ fontSize: FontSize.xs, color: diffFilter === d.id ? '#fff' : Colors.textSecondary }}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {activeFilterCount > 0 && (
                <TouchableOpacity
                  onPress={() => { setMuscleFilter(null); setDiffFilter(null); }}
                  style={{ marginTop: Spacing.sm, alignSelf: 'flex-end' }}
                >
                  <Text color="error" style={{ fontSize: FontSize.xs }}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </>
      )}

      {/* Empty state */}
      {customExercises.length === 0 && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Text style={{ fontSize: 52 }}>🏗️</Text>
          </View>
          <Text semibold style={styles.emptyTitle}>
            No Custom Exercises Yet
          </Text>
          <Text color="secondary" style={styles.emptySubtitle}>
            Build your own exercises with custom images, instructions, and personal coaching notes.
          </Text>
          <Text color="muted" style={styles.emptySuggestions}>
            Popular ideas: Bulgarian Split Squat, Landmine Press, Tempo Push-Up, Pallof Press
          </Text>
        </Animated.View>
      )}

      {/* Stats bar */}
      {customExercises.length > 0 && (
        <View style={styles.statsBar}>
          <Text color="muted" style={{ fontSize: FontSize.xs }}>
            {filtered.length} of {customExercises.length} exercises
          </Text>
        </View>
      )}

      {/* List */}
      {customExercises.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          scrollEnabled={standalone}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: Colors.divider }} />
          )}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text color="muted" center>No exercises match your filters</Text>
              <TouchableOpacity
                onPress={() => { setSearch(''); setMuscleFilter(null); setDiffFilter(null); }}
                style={{ marginTop: Spacing.sm }}
              >
                <Text color="accent" style={{ fontSize: FontSize.sm, textAlign: 'center' }}>
                  Clear all filters
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    margin: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.accentGlow,
  },
  createBtnText: {
    color: '#000',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
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
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter panel
  filterPanel: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  filterLabel: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },

  // Stats
  statsBar: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },

  // Item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.bgModal,
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  itemName: { fontSize: FontSize.md, flexShrink: 1 },
  itemMeta: { fontSize: FontSize.xs, marginTop: 2, textTransform: 'capitalize' },
  diffBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  actionBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard3,
    borderRadius: Radius.xs,
  },
  actionBtnDanger: { backgroundColor: Colors.error + '22' },
  customBadge: {
    backgroundColor: Colors.accentGlow2,
    borderRadius: Radius.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBadgeText: { fontSize: 11 },

  // Empty
  empty: { alignItems: 'center', padding: Spacing.xxxl },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.bgCard2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: { fontSize: FontSize.lg, marginBottom: Spacing.sm },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  emptySuggestions: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  noResults: { padding: Spacing.xl, alignItems: 'center' },
});
