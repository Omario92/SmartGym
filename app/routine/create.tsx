/**
 * Create Routine Screen — v2.0
 * Tabbed exercise picker (All / My Exercises), custom badge in all lists,
 * floating "+ Add Custom Exercise" FAB, search + muscle filters.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ExerciseImage } from '@/components/exercise/ExerciseImage';
import { CustomExerciseManager } from '@/components/exercise/CustomExerciseManager';
import { useStore, selectCustomExercises, type RoutineExercise } from '@/store';
import {
  EXERCISES,
  MUSCLE_GROUPS,
  type Exercise,
  type CustomExercise,
} from '@/lib/exercises';
import type { ViewStyle } from 'react-native';

const ROUTINE_COLORS = [
  '#00FF9D', '#FF6B6B', '#4DA6FF', '#FFB547',
  '#9B59B6', '#FF8C42', '#FF69B4', '#00CFFF',
];

// ─── Exercise Picker Modal ────────────────────────────────────────────────────

type PickerTab = 'all' | 'mine';

const ExercisePickerModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}> = ({ visible, onClose, onSelect }) => {
  const [tab, setTab] = useState<PickerTab>('all');
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const customExercises = useStore(selectCustomExercises);

  const filtered = EXERCISES.filter((e) => {
    const matchSearch = search.length === 0 || e.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = !selectedMuscle || e.muscleGroup === selectedMuscle;
    return matchSearch && matchMuscle;
  });

  const handleNavigateCreate = () => {
    onClose();
    // Small delay so modal closes before pushing new screen
    setTimeout(() => router.push('/routine/add-custom-exercise'), 300);
  };

  const handleEditCustom = (ex: CustomExercise) => {
    onClose();
    setTimeout(() => router.push(`/routine/add-custom-exercise?editId=${ex.id}`), 300);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.pickerContainer} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.pickerHeader}>
          <Text variant="h4">Add Exercise</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {([['all', 'All Exercises'], ['mine', 'My Exercises']] as [PickerTab, string][]).map(
            ([id, label]) => (
              <TouchableOpacity
                key={id}
                style={[styles.tab, tab === id && styles.tabActive]}
                onPress={() => setTab(id)}
              >
                <Text
                  style={{
                    fontSize: FontSize.sm,
                    fontWeight: tab === id ? FontWeight.bold : FontWeight.regular,
                    color: tab === id ? Colors.accent : Colors.textSecondary,
                  }}
                >
                  {label}
                  {id === 'mine' && customExercises.length > 0
                    ? ` (${customExercises.length})`
                    : ''}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {tab === 'mine' ? (
          <CustomExerciseManager
            onSelect={(ex) => { onSelect(ex); onClose(); }}
            onCreateNew={handleNavigateCreate}
            onEdit={handleEditCustom}
          />
        ) : (
          <>
            {/* Search */}
            <View style={styles.pickerSearch}>
              <Ionicons name="search" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search exercises..."
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

            {/* Muscle filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, minHeight: 50 }}
              contentContainerStyle={styles.muscleFilters}
            >
              <TouchableOpacity
                style={[styles.muscleChip, !selectedMuscle && styles.muscleChipActive]}
                onPress={() => setSelectedMuscle(null)}
              >
                <Text style={{ fontSize: FontSize.sm, color: !selectedMuscle ? '#000' : Colors.textSecondary }}>
                  All
                </Text>
              </TouchableOpacity>
              {MUSCLE_GROUPS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.muscleChip, selectedMuscle === m.id && styles.muscleChipActive]}
                  onPress={() => setSelectedMuscle(selectedMuscle === m.id ? null : m.id)}
                >
                  <Text style={{ fontSize: FontSize.sm, color: selectedMuscle === m.id ? '#000' : Colors.textSecondary }}>
                    {m.icon} {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Floating "Create Custom" FAB inside picker */}
            <TouchableOpacity
              style={styles.pickerFab}
              onPress={handleNavigateCreate}
            >
              <Ionicons name="add" size={18} color="#000" />
              <Text style={{ color: '#000', fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>
                Create Custom Exercise
              </Text>
            </TouchableOpacity>

            {/* Exercise list */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'] }}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
              renderItem={({ item }) => {
                const isCustom = 'isCustom' in item && item.isCustom;
                return (
                  <TouchableOpacity
                    style={styles.exerciseItem}
                    onPress={() => { onSelect(item); onClose(); }}
                    activeOpacity={0.8}
                  >
                    <ExerciseImage uri={item.image} width={60} height={46} borderRadius={Radius.sm} />
                    <View style={styles.exerciseItemLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' }}>
                        <Text semibold style={{ marginBottom: 2, flexShrink: 1 }}>
                          {item.name}
                        </Text>
                        {isCustom ? (
                          <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>✨ Custom</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text color="muted" style={{ fontSize: FontSize.xs }}>
                        {item.muscleGroup.replace(/_/g, ' ')} · {item.equipment.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <View style={styles.exerciseItemRight}>
                      <Badge
                        label={item.difficulty}
                        variant={
                          item.difficulty === 'beginner'
                            ? 'accent'
                            : item.difficulty === 'intermediate'
                            ? 'info'
                            : 'error'
                        }
                      />
                      <Ionicons name="add-circle" size={22} color={Colors.accent} style={{ marginLeft: Spacing.sm }} />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

// ─── Exercise Row ─────────────────────────────────────────────────────────────

const ExerciseRow: React.FC<{
  exercise: RoutineExercise;
  exerciseImage?: string;
  index: number;
  onChange: (index: number, key: keyof RoutineExercise, value: string | number) => void;
  onRemove: (index: number) => void;
}> = ({ exercise, exerciseImage, index, onChange, onRemove }) => (
  <View style={styles.exerciseRow}>
    <View style={styles.exerciseRowHeader}>
      {exerciseImage && (
        <ExerciseImage uri={exerciseImage} width={44} height={34} borderRadius={Radius.xs} />
      )}
      <View style={styles.exerciseRowNum}>
        <Text color="accent" style={{ fontWeight: FontWeight.bold }}>
          {index + 1}
        </Text>
      </View>
      <Text semibold style={{ flex: 1 }}>
        {exercise.exerciseName}
      </Text>
      <TouchableOpacity onPress={() => onRemove(index)}>
        <Ionicons name="trash-outline" size={18} color={Colors.error} />
      </TouchableOpacity>
    </View>

    <View style={styles.exerciseInputs}>
      {[
        { key: 'sets', label: 'Sets', placeholder: '3' },
        { key: 'reps', label: 'Reps', placeholder: '10' },
        { key: 'weight', label: 'Weight (kg)', placeholder: '0' },
        { key: 'restSeconds', label: 'Rest (s)', placeholder: '90' },
      ].map(({ key, label, placeholder }) => (
        <View key={key} style={styles.inputGroup}>
          <Text color="muted" style={styles.inputLabel}>
            {label}
          </Text>
          <TextInput
            style={styles.numberInput}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={(exercise as unknown as Record<string, unknown>)[key]?.toString() ?? ''}
            onChangeText={(v) =>
              onChange(index, key as keyof RoutineExercise, parseFloat(v) || 0)
            }
          />
        </View>
      ))}
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateRoutineScreen() {
  const addRoutine = useStore((s) => s.addRoutine);
  const customExercises = useStore(selectCustomExercises);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(ROUTINE_COLORS[0]);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [exerciseImages, setExerciseImages] = useState<Record<string, string>>({});
  const [showPicker, setShowPicker] = useState(false);

  const allExercises = [...EXERCISES, ...customExercises];

  const handleAddExercise = (exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: 3,
        reps: 10,
        weight: 0,
        restSeconds: 90,
      },
    ]);
    setExerciseImages((prev) => ({ ...prev, [exercise.id]: exercise.image }));
  };

  const handleChangeExercise = (
    index: number,
    key: keyof RoutineExercise,
    value: string | number
  ) => {
    setExercises((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [key]: value } : e))
    );
  };

  const handleRemoveExercise = (index: number) => {
    Alert.alert('Remove Exercise', 'Remove this exercise from the routine?', [
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setExercises((prev) => prev.filter((_, i) => i !== index));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please give your routine a name.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Add at least one exercise to the routine.');
      return;
    }

    addRoutine({
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
      exercises,
      createdAt: new Date().toISOString(),
      estimatedDuration: Math.ceil(
        exercises.reduce((acc, e) => {
          const setTime = 45;
          const restTime = e.restSeconds ?? 90;
          return acc + e.sets * (setTime + restTime);
        }, 0) / 60
      ),
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <Text color="secondary" style={styles.fieldLabel}>
          Routine Name *
        </Text>
        <TextInput
          style={styles.nameInput}
          placeholder="e.g. Push Day, Full Body, Leg Day..."
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />

        {/* Description */}
        <Text color="secondary" style={styles.fieldLabel}>
          Description (optional)
        </Text>
        <TextInput
          style={[styles.nameInput, { height: 80, textAlignVertical: 'top', paddingTop: Spacing.md }]}
          placeholder="Describe your routine..."
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={200}
        />

        {/* Color picker */}
        <Text color="secondary" style={styles.fieldLabel}>
          Color
        </Text>
        <View style={styles.colorRow}>
          {ROUTINE_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setSelectedColor(color)}
              style={[
                styles.colorSwatch,
                { backgroundColor: color },
                selectedColor === color && styles.colorSwatchSelected,
              ]}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={16} color="#000" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Exercises */}
        <View style={styles.exercisesHeader}>
          <Text semibold style={{ fontSize: FontSize.lg }}>
            Exercises ({exercises.length})
          </Text>
          <TouchableOpacity
            style={styles.addExerciseBtn}
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.addExerciseBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {exercises.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyExercises}
            onPress={() => setShowPicker(true)}
          >
            <Text style={{ fontSize: 40, marginBottom: Spacing.sm }}>🏋️</Text>
            <Text color="secondary">Tap to add exercises</Text>
          </TouchableOpacity>
        ) : (
          exercises.map((exercise, i) => (
            <ExerciseRow
              key={`${exercise.exerciseId}-${i}`}
              exercise={exercise}
              exerciseImage={exerciseImages[exercise.exerciseId]}
              index={i}
              onChange={handleChangeExercise}
              onRemove={handleRemoveExercise}
            />
          ))
        )}

        {exercises.length > 0 && (
          <Button
            title="+ Add Another Exercise"
            variant="outline"
            fullWidth
            onPress={() => setShowPicker(true)}
            style={{ marginTop: Spacing.md }}
          />
        )}
      </ScrollView>

      {/* Save button */}
      <View style={styles.saveWrap}>
        <Button
          title="Save Routine"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSave}
        />
      </View>

      <ExercisePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAddExercise}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  fieldLabel: { marginBottom: Spacing.sm, fontSize: FontSize.sm },
  nameInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    marginBottom: Spacing.xl,
  },

  colorRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: Colors.textPrimary,
    transform: [{ scale: 1.15 }],
  },

  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    gap: 4,
    ...Shadow.accentGlow,
  },
  addExerciseBtnText: {
    color: '#000',
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  emptyExercises: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  exerciseRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  exerciseRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.bgCard2,
    gap: Spacing.sm,
  },
  exerciseRowNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accentGlow2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInputs: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inputGroup: { flex: 1, alignItems: 'center' },
  inputLabel: { fontSize: FontSize.xs, marginBottom: 4, textAlign: 'center' },
  numberInput: {
    width: '100%',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    minHeight: 40,
  },

  saveWrap: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },

  // Picker
  pickerContainer: { flex: 1, backgroundColor: Colors.bgModal },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.accent },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    height: 44,
  },
  pickerSearchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  muscleFilters: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  muscleChip: {
    paddingHorizontal: Spacing.md,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  muscleChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  exerciseItemLeft: { flex: 1, minWidth: 0 },
  exerciseItemRight: { flexDirection: 'row', alignItems: 'center' },

  pickerFab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadow.accentGlow,
  },
  customBadge: {
    backgroundColor: 'rgba(0,255,157,0.12)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,255,157,0.3)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  customBadgeText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
