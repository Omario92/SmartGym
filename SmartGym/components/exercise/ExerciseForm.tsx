/**
 * ExerciseForm — Controlled form for creating/editing a custom exercise.
 * Uses react-hook-form for validation + state management.
 */

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Icon } from '@/components/ui/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import {
  MUSCLE_GROUPS,
  EQUIPMENT_LABELS,
  type MuscleGroup,
  type Equipment,
  type ExerciseType,
} from '@/lib/exercises';

// ─── Form types ───────────────────────────────────────────────────────────────

export interface ExerciseFormValues {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  type: ExerciseType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  instructions: { value: string }[];
  tips: { value: string }[];
  notes: string;
}

interface ExerciseFormProps {
  defaultValues?: Partial<ExerciseFormValues>;
  onSubmit: (values: ExerciseFormValues) => void;
  loading?: boolean;
  submitLabel?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EQUIPMENT_OPTIONS: Equipment[] = [
  'barbell', 'dumbbell', 'machine', 'cable',
  'bodyweight', 'kettlebell', 'resistance_band', 'smith_machine', 'other',
];

const DIFFICULTY_OPTIONS: { value: ExerciseFormValues['difficulty']; label: string; color: string }[] = [
  { value: 'beginner', label: 'Beginner', color: '#00FF9D' },
  { value: 'intermediate', label: 'Intermediate', color: '#4DA6FF' },
  { value: 'advanced', label: 'Advanced', color: '#FF6B6B' },
];

const TYPE_OPTIONS: { value: ExerciseType; label: string; icon: string }[] = [
  { value: 'strength', label: 'Strength', icon: '💪' },
  { value: 'cardio', label: 'Cardio', icon: '❤️' },
  { value: 'flexibility', label: 'Flexibility', icon: '🧘' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ExerciseForm({ defaultValues, onSubmit, loading, submitLabel }: ExerciseFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<ExerciseFormValues>({
    defaultValues: {
      name: '',
      muscleGroup: 'chest',
      equipment: 'barbell',
      type: 'strength',
      difficulty: 'intermediate',
      description: '',
      instructions: [{ value: '' }],
      tips: [{ value: '' }],
      notes: '',
      ...defaultValues,
    },
  });

  const instructionsField = useFieldArray({ control, name: 'instructions' });
  const tipsField = useFieldArray({ control, name: 'tips' });

  return (
    <View>
      {/* Name */}
      <FieldLabel required>Exercise Name</FieldLabel>
      <Controller
        control={control}
        name="name"
        rules={{ required: 'Name is required', minLength: { value: 2, message: 'Too short' } }}
        render={({ field }) => (
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="e.g. Incline Dumbbell Press"
            placeholderTextColor={Colors.textMuted}
            value={field.value}
            onChangeText={field.onChange}
            maxLength={80}
          />
        )}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

      {/* Muscle Group */}
      <FieldLabel required>Primary Muscle</FieldLabel>
      <Controller
        control={control}
        name="muscleGroup"
        render={({ field }) => (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {MUSCLE_GROUPS.map((mg) => {
              const active = field.value === mg.id;
              return (
                <TouchableOpacity
                  key={mg.id}
                  style={[
                    styles.chip,
                    active && { borderColor: mg.color, backgroundColor: mg.color + '22' },
                  ]}
                  onPress={() => field.onChange(mg.id)}
                >
                  <Text style={[styles.chipText, active && { color: mg.color, fontFamily: FontFamily.bodyBold }]}>
                    {mg.icon} {mg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      />

      {/* Equipment */}
      <FieldLabel required>Equipment</FieldLabel>
      <Controller
        control={control}
        name="equipment"
        render={({ field }) => (
          <View style={styles.wrapRow}>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <TouchableOpacity
                key={eq}
                style={[styles.chip, field.value === eq && styles.chipActive]}
                onPress={() => field.onChange(eq)}
              >
                <Text style={[styles.chipText, field.value === eq && styles.chipTextActive]}>
                  {EQUIPMENT_LABELS[eq]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Type */}
      <FieldLabel>Exercise Type</FieldLabel>
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <View style={styles.row}>
            {TYPE_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typePill, field.value === t.value && styles.typePillActive]}
                onPress={() => field.onChange(t.value)}
              >
                <Text style={{ fontSize: 18 }}>{t.icon}</Text>
                <Text style={[styles.chipText, field.value === t.value && styles.chipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Difficulty */}
      <FieldLabel>Difficulty</FieldLabel>
      <Controller
        control={control}
        name="difficulty"
        render={({ field }) => (
          <View style={styles.row}>
            {DIFFICULTY_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[
                  styles.diffPill,
                  field.value === d.value && { borderColor: d.color, backgroundColor: d.color + '20' },
                ]}
                onPress={() => field.onChange(d.value)}
              >
                <Text style={[
                  styles.chipText,
                  field.value === d.value && { color: d.color, fontFamily: FontFamily.bodyBold },
                ]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Description */}
      <FieldLabel>Description</FieldLabel>
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Briefly describe this exercise..."
            placeholderTextColor={Colors.textMuted}
            value={field.value}
            onChangeText={field.onChange}
            multiline
            numberOfLines={3}
            maxLength={400}
          />
        )}
      />

      {/* Instructions */}
      <FieldLabel>Instructions</FieldLabel>
      {instructionsField.fields.map((item, idx) => (
        <View key={item.id} style={styles.listRow}>
          <Text style={styles.stepNum}>{idx + 1}</Text>
          <Controller
            control={control}
            name={`instructions.${idx}.value`}
            render={({ field }) => (
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder={`Step ${idx + 1}`}
                placeholderTextColor={Colors.textMuted}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {instructionsField.fields.length > 1 && (
            <TouchableOpacity onPress={() => instructionsField.remove(idx)} style={styles.removeBtn}>
              <Icon name="close" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity
        style={styles.addRowBtn}
        onPress={() => instructionsField.append({ value: '' })}
      >
        <Icon name="add" size={16} color={Colors.accent} />
        <Text style={{ color: Colors.accent, fontSize: FontSize.sm }}>Add step</Text>
      </TouchableOpacity>

      {/* Tips */}
      <FieldLabel>Tips (optional)</FieldLabel>
      {tipsField.fields.map((item, idx) => (
        <View key={item.id} style={styles.listRow}>
          <Icon name="bulb-outline" size={16} color={Colors.accent} style={{ marginRight: 8 }} />
          <Controller
            control={control}
            name={`tips.${idx}.value`}
            render={({ field }) => (
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Coaching tip..."
                placeholderTextColor={Colors.textMuted}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {tipsField.fields.length > 1 && (
            <TouchableOpacity onPress={() => tipsField.remove(idx)} style={styles.removeBtn}>
              <Icon name="close" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity
        style={styles.addRowBtn}
        onPress={() => tipsField.append({ value: '' })}
      >
        <Icon name="add" size={16} color={Colors.accent} />
        <Text style={{ color: Colors.accent, fontSize: FontSize.sm }}>Add tip</Text>
      </TouchableOpacity>

      {/* Personal Notes */}
      <FieldLabel>Personal Notes</FieldLabel>
      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Private coaching notes for yourself..."
            placeholderTextColor={Colors.textMuted}
            value={field.value}
            onChangeText={field.onChange}
            multiline
            numberOfLines={3}
            maxLength={600}
          />
        )}
      />

      {/* Submit */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.accent, Colors.iconEnergyCyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.submitBtnText}>
          {loading ? 'Saving…' : (submitLabel ?? 'Save Exercise')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Small helper ─────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required && <Text style={{ color: Colors.error }}> *</Text>}
    </Text>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.bodyMedium,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    marginBottom: Spacing.sm,
  },
  inputError: { borderColor: Colors.error },
  multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: Spacing.sm },
  errorText: { color: Colors.error, fontSize: FontSize.xs, marginBottom: Spacing.xs },

  chipRow: { flexGrow: 0 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  chipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  chipTextActive: { color: Colors.accent, fontFamily: FontFamily.bodyBold },

  typePill: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  typePillActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },

  diffPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepNum: {
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    backgroundColor: Colors.bgCard2,
    borderRadius: 12,
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontFamily: FontFamily.bodyBold,
  },
  removeBtn: { padding: 4 },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  submitBtn: {
    marginTop: Spacing.xl,
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  submitBtnText: {
    color: '#06070D',
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.lg,
  },
});
