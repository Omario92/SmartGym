/**
 * Add / Edit Custom Exercise Screen
 * Full-screen form for creating or editing custom exercises.
 * Accessed via: /routine/add-custom-exercise?editId=<id>
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ExerciseImage } from '@/components/exercise/ExerciseImage';
import { useStore, selectCustomExercises } from '@/store';
import {
  MUSCLE_GROUPS,
  type MuscleGroup,
  type Equipment,
  type CustomExercise,
} from '@/lib/exercises';

const { width: SCREEN_W } = Dimensions.get('window');

const EQUIPMENT_OPTIONS: { id: Equipment; label: string; icon: string }[] = [
  { id: 'barbell', label: 'Barbell', icon: '🏋️' },
  { id: 'dumbbell', label: 'Dumbbell', icon: '🔵' },
  { id: 'machine', label: 'Machine', icon: '⚙️' },
  { id: 'cable', label: 'Cable', icon: '🔗' },
  { id: 'bodyweight', label: 'Bodyweight', icon: '🤸' },
  { id: 'kettlebell', label: 'Kettlebell', icon: '⚫' },
  { id: 'resistance_band', label: 'Band', icon: '🔴' },
  { id: 'smith_machine', label: 'Smith', icon: '🔩' },
];

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const;

type Difficulty = (typeof DIFFICULTY_OPTIONS)[number];

// ─── Field label ──────────────────────────────────────────────────────────────
const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <Text color="secondary" style={styles.fieldLabel}>
    {label}
    {required && <Text color="error"> *</Text>}
  </Text>
);

// ─── Section card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.sectionCard}>{children}</View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddCustomExerciseScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const customExercises = useStore(selectCustomExercises);
  const addCustomExercise = useStore((s) => s.addCustomExercise);
  const updateCustomExercise = useStore((s) => s.updateCustomExercise);

  const existing = editId
    ? customExercises.find((e) => e.id === editId)
    : undefined;

  // ── Form state ──
  const [name, setName] = useState(existing?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(
    existing?.muscleGroup ?? 'chest'
  );
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>(
    (existing?.secondaryMuscles as MuscleGroup[]) ?? []
  );
  const [equipment, setEquipment] = useState<Equipment>(
    existing?.equipment ?? 'bodyweight'
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    existing?.difficulty ?? 'beginner'
  );
  const [imageUrl, setImageUrl] = useState(existing?.image ?? '');
  const [imagePreview, setImagePreview] = useState(existing?.image ?? '');
  const [gifUrl, setGifUrl] = useState(existing?.gif ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [instructions, setInstructions] = useState<string[]>(
    existing?.instructions ?? ['']
  );

  // ── Validation ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Exercise name is required';
    } else if (
      !editId &&
      customExercises.some(
        (e) => e.name.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      newErrors.name = 'An exercise with this name already exists';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateId = (n: string): string =>
    n
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') +
    '_' +
    Date.now().toString(36);

  const handleSave = () => {
    if (!validate()) return;

    const cleanInstructions = instructions.filter((s) => s.trim().length > 0);

    const exercise: CustomExercise = {
      id: existing?.id ?? generateId(name),
      name: name.trim(),
      muscleGroup,
      secondaryMuscles: secondaryMuscles.length > 0 ? secondaryMuscles : undefined,
      equipment,
      type: 'strength',
      description: description.trim(),
      instructions: cleanInstructions,
      tips: [],
      difficulty,
      isPopular: false,
      image:
        imagePreview.trim() ||
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
      gif: gifUrl.trim() || undefined,
      isCustom: true,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    if (existing) {
      updateCustomExercise(existing.id, exercise);
    } else {
      addCustomExercise(exercise);
    }

    router.back();
  };

  const toggleSecondaryMuscle = useCallback((m: MuscleGroup) => {
    setSecondaryMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }, []);

  const addInstruction = () => setInstructions((prev) => [...prev, '']);
  const updateInstruction = (i: number, val: string) =>
    setInstructions((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  const removeInstruction = (i: number) =>
    setInstructions((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Name ── */}
        <SectionCard>
          <FieldLabel label="Exercise Name" required />
          <TextInput
            style={[styles.textInput, errors.name ? styles.inputError : null]}
            placeholder="e.g. Bulgarian Split Squat"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (errors.name) setErrors((e) => ({ ...e, name: '' }));
            }}
            maxLength={60}
          />
          {errors.name ? (
            <Text color="error" style={styles.errorText}>
              {errors.name}
            </Text>
          ) : null}
        </SectionCard>

        {/* ── Primary Muscle ── */}
        <SectionCard>
          <FieldLabel label="Primary Muscle Group" required />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {MUSCLE_GROUPS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.chip,
                    muscleGroup === m.id && styles.chipActive,
                  ]}
                  onPress={() => setMuscleGroup(m.id)}
                >
                  <Text
                    style={{
                      fontSize: FontSize.sm,
                      color: muscleGroup === m.id ? '#000' : Colors.textSecondary,
                      fontWeight:
                        muscleGroup === m.id ? FontWeight.bold : FontWeight.regular,
                    }}
                  >
                    {m.icon} {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SectionCard>

        {/* ── Secondary Muscles ── */}
        <SectionCard>
          <FieldLabel label="Secondary Muscles (optional)" />
          <View style={styles.wrapChips}>
            {MUSCLE_GROUPS.map((m) => {
              const active = secondaryMuscles.includes(m.id);
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.chip, active && styles.chipActiveSecondary]}
                  onPress={() => toggleSecondaryMuscle(m.id)}
                >
                  <Text
                    style={{
                      fontSize: FontSize.sm,
                      color: active ? Colors.accent : Colors.textSecondary,
                      fontWeight: active ? FontWeight.semibold : FontWeight.regular,
                    }}
                  >
                    {m.icon} {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* ── Equipment ── */}
        <SectionCard>
          <FieldLabel label="Equipment" required />
          <View style={styles.wrapChips}>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <TouchableOpacity
                key={eq.id}
                style={[
                  styles.chip,
                  equipment === eq.id && styles.chipActive,
                ]}
                onPress={() => setEquipment(eq.id)}
              >
                <Text
                  style={{
                    fontSize: FontSize.sm,
                    color: equipment === eq.id ? '#000' : Colors.textSecondary,
                    fontWeight:
                      equipment === eq.id ? FontWeight.bold : FontWeight.regular,
                  }}
                >
                  {eq.icon} {eq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* ── Difficulty ── */}
        <SectionCard>
          <FieldLabel label="Difficulty" required />
          <View style={styles.segmentRow}>
            {DIFFICULTY_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.segment,
                  difficulty === d && styles.segmentActive,
                ]}
                onPress={() => setDifficulty(d)}
              >
                <Text
                  style={{
                    fontSize: FontSize.sm,
                    color:
                      difficulty === d ? '#000' : Colors.textSecondary,
                    fontWeight:
                      difficulty === d ? FontWeight.bold : FontWeight.regular,
                    textTransform: 'capitalize',
                  }}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* ── Image URL ── */}
        <SectionCard>
          <FieldLabel label="Image URL (optional)" />
          <View style={styles.urlRow}>
            <TextInput
              style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
              placeholder="https://..."
              placeholderTextColor={Colors.textMuted}
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() => setImagePreview(imageUrl)}
            >
              <Text style={styles.previewBtnText}>Preview</Text>
            </TouchableOpacity>
          </View>
          {imagePreview ? (
            <View style={styles.imagePreviewWrap}>
              <ExerciseImage
                uri={imagePreview}
                width={SCREEN_W - Spacing.lg * 4}
                height={180}
                borderRadius={Radius.lg}
              />
            </View>
          ) : null}
        </SectionCard>

        {/* ── GIF URL ── */}
        <SectionCard>
          <FieldLabel label="GIF URL (optional)" />
          <TextInput
            style={styles.textInput}
            placeholder="https://...gif"
            placeholderTextColor={Colors.textMuted}
            value={gifUrl}
            onChangeText={setGifUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </SectionCard>

        {/* ── Description ── */}
        <SectionCard>
          <FieldLabel label="Description (optional)" />
          <TextInput
            style={[styles.textInput, styles.multiline]}
            placeholder="Describe what this exercise targets and how it benefits you..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={400}
            textAlignVertical="top"
          />
        </SectionCard>

        {/* ── Instructions ── */}
        <SectionCard>
          <FieldLabel label="Step-by-Step Instructions (optional)" />
          {instructions.map((step, i) => (
            <View key={i} style={styles.instructionRow}>
              <View style={styles.stepBadge}>
                <Text color="accent" style={{ fontWeight: FontWeight.bold, fontSize: FontSize.xs }}>
                  {i + 1}
                </Text>
              </View>
              <TextInput
                style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                placeholder={`Step ${i + 1}...`}
                placeholderTextColor={Colors.textMuted}
                value={step}
                onChangeText={(v) => updateInstruction(i, v)}
              />
              {instructions.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeInstruction(i)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addStepBtn} onPress={addInstruction}>
            <Ionicons name="add" size={16} color={Colors.accent} />
            <Text color="accent" style={{ fontSize: FontSize.sm }}>
              Add Step
            </Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ── Preview Card ── */}
        {name.trim() ? (
          <View style={styles.previewCard}>
            <Text color="secondary" style={styles.previewLabel}>
              PREVIEW
            </Text>
            <View style={styles.previewInner}>
              {imagePreview ? (
                <ExerciseImage
                  uri={imagePreview}
                  width={SCREEN_W - Spacing.lg * 4}
                  height={140}
                  borderRadius={Radius.md}
                />
              ) : null}
              <View style={styles.previewMeta}>
                <Text semibold style={{ fontSize: FontSize.lg }}>
                  {name.trim() || 'Exercise Name'}
                </Text>
                <Text color="secondary" style={{ fontSize: FontSize.sm, marginTop: 4 }}>
                  {muscleGroup.replace('_', ' ')} ·{' '}
                  {equipment.replace('_', ' ')} · {difficulty}
                </Text>
                <View
                  style={[
                    styles.customBadge,
                    { backgroundColor: Colors.accentGlow2, borderColor: Colors.accentGlow },
                  ]}
                >
                  <Text color="accent" style={{ fontSize: FontSize.xs }}>
                    ✨ Custom
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Save / Cancel ── */}
        <View style={styles.actions}>
          <Button
            title={existing ? 'Update Exercise' : 'Save Exercise'}
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSave}
          />
          <Button
            title="Cancel"
            variant="ghost"
            size="lg"
            fullWidth
            onPress={() => router.back()}
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing['5xl'] },

  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  fieldLabel: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  errorText: { fontSize: FontSize.xs, marginTop: Spacing.xs },

  textInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    marginBottom: Spacing.sm,
  },
  inputError: { borderColor: Colors.error },
  multiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: Spacing.md },

  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipActiveSecondary: {
    backgroundColor: Colors.accentGlow2,
    borderColor: Colors.accentGlow,
  },

  segmentRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard2,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.accent,
  },

  urlRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  previewBtn: {
    backgroundColor: Colors.bgCard2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  previewBtnText: {
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  imagePreviewWrap: { marginTop: Spacing.sm },

  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accentGlow2,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    padding: Spacing.sm,
  },

  previewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.accentGlow,
  },
  previewLabel: {
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    fontWeight: FontWeight.semibold,
  },
  previewInner: { gap: Spacing.md },
  previewMeta: { gap: 4 },
  customBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },

  actions: { marginTop: Spacing.md },
});
