/**
 * Add / Edit Custom Exercise — v2.0
 * react-hook-form + Zod validation, image picker (camera / gallery / URL),
 * local image persistence, personal notes, live preview card, draft saving,
 * unsaved-changes guard.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontFamily, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ExerciseImage } from '@/components/exercise/ExerciseImage';
import { useStore, selectCustomExercises, selectCustomExerciseDraft } from '@/store';
import {
  MUSCLE_GROUPS,
  EQUIPMENT_LABELS,
  type MuscleGroup,
  type Equipment,
  type CustomExercise,
} from '@/lib/exercises';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const EQUIPMENT_OPTIONS = Object.keys(EQUIPMENT_LABELS) as Equipment[];

const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name is too long'),
  muscleGroup: z.string().min(1, 'Select a primary muscle group'),
  secondaryMuscles: z.array(z.string()),
  equipment: z.string().min(1, 'Select equipment'),
  otherEquipment: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  imageUrl: z.string().optional(),
  gifUrl: z.string().optional(),
  description: z.string().max(500, 'Description is too long').optional(),
  instructions: z.array(z.object({ value: z.string() })),
  notes: z.string().max(400, 'Notes are too long').optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Sub-components ───────────────────────────────────────────────────────────

const FieldLabel: React.FC<{ label: string; required?: boolean; hint?: string }> = ({
  label,
  required,
  hint,
}) => (
  <View style={{ marginBottom: Spacing.sm }}>
    <Text color="secondary" style={styles.fieldLabel}>
      {label}
      {required && <Text color="error"> *</Text>}
    </Text>
    {hint && (
      <Text color="muted" style={{ fontSize: FontSize.xs, marginTop: 2 }}>
        {hint}
      </Text>
    )}
  </View>
);

const SectionCard: React.FC<{
  children: React.ReactNode;
  title?: string;
  glowing?: boolean;
}> = ({ children, title, glowing }) => (
  <View style={[styles.sectionCard, glowing && styles.sectionCardGlow]}>
    {title && (
      <Text
        style={{
          fontSize: FontSize.xs,
          fontFamily: FontFamily.bodyBold,
          letterSpacing: 1.2,
          color: glowing ? Colors.accent : Colors.textMuted,
          marginBottom: Spacing.md,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
    )}
    {children}
  </View>
);

// ─── Image Picker Section ─────────────────────────────────────────────────────

const ImagePickerSection: React.FC<{
  imageUrl: string;
  imageIsLocal: boolean;
  onUrlChange: (url: string, isLocal: boolean) => void;
  error?: string;
}> = ({ imageUrl, imageIsLocal, onUrlChange, error }) => {
  const [urlInput, setUrlInput] = useState(imageUrl && !imageIsLocal ? imageUrl : '');
  const [loading, setLoading] = useState(false);

  const saveLocally = async (uri: string): Promise<string> => {
    const dir = FileSystem.documentDirectory + 'custom_exercise_images/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const filename = `exercise_${Date.now()}.jpg`;
    const dest = dir + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      try {
        const localUri = await saveLocally(result.assets[0].uri);
        onUrlChange(localUri, true);
      } catch {
        Alert.alert('Error', 'Failed to save image. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      try {
        const localUri = await saveLocally(result.assets[0].uri);
        onUrlChange(localUri, true);
      } catch {
        Alert.alert('Error', 'Failed to save image. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const applyUrl = () => {
    if (urlInput.trim()) {
      onUrlChange(urlInput.trim(), false);
    }
  };

  return (
    <SectionCard title="Exercise Image">
      {/* Pick buttons */}
      <View style={styles.imagePickRow}>
        <TouchableOpacity style={styles.imagePickBtn} onPress={takePhoto}>
          <Ionicons name="camera" size={20} color={Colors.accent} />
          <Text color="accent" style={{ fontSize: FontSize.sm, marginTop: 4 }}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.imagePickBtn} onPress={pickFromLibrary}>
          <Ionicons name="images" size={20} color={Colors.accent} />
          <Text color="accent" style={{ fontSize: FontSize.sm, marginTop: 4 }}>Gallery</Text>
        </TouchableOpacity>
        <View style={styles.imagePickOrDivider}>
          <View style={styles.imagePickDividerLine} />
          <Text color="muted" style={{ fontSize: FontSize.xs, marginHorizontal: Spacing.sm }}>OR</Text>
          <View style={styles.imagePickDividerLine} />
        </View>
        <View style={styles.urlInputWrap}>
          <TextInput
            style={[styles.urlInput, error ? styles.inputError : null]}
            placeholder="Paste image URL..."
            placeholderTextColor={Colors.textMuted}
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={applyUrl}
          />
          <TouchableOpacity style={styles.applyBtn} onPress={applyUrl}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && <Text color="error" style={styles.errorText}>{error}</Text>}

      {/* Preview */}
      {loading && (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator color={Colors.accent} />
          <Text color="muted" style={{ fontSize: FontSize.sm, marginTop: Spacing.sm }}>
            Saving image...
          </Text>
        </View>
      )}
      {!loading && imageUrl ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.imagePreviewWrap}>
          <ExerciseImage
            uri={imageUrl}
            width={SCREEN_W - Spacing.lg * 4}
            height={190}
            borderRadius={Radius.xl}
            style={{ ...Shadow.accentGlow }}
          />
          {imageIsLocal && (
            <View style={styles.localBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={{ color: Colors.success, fontSize: FontSize.xs, marginLeft: 4 }}>
                Saved locally
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.removeImgBtn}
            onPress={() => { onUrlChange('', false); setUrlInput(''); }}
          >
            <Ionicons name="close-circle" size={22} color={Colors.error} />
          </TouchableOpacity>
        </Animated.View>
      ) : null}
      {!loading && !imageUrl && (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
          <Text color="muted" style={{ fontSize: FontSize.sm, marginTop: Spacing.sm }}>
            No image selected
          </Text>
        </View>
      )}
    </SectionCard>
  );
};

// ─── Live Preview Card ────────────────────────────────────────────────────────

const LivePreviewCard: React.FC<{
  name: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  imageUrl: string;
}> = ({ name, muscleGroup, equipment, difficulty, imageUrl }) => {
  const diffColor: Record<string, string> = {
    beginner: Colors.success,
    intermediate: Colors.info,
    advanced: Colors.error,
  };

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.previewCard}>
      <Text
        style={{
          fontSize: FontSize.xs,
          letterSpacing: 1.5,
          color: Colors.accent,
          fontFamily: FontFamily.bodyBold,
          marginBottom: Spacing.md,
          textTransform: 'uppercase',
        }}
      >
        Live Preview
      </Text>
      <View style={styles.previewInner}>
        {imageUrl ? (
          <ExerciseImage
            uri={imageUrl}
            width={SCREEN_W - Spacing.lg * 4}
            height={150}
            borderRadius={Radius.lg}
          />
        ) : (
          <View style={styles.previewNoImg}>
            <Text style={{ fontSize: 36 }}>🏋️</Text>
          </View>
        )}
        <View style={styles.previewMeta}>
          <Text semibold style={{ fontSize: FontSize.lg }}>
            {name || 'Exercise Name'}
          </Text>
          <Text color="secondary" style={{ fontSize: FontSize.sm, marginTop: 3, textTransform: 'capitalize' }}>
            {(muscleGroup || 'muscle').replace(/_/g, ' ')} ·{' '}
            {(equipment || 'equipment').replace(/_/g, ' ')}
          </Text>
          <View style={styles.previewBadgeRow}>
            <View
              style={[
                styles.previewDiffBadge,
                { backgroundColor: (diffColor[difficulty] || Colors.info) + '33' },
              ]}
            >
              <Text
                style={{
                  color: diffColor[difficulty] || Colors.info,
                  fontSize: FontSize.xs,
                  fontFamily: FontFamily.bodyBold,
                  textTransform: 'capitalize',
                }}
              >
                {difficulty || 'beginner'}
              </Text>
            </View>
            <View style={styles.customBadgePreview}>
              <Text style={{ color: Colors.accent, fontSize: FontSize.xs }}>✨ Custom</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddCustomExerciseScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const customExercises = useStore(selectCustomExercises);
  const draft = useStore(selectCustomExerciseDraft);
  const addCustomExercise = useStore((s) => s.addCustomExercise);
  const updateCustomExercise = useStore((s) => s.updateCustomExercise);
  const saveCustomExerciseDraft = useStore((s) => s.saveCustomExerciseDraft);
  const clearCustomExerciseDraft = useStore((s) => s.clearCustomExerciseDraft);

  const existing = editId
    ? customExercises.find((e) => e.id === editId)
    : undefined;

  const [imageUrl, setImageUrl] = useState<string>(existing?.image ?? '');
  const [imageIsLocal, setImageIsLocal] = useState<boolean>(existing?.imageIsLocal ?? false);
  const [imageError, setImageError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      name: existing?.name ?? draft?.name ?? '',
      muscleGroup: existing?.muscleGroup ?? draft?.muscleGroup ?? 'chest',
      secondaryMuscles: (existing?.secondaryMuscles as string[]) ?? [],
      equipment: existing?.equipment ?? draft?.equipment ?? 'bodyweight',
      otherEquipment: '',
      difficulty: existing?.difficulty ?? (draft?.difficulty as FormData['difficulty']) ?? 'beginner',
      imageUrl: '',
      gifUrl: existing?.gif ?? '',
      description: existing?.description ?? '',
      instructions:
        existing?.instructions.map((v) => ({ value: v })) ??
        [{ value: '' }],
      notes: existing?.notes ?? '',
    },
  });

  const { fields: instructionFields, append, remove } = useFieldArray({
    control,
    name: 'instructions',
  });

  const watchedValues = watch(['name', 'muscleGroup', 'equipment', 'difficulty']);
  const watchedName = watchedValues[0];
  const watchedMuscle = watchedValues[1];
  const watchedEquipment = watchedValues[2];
  const watchedDifficulty = watchedValues[3];

  // Android back button unsaved guard
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isDirty || imageUrl) {
        confirmLeave();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [isDirty, imageUrl]);

  const confirmLeave = () => {
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Save as draft or discard?',
      [
        {
          text: 'Save Draft',
          onPress: () => {
            saveCustomExerciseDraft({
              name: watchedName,
              muscleGroup: watchedMuscle,
              equipment: watchedEquipment,
              difficulty: watchedDifficulty,
              savedAt: new Date().toISOString(),
            });
            router.back();
          },
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            clearCustomExerciseDraft();
            router.back();
          },
        },
        { text: 'Keep Editing', style: 'cancel' },
      ]
    );
  };

  const generateId = (n: string): string =>
    n
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') +
    '_' +
    Date.now().toString(36);

  const onSubmit = async (data: FormData) => {
    // Unique name check
    if (
      !editId &&
      customExercises.some(
        (e) => e.name.toLowerCase() === data.name.trim().toLowerCase()
      )
    ) {
      Alert.alert('Name taken', 'An exercise with this name already exists. Please choose a different name.');
      return;
    }

    setIsSaving(true);

    const cleanInstructions = data.instructions
      .map((i) => i.value.trim())
      .filter(Boolean);

    const effectiveEquipment: Equipment =
      data.equipment === 'other' ? 'other' : (data.equipment as Equipment);

    const exercise: CustomExercise = {
      id: existing?.id ?? generateId(data.name),
      name: data.name.trim(),
      muscleGroup: data.muscleGroup as MuscleGroup,
      secondaryMuscles:
        data.secondaryMuscles.length > 0
          ? (data.secondaryMuscles as MuscleGroup[])
          : undefined,
      equipment: effectiveEquipment,
      type: 'strength',
      description: data.description?.trim() ?? '',
      instructions: cleanInstructions,
      tips: [],
      difficulty: data.difficulty,
      isPopular: false,
      image:
        imageUrl ||
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
      imageIsLocal,
      gif: data.gifUrl?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      isCustom: true,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    if (existing) {
      updateCustomExercise(existing.id, exercise);
    } else {
      addCustomExercise(exercise);
    }

    clearCustomExerciseDraft();
    setIsSaving(false);
    router.back();
  };

  const handleCancel = () => {
    if (isDirty || imageUrl) {
      confirmLeave();
    } else {
      router.back();
    }
  };

  const selectedMuscles = watch('secondaryMuscles');
  const selectedEquipment = watch('equipment');
  const selectedDifficulty = watch('difficulty');

  const toggleSecondary = useCallback(
    (m: string) => {
      const current = selectedMuscles ?? [];
      if (current.includes(m)) {
        setValue('secondaryMuscles', current.filter((x) => x !== m), { shouldDirty: true });
      } else {
        setValue('secondaryMuscles', [...current, m], { shouldDirty: true });
      }
    },
    [selectedMuscles, setValue]
  );

  // Draft indicator
  const hasDraft = !!draft && !editId;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Draft banner */}
        {hasDraft && (
          <TouchableOpacity
            style={styles.draftBanner}
            onPress={() => {
              setValue('name', draft.name, { shouldDirty: true });
              setValue('muscleGroup', draft.muscleGroup, { shouldDirty: true });
              setValue('equipment', draft.equipment as Equipment, { shouldDirty: true });
              clearCustomExerciseDraft();
            }}
          >
            <Ionicons name="document-text-outline" size={16} color={Colors.warning} />
            <Text style={{ color: Colors.warning, fontSize: FontSize.sm, flex: 1, marginLeft: Spacing.sm }}>
              You have a saved draft — tap to restore
            </Text>
            <TouchableOpacity onPress={clearCustomExerciseDraft}>
              <Ionicons name="close" size={16} color={Colors.warning} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* ── Exercise Name ── */}
        <SectionCard>
          <FieldLabel label="Exercise Name" required />
          <Controller
            control={control}
            name="name"
            rules={{
              required: 'Exercise name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: 60, message: 'Name is too long' },
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.textInput, errors.name ? styles.inputError : null]}
                placeholder="e.g. Bulgarian Split Squat"
                placeholderTextColor={Colors.textMuted}
                value={value}
                onChangeText={onChange}
                maxLength={60}
                returnKeyType="next"
              />
            )}
          />
          {errors.name && (
            <Text color="error" style={styles.errorText}>
              {errors.name.message}
            </Text>
          )}
        </SectionCard>

        {/* ── Primary Muscle Group ── */}
        <SectionCard>
          <FieldLabel label="Primary Muscle Group" required />
          <Controller
            control={control}
            name="muscleGroup"
            render={({ field: { onChange, value } }) => (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {MUSCLE_GROUPS.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.chip, value === m.id && styles.chipActive]}
                      onPress={() => onChange(m.id)}
                    >
                      <Text
                        style={{
                          fontSize: FontSize.sm,
                          color: value === m.id ? '#000' : Colors.textSecondary,
                          fontFamily: value === m.id ? FontFamily.bodyBold : FontFamily.body,
                        }}
                      >
                        {m.icon} {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          />
        </SectionCard>

        {/* ── Secondary Muscles ── */}
        <SectionCard>
          <FieldLabel label="Secondary Muscles" hint="Optional — select multiple" />
          <View style={styles.wrapChips}>
            {MUSCLE_GROUPS.map((m) => {
              const active = selectedMuscles?.includes(m.id) ?? false;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.chip, active && styles.chipActiveSecondary]}
                  onPress={() => toggleSecondary(m.id)}
                >
                  <Text
                    style={{
                      fontSize: FontSize.sm,
                      color: active ? Colors.accent : Colors.textSecondary,
                      fontFamily: active ? FontFamily.bodyBold : FontFamily.body,
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
          <Controller
            control={control}
            name="equipment"
            rules={{ required: 'Equipment is required' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.wrapChips}>
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <TouchableOpacity
                    key={eq}
                    style={[styles.chip, value === eq && styles.chipActive]}
                    onPress={() => onChange(eq)}
                  >
                    <Text
                      style={{
                        fontSize: FontSize.sm,
                        color: value === eq ? '#000' : Colors.textSecondary,
                        fontFamily: value === eq ? FontFamily.bodyBold : FontFamily.body,
                      }}
                    >
                      {EQUIPMENT_LABELS[eq]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.equipment && (
            <Text color="error" style={styles.errorText}>{errors.equipment.message}</Text>
          )}
          {selectedEquipment === 'other' && (
            <Controller
              control={control}
              name="otherEquipment"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.textInput, { marginTop: Spacing.sm }]}
                  placeholder="Describe the equipment..."
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onChangeText={onChange}
                  maxLength={60}
                />
              )}
            />
          )}
        </SectionCard>

        {/* ── Difficulty ── */}
        <SectionCard>
          <FieldLabel label="Difficulty" required />
          <Controller
            control={control}
            name="difficulty"
            render={({ field: { onChange, value } }) => (
              <View style={styles.segmentRow}>
                {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.segment,
                      value === d && {
                        backgroundColor:
                          d === 'beginner'
                            ? Colors.success
                            : d === 'intermediate'
                            ? Colors.info
                            : Colors.error,
                      },
                    ]}
                    onPress={() => onChange(d)}
                  >
                    <Text
                      style={{
                        fontSize: FontSize.sm,
                        color: value === d ? '#fff' : Colors.textSecondary,
                        fontFamily: value === d ? FontFamily.bodyBold : FontFamily.body,
                        textTransform: 'capitalize',
                      }}
                    >
                      {d === 'beginner' ? '🟢' : d === 'intermediate' ? '🟡' : '🔴'} {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </SectionCard>

        {/* ── Image (URL + picker) ── */}
        <ImagePickerSection
          imageUrl={imageUrl}
          imageIsLocal={imageIsLocal}
          onUrlChange={(url, isLocal) => {
            setImageUrl(url);
            setImageIsLocal(isLocal);
            setImageError('');
          }}
          error={imageError}
        />

        {/* ── GIF URL ── */}
        <SectionCard>
          <FieldLabel label="Animated GIF URL" hint="Optional — shows during workout" />
          <Controller
            control={control}
            name="gifUrl"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.textInput}
                placeholder="https://...gif"
                placeholderTextColor={Colors.textMuted}
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            )}
          />
        </SectionCard>

        {/* ── Description ── */}
        <SectionCard>
          <FieldLabel label="Description" hint="What this exercise targets and how it benefits you" />
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.textInput, styles.multiline]}
                placeholder="Describe the exercise..."
                placeholderTextColor={Colors.textMuted}
                value={value}
                onChangeText={onChange}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
            )}
          />
          {errors.description && (
            <Text color="error" style={styles.errorText}>{errors.description.message}</Text>
          )}
        </SectionCard>

        {/* ── Instructions ── */}
        <SectionCard>
          <FieldLabel
            label="Step-by-Step Instructions"
            hint="Each step on its own line"
          />
          {instructionFields.map((field, i) => (
            <View key={field.id} style={styles.instructionRow}>
              <View style={styles.stepBadge}>
                <Text color="accent" style={{ fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs }}>
                  {i + 1}
                </Text>
              </View>
              <Controller
                control={control}
                name={`instructions.${i}.value`}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                    placeholder={`Step ${i + 1}...`}
                    placeholderTextColor={Colors.textMuted}
                    value={value}
                    onChangeText={onChange}
                    returnKeyType="next"
                  />
                )}
              />
              {instructionFields.length > 1 && (
                <TouchableOpacity
                  onPress={() => remove(i)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            style={styles.addStepBtn}
            onPress={() => append({ value: '' })}
          >
            <Ionicons name="add" size={16} color={Colors.accent} />
            <Text color="accent" style={{ fontSize: FontSize.sm }}>Add Step</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ── Personal Notes / Tips ── */}
        <SectionCard>
          <FieldLabel
            label="Personal Notes & Tips"
            hint="Your own coaching cues, reminders, or modifications"
          />
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.textInput, styles.multiline, { minHeight: 80 }]}
                placeholder="e.g. Focus on slow eccentric, keep core braced..."
                placeholderTextColor={Colors.textMuted}
                value={value}
                onChangeText={onChange}
                multiline
                maxLength={400}
                textAlignVertical="top"
              />
            )}
          />
          {errors.notes && (
            <Text color="error" style={styles.errorText}>{errors.notes.message}</Text>
          )}
        </SectionCard>

        {/* ── Live Preview Card ── */}
        {watchedName?.trim() ? (
          <LivePreviewCard
            name={watchedName}
            muscleGroup={watchedMuscle}
            equipment={watchedEquipment}
            difficulty={watchedDifficulty}
            imageUrl={imageUrl}
          />
        ) : null}

        {/* AI Suggestion hint */}
        <View style={styles.aiHint}>
          <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
          <Text color="muted" style={{ fontSize: FontSize.xs, flex: 1, marginLeft: Spacing.sm, lineHeight: 16 }}>
            <Text style={{ color: Colors.warning, fontFamily: FontFamily.bodyBold }}>Tip: </Text>
            Need inspiration? Popular custom exercises include Bulgarian Split Squat, Landmine Press, Tempo Push-Ups, and Pallof Press.
          </Text>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <Button
            title={existing ? 'Update Exercise' : 'Save Exercise'}
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSubmit(onSubmit)}
            loading={isSaving}
          />
          {!existing && (
            <Button
              title="Save as Draft"
              variant="outline"
              size="md"
              fullWidth
              style={{ marginTop: Spacing.sm }}
              onPress={() => {
                saveCustomExerciseDraft({
                  name: watchedName,
                  muscleGroup: watchedMuscle,
                  equipment: watchedEquipment,
                  difficulty: watchedDifficulty,
                  savedAt: new Date().toISOString(),
                });
                Alert.alert('Draft Saved', 'Your progress has been saved. You can continue later.');
              }}
            />
          )}
          <Button
            title="Cancel"
            variant="ghost"
            size="lg"
            fullWidth
            onPress={handleCancel}
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing['5xl'] },

  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.warning + '44',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },

  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionCardGlow: {
    borderColor: Colors.accentGlow,
    ...Shadow.accentGlow,
  },

  fieldLabel: { fontSize: FontSize.sm, letterSpacing: 0.3 },
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
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
    marginBottom: 0,
  },

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
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipActiveSecondary: {
    backgroundColor: Colors.accentGlow2,
    borderColor: Colors.accent,
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

  // Image picker
  imagePickRow: { gap: Spacing.md },
  imagePickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accentGlow2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: Spacing.md,
  },
  imagePickOrDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  imagePickDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  urlInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  urlInput: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },
  applyBtn: {
    backgroundColor: Colors.bgCard2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  applyBtnText: {
    color: Colors.accent,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
  },
  imagePlaceholder: {
    height: 120,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  imagePreviewWrap: {
    marginTop: Spacing.md,
    position: 'relative',
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  removeImgBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },

  // Instructions
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
    alignSelf: 'flex-start',
  },

  // AI hint
  aiHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '10',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },

  // Preview card
  previewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.accentGlow,
  },
  previewInner: { gap: Spacing.md },
  previewNoImg: {
    height: 120,
    backgroundColor: Colors.bgCard2,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMeta: { gap: 4 },
  previewBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  previewDiffBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  customBadgePreview: {
    backgroundColor: Colors.accentGlow2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },

  actions: { marginTop: Spacing.md },
});
