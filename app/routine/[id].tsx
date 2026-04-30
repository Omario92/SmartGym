import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, Radius } from '@/lib/theme';
import {
  useStore,
  selectRoutines,
  RoutineExercise,
} from '@/store';
import { EXERCISES, MUSCLE_GROUPS, searchExercises, getExercisesByMuscle } from '@/lib/exercises';

const ROUTINE_COLORS = [
  '#00FF9D', '#6C63FF', '#FF6B6B', '#FFB347',
  '#4ECDC4', '#45B7D1', '#96CEB4', '#FF69B4',
];

// ─── Exercise Picker Modal ────────────────────────────────────────────────────
function ExercisePicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const filtered = query
    ? searchExercises(query)
    : selectedMuscle
    ? getExercisesByMuscle(selectedMuscle as any)
    : EXERCISES;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.pickerContainer}>
        {/* Header */}
        <View style={styles.pickerHeader}>
          <Text variant="h3" color="primary">Add Exercise</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Muscle filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={{ paddingHorizontal: Spacing.md }}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedMuscle && styles.chipActive]}
            onPress={() => setSelectedMuscle(null)}
          >
            <Text variant="caption" color={!selectedMuscle ? 'accent' : 'secondary'}>All</Text>
          </TouchableOpacity>
          {MUSCLE_GROUPS.map(mg => (
            <TouchableOpacity
              key={mg.id}
              style={[styles.chip, selectedMuscle === mg.id && styles.chipActive]}
              onPress={() => setSelectedMuscle(mg.id === selectedMuscle ? null : mg.id)}
            >
              <Text variant="caption" color={selectedMuscle === mg.id ? 'accent' : 'secondary'}>
                {mg.icon} {mg.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exercise list */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.exerciseRow}
              onPress={() => { onSelect(item.id); onClose(); }}
            >
              <View style={styles.exerciseInfo}>
                <Text variant="body" bold color="primary">{item.name}</Text>
                <Text variant="caption" color="secondary">
                  {item.primaryMuscles.join(', ')} · {item.equipment}
                </Text>
              </View>
              <Badge
                label={item.difficulty}
                variant={
                  item.difficulty === 'beginner' ? 'accent'
                  : item.difficulty === 'intermediate' ? 'info'
                  : 'warning'
                }
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text variant="body" color="tertiary">No exercises found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routines = useStore(selectRoutines);
  const updateRoutine = useStore(s => s.updateRoutine);
  const deleteRoutine = useStore(s => s.deleteRoutine);

  const routine = routines.find(r => r.id === id);

  const [name, setName] = useState(routine?.name ?? '');
  const [description, setDescription] = useState(routine?.description ?? '');
  const [color, setColor] = useState(routine?.color ?? ROUTINE_COLORS[0]);
  const [exercises, setExercises] = useState<RoutineExercise[]>(routine?.exercises ?? []);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = () => setIsDirty(true);

  const handleAddExercise = useCallback((exerciseId: string) => {
    const ex = EXERCISES.find(e => e.id === exerciseId);
    if (!ex) return;
    const newEx: RoutineExercise = {
      exerciseId,
      exerciseName: ex.name,
      sets: 3,
      reps: 10,
      weight: 0,
      restSeconds: 60,
    };
    setExercises(prev => [...prev, newEx]);
    markDirty();
  }, []);

  const updateExField = (
    idx: number,
    field: keyof RoutineExercise,
    value: string | number
  ) => {
    setExercises(prev => {
      const copy = [...prev];
      (copy[idx] as any)[field] = typeof value === 'string' ? Number(value) || 0 : value;
      return copy;
    });
    markDirty();
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
    markDirty();
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a routine name.');
      return;
    }
    if (!routine) return;
    const estimatedDuration = exercises.reduce((acc, ex) => {
      return acc + ex.sets * (45 + ex.restSeconds);
    }, 0);
    updateRoutine({
      ...routine,
      name: name.trim(),
      description: description.trim(),
      color,
      exercises,
      estimatedDuration: Math.round(estimatedDuration / 60),
    });
    setIsDirty(false);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (routine) deleteRoutine(routine.id);
            router.back();
          },
        },
      ]
    );
  };

  if (!routine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="body" color="tertiary">Routine not found.</Text>
          <Button label="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (isDirty) {
            Alert.alert('Unsaved changes', 'Discard changes?', [
              { text: 'Keep editing', style: 'cancel' },
              { text: 'Discard', style: 'destructive', onPress: () => router.back() },
            ]);
          } else {
            router.back();
          }
        }} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="h3" color="primary">Edit Routine</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <Card style={styles.section}>
          <Text variant="label" color="secondary" style={{ marginBottom: 8 }}>ROUTINE NAME</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={v => { setName(v); markDirty(); }}
            placeholder="e.g. Push Day"
            placeholderTextColor={Colors.textMuted}
            maxLength={50}
          />
        </Card>

        {/* Description */}
        <Card style={styles.section}>
          <Text variant="label" color="secondary" style={{ marginBottom: 8 }}>DESCRIPTION (optional)</Text>
          <TextInput
            style={[styles.textInput, { minHeight: 72 }]}
            value={description}
            onChangeText={v => { setDescription(v); markDirty(); }}
            placeholder="What does this routine focus on?"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={200}
          />
        </Card>

        {/* Color */}
        <Card style={styles.section}>
          <Text variant="label" color="secondary" style={{ marginBottom: 12 }}>ACCENT COLOR</Text>
          <View style={styles.colorRow}>
            {ROUTINE_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSelected,
                ]}
                onPress={() => { setColor(c); markDirty(); }}
              >
                {color === c && <Ionicons name="checkmark" size={14} color="#000" />}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Exercises */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="h4" color="primary">Exercises</Text>
            <Badge label={`${exercises.length}`} variant="secondary" />
          </View>

          {exercises.map((ex, idx) => (
            <Card key={idx} style={styles.exCard}>
              {/* Exercise name + remove */}
              <View style={styles.exHeader}>
                <View style={[styles.exColorBar, { backgroundColor: color }]} />
                <Text variant="body" bold color="primary" style={{ flex: 1 }}>{ex.exerciseName}</Text>
                <TouchableOpacity onPress={() => removeExercise(idx)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Inputs */}
              <View style={styles.exInputRow}>
                {(
                  [
                    { label: 'Sets', field: 'sets' },
                    { label: 'Reps', field: 'reps' },
                    { label: 'Weight (kg)', field: 'weight' },
                    { label: 'Rest (s)', field: 'restSeconds' },
                  ] as const
                ).map(({ label, field }) => (
                  <View key={field} style={styles.exInputGroup}>
                    <Text variant="caption" color="tertiary">{label}</Text>
                    <TextInput
                      style={styles.exInput}
                      value={String((ex as any)[field])}
                      onChangeText={v => updateExField(idx, field, v)}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                ))}
              </View>
            </Card>
          ))}

          {/* Add exercise button */}
          <TouchableOpacity
            style={styles.addExBtn}
            onPress={() => setPickerVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.accent} />
            <Text variant="body" color="accent" style={{ marginLeft: 8 }}>
              Add Exercise
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats summary */}
        {exercises.length > 0 && (
          <Card style={styles.section}>
            <Text variant="label" color="secondary" style={{ marginBottom: 10 }}>ROUTINE SUMMARY</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="h4" color="accent">{exercises.length}</Text>
                <Text variant="caption" color="tertiary">Exercises</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="h4" color="accent">
                  {exercises.reduce((a, e) => a + e.sets, 0)}
                </Text>
                <Text variant="caption" color="tertiary">Total Sets</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="h4" color="accent">
                  {Math.round(
                    exercises.reduce((a, e) => a + e.sets * (45 + e.restSeconds), 0) / 60
                  )} min
                </Text>
                <Text variant="caption" color="tertiary">Est. Duration</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Save */}
        <Button
          label="Save Changes"
          onPress={handleSave}
          variant={isDirty ? 'primary' : 'outline'}
          size="lg"
          style={{ margin: Spacing.md }}
        />
      </ScrollView>

      {/* Exercise picker */}
      <ExercisePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddExercise}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    padding: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    margin: Spacing.md,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: Spacing.md,
  },
  textInput: {
    color: Colors.textPrimary,
    fontSize: 16,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  exCard: {
    marginBottom: 10,
    marginHorizontal: Spacing.md,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  exColorBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  removeBtn: {
    padding: 2,
  },
  exInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  exInput: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    width: '100%',
    paddingBottom: 4,
    marginTop: 4,
  },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.md,
    marginTop: 12,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  // Picker
  pickerContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: Spacing.md,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  chipRow: {
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  chipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  exerciseInfo: {
    flex: 1,
    gap: 3,
  },
});
