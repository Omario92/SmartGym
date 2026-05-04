/**
 * CustomExerciseManager — "My Exercises" list panel used inside
 * exercise pickers. Shows custom exercises with thumbnails, plus
 * edit / delete per item.
 */

import React, { useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { ExerciseImage } from './ExerciseImage';
import { useStore, selectCustomExercises } from '@/store';
import type { CustomExercise } from '@/lib/exercises';

interface CustomExerciseManagerProps {
  onSelect: (exercise: CustomExercise) => void;
  onCreateNew: () => void;
  onEdit: (exercise: CustomExercise) => void;
}

export const CustomExerciseManager: React.FC<CustomExerciseManagerProps> = ({
  onSelect,
  onCreateNew,
  onEdit,
}) => {
  const customExercises = useStore(selectCustomExercises);
  const deleteCustomExercise = useStore((s) => s.deleteCustomExercise);
  const [search, setSearch] = useState('');

  const filtered = customExercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (exercise: CustomExercise) => {
    Alert.alert(
      'Delete Exercise',
      `Delete "${exercise.name}"? It will be removed from any routines that use it.`,
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

  return (
    <View style={styles.root}>
      {/* Create new button */}
      <TouchableOpacity style={styles.createBtn} onPress={onCreateNew}>
        <Ionicons name="add-circle" size={20} color="#000" />
        <Text style={styles.createBtnText}>Create New Exercise</Text>
      </TouchableOpacity>

      {/* Search */}
      {customExercises.length > 0 && (
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
      )}

      {/* Empty state */}
      {customExercises.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏗️</Text>
          <Text semibold style={styles.emptyTitle}>
            No Custom Exercises Yet
          </Text>
          <Text color="secondary" style={styles.emptySubtitle}>
            Tap "Create New Exercise" above to build your own exercises with
            custom images and instructions.
          </Text>
        </View>
      )}

      {/* List */}
      {customExercises.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: Colors.divider }} />
          )}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text color="muted" center>
                No exercises matching "{search}"
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => onSelect(item)}
              activeOpacity={0.8}
            >
              {/* Thumbnail */}
              <ExerciseImage
                uri={item.image}
                width={56}
                height={42}
                borderRadius={Radius.sm}
              />

              {/* Info */}
              <View style={styles.itemInfo}>
                <Text semibold style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text color="muted" style={styles.itemMeta}>
                  {item.muscleGroup.replace('_', ' ')} ·{' '}
                  {item.equipment.replace('_', ' ')}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onEdit(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
                <Ionicons
                  name="add-circle"
                  size={22}
                  color={Colors.accent}
                />
              </View>
            </TouchableOpacity>
          )}
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
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  createBtnText: {
    color: '#000',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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
  empty: {
    alignItems: 'center',
    padding: Spacing.xxxl,
    paddingTop: Spacing['4xl'],
  },
  emptyEmoji: { fontSize: 44, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, marginBottom: Spacing.sm },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    fontSize: FontSize.sm,
  },
  noResults: { padding: Spacing.xl, alignItems: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.bgModal,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FontSize.md, marginBottom: 2 },
  itemMeta: { fontSize: FontSize.xs },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard3,
    borderRadius: Radius.xs,
  },
});
