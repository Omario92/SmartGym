/**
 * AI Generator Modal — All-in-one AI Routine Generator
 * Steps: gate (non-premium) → key setup → profile setup → generating → preview → error
 * Handles the full flow from empty state to saved routine.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontFamily, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/store';
import type { Routine, RoutineExercise } from '@/store';
import { buildAIContext, isAIProfileComplete, DEFAULT_AI_PROFILE } from '@/services/ai/aiUtils';
import { generateRoutine, validateGeminiKey } from '@/services/ai/aiService';
import { getDisplayWeight, getInputWeightInKg } from '@/lib/unit';
import type {
  AIUserProfile,
  AIGoal,
  AIExperienceLevel,
  AISplit,
  AIEquipment,
  AIGeneratedRoutine,
  AIServiceError,
} from '@/services/ai/types';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Step types ───────────────────────────────────────────────────────────────

type ModalStep = 'gate' | 'key' | 'profile' | 'confirm' | 'generating' | 'preview' | 'error';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AIGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (routineName: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_OPTIONS: Array<{ value: AIGoal; label: string; emoji: string }> = [
  { value: 'muscle_gain', label: 'Muscle Gain', emoji: '💪' },
  { value: 'fat_loss', label: 'Fat Loss', emoji: '🔥' },
  { value: 'strength', label: 'Strength', emoji: '🏋️' },
  { value: 'endurance', label: 'Endurance', emoji: '🏃' },
  { value: 'flexibility', label: 'Flexibility', emoji: '🧘' },
  { value: 'maintenance', label: 'Maintenance', emoji: '⚖️' },
];

const EQUIPMENT_OPTIONS: Array<{ value: AIEquipment; label: string }> = [
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'dumbbell', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'machine', label: 'Machines' },
  { value: 'cable', label: 'Cables' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance_band', label: 'Bands' },
  { value: 'full_gym', label: 'Full Gym' },
];

const SPLIT_OPTIONS: Array<{ value: AISplit; label: string; desc: string }> = [
  { value: 'full_body', label: 'Full Body', desc: '3× / week' },
  { value: 'upper_lower', label: 'Upper/Lower', desc: '4× / week' },
  { value: 'ppl', label: 'Push/Pull/Legs', desc: '6× / week' },
  { value: 'bro_split', label: 'Bro Split', desc: '5× / week' },
  { value: 'custom', label: 'Custom', desc: 'AI decides' },
];

const LOADING_STEPS = [
  'Analyzing your fitness profile...',
  'Building personalized context...',
  'Designing your perfect routine...',
  'Optimizing exercise selection...',
  'Finalizing your plan...',
];

// ─── Pulsing neon ring animation ──────────────────────────────────────────────

const PulsingRing: React.FC = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 900 }),
        withTiming(0.6, { duration: 900 })
      ),
      -1,
      false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconScale = useSharedValue(0);
  useEffect(() => {
    iconScale.value = withSpring(1, { damping: 12 });
  }, []);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

  return (
    <View style={styles.loadingRingWrap}>
      <Animated.View style={[styles.pulseRing, ringStyle]} />
      <Animated.View style={[styles.loadingIconCircle, iconStyle]}>
        <Text style={{ fontSize: 36 }}>✦</Text>
      </Animated.View>
    </View>
  );
};

// ─── Chip selector ────────────────────────────────────────────────────────────

const Chip: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
  emoji?: string;
}> = ({ label, selected, onPress, emoji }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    {emoji && <Text style={{ fontSize: 14, marginRight: 4 }}>{emoji}</Text>}
    <Text
      style={[
        styles.chipText,
        { color: selected ? '#000' : Colors.textSecondary },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Step: Premium Gate ───────────────────────────────────────────────────────

const GateScreen: React.FC<{ onUpgrade: () => void; onClose: () => void }> = ({
  onUpgrade,
  onClose,
}) => (
  <View style={styles.centerScreen}>
    <View style={styles.gateIconWrap}>
      <Text style={{ fontSize: 56 }}>👑</Text>
    </View>
    <Text variant="h3" center style={{ marginBottom: Spacing.sm }}>
      Pro Feature
    </Text>
    <Text color="secondary" center style={styles.gateSubtext}>
      AI Smart Trainer is exclusively available to SmartGym Pro members. Upgrade to unlock personalized AI-generated workout plans.
    </Text>
    <View style={styles.gateFeatureList}>
      {[
        '🤖 AI Routine Generator',
        '📊 Progress Analysis',
        '🗓 Smart Weekly Planner',
        '✨ Exercise Auto-Fill',
      ].map((f) => (
        <View key={f} style={styles.gateFeatureRow}>
          <Text style={{ fontSize: FontSize.sm, color: Colors.textPrimary }}>{f}</Text>
        </View>
      ))}
    </View>
    <Button
      title="Upgrade to Pro"
      variant="premium"
      size="lg"
      fullWidth
      style={{ marginBottom: Spacing.md }}
      onPress={onUpgrade}
    />
    <Button title="Maybe Later" variant="ghost" size="md" fullWidth onPress={onClose} />
  </View>
);

// ─── Step: API Key Setup ──────────────────────────────────────────────────────

const KeyScreen: React.FC<{
  apiKey: string;
  setApiKey: (k: string) => void;
  loading: boolean;
  onSave: () => void;
  onBack: () => void;
}> = ({ apiKey, setApiKey, loading, onSave, onBack }) => {
  const [show, setShow] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.stepScroll} keyboardShouldPersistTaps="handled">
      <View style={styles.stepIconWrap}>
        <Icon name="key" size={32} color={Colors.accent} />
      </View>
      <Text variant="h3" center style={{ marginBottom: Spacing.sm }}>
        Connect Gemini AI
      </Text>
      <Text color="secondary" center style={styles.stepSubtext}>
        SmartGym uses Google Gemini to generate intelligent workout plans. Your API key is stored only on your device and never sent to our servers.
      </Text>

      <View style={styles.keyInfoCard}>
        <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 }}>
          {'1. Visit '}
          <Text style={{ color: Colors.accent }}>aistudio.google.com</Text>
          {'\n2. Sign in with your Google account\n3. Click "Get API Key" → "Create API Key"\n4. Copy and paste it below'}
        </Text>
      </View>

      <Text color="secondary" style={styles.fieldLabel}>
        Gemini API Key
      </Text>
      <View style={styles.keyInputRow}>
        <TextInput
          style={styles.keyInput}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="AIza..."
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.keyEyeBtn} onPress={() => setShow(!show)}>
          <Icon
            name={show ? 'eye-off' : 'eye'}
            size={18}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <Button
        title={loading ? 'Validating...' : 'Save & Continue'}
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={apiKey.trim().length < 10}
        style={{ marginTop: Spacing.xl }}
        onPress={onSave}
      />
      <Button
        title="Back"
        variant="ghost"
        size="md"
        fullWidth
        style={{ marginTop: Spacing.sm }}
        onPress={onBack}
      />
    </ScrollView>
  );
};

// ─── Step: Profile Setup ──────────────────────────────────────────────────────

const ProfileScreen: React.FC<{
  profile: AIUserProfile;
  setProfile: React.Dispatch<React.SetStateAction<AIUserProfile>>;
  onContinue: () => void;
  onBack: () => void;
}> = ({ profile, setProfile, onContinue, onBack }) => {
  const toggleGoal = (g: AIGoal) =>
    setProfile((p) => ({
      ...p,
      goals: p.goals.includes(g) ? p.goals.filter((x) => x !== g) : [...p.goals, g],
    }));

  const toggleEquipment = (e: AIEquipment) =>
    setProfile((p) => ({
      ...p,
      equipment: p.equipment.includes(e)
        ? p.equipment.filter((x) => x !== e)
        : [...p.equipment, e],
    }));

  const canContinue =
    profile.goals.length > 0 &&
    profile.equipment.length > 0 &&
    !!profile.experienceLevel;

  return (
    <ScrollView contentContainerStyle={styles.stepScroll} keyboardShouldPersistTaps="handled">
      <View style={styles.stepIconWrap}>
        <Text style={{ fontSize: 32 }}>🎯</Text>
      </View>
      <Text variant="h3" center style={{ marginBottom: Spacing.xs }}>
        Your Fitness Profile
      </Text>
      <Text color="secondary" center style={styles.stepSubtext}>
        This helps AI generate the perfect routine for you. You can update it anytime in Settings.
      </Text>

      {/* Goals */}
      <Text style={styles.profileSectionLabel}>Primary Goals (select all that apply)</Text>
      <View style={styles.chipRow}>
        {GOAL_OPTIONS.map((g) => (
          <Chip
            key={g.value}
            label={g.label}
            emoji={g.emoji}
            selected={profile.goals.includes(g.value)}
            onPress={() => toggleGoal(g.value)}
          />
        ))}
      </View>

      {/* Experience */}
      <Text style={styles.profileSectionLabel}>Experience Level</Text>
      <View style={styles.expRow}>
        {(['beginner', 'intermediate', 'advanced'] as AIExperienceLevel[]).map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.expBtn, profile.experienceLevel === level && styles.expBtnActive]}
            onPress={() => setProfile((p) => ({ ...p, experienceLevel: level }))}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.expBtnText,
                { color: profile.experienceLevel === level ? '#000' : Colors.textSecondary },
              ]}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Days per week */}
      <Text style={styles.profileSectionLabel}>
        Training Days / Week:{' '}
        <Text style={{ color: Colors.accent, fontFamily: FontFamily.bodyBold }}>
          {profile.daysPerWeek}
        </Text>
      </Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => setProfile((p) => ({ ...p, daysPerWeek: Math.max(2, p.daysPerWeek - 1) }))}
        >
          <Icon name="remove" size={20} color={Colors.accent} />
        </TouchableOpacity>
        <View style={styles.stepperValue}>
          <Text variant="h3" color="accent">{profile.daysPerWeek}</Text>
          <Text color="muted" style={{ fontSize: FontSize.xs }}>days</Text>
        </View>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => setProfile((p) => ({ ...p, daysPerWeek: Math.min(7, p.daysPerWeek + 1) }))}
        >
          <Icon name="add" size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Equipment */}
      <Text style={styles.profileSectionLabel}>Available Equipment</Text>
      <View style={styles.chipRow}>
        {EQUIPMENT_OPTIONS.map((e) => (
          <Chip
            key={e.value}
            label={e.label}
            selected={profile.equipment.includes(e.value)}
            onPress={() => toggleEquipment(e.value)}
          />
        ))}
      </View>

      {/* Split */}
      <Text style={styles.profileSectionLabel}>Preferred Training Split</Text>
      <View style={styles.splitGrid}>
        {SPLIT_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.splitCard, profile.preferredSplit === s.value && styles.splitCardActive]}
            onPress={() => setProfile((p) => ({ ...p, preferredSplit: s.value }))}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.splitCardTitle,
                { color: profile.preferredSplit === s.value ? Colors.accent : Colors.textPrimary },
              ]}
            >
              {s.label}
            </Text>
            <Text color="muted" style={{ fontSize: FontSize.xs }}>{s.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Save Profile & Continue"
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canContinue}
        style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}
        onPress={onContinue}
      />
      <Button title="Back" variant="ghost" size="md" fullWidth onPress={onBack} />
    </ScrollView>
  );
};

// ─── Step: Loading ────────────────────────────────────────────────────────────

const LoadingScreen: React.FC<{ stepText: string }> = ({ stepText }) => (
  <View style={styles.centerScreen}>
    <PulsingRing />
    <Text variant="h4" center style={{ marginTop: Spacing.xl, marginBottom: Spacing.sm }}>
      Generating Your Routine
    </Text>
    <Text color="secondary" center style={styles.stepSubtext}>
      {stepText}
    </Text>
    <Text color="muted" style={{ fontSize: FontSize.xs, marginTop: Spacing.xl }}>
      This usually takes 5–15 seconds
    </Text>
  </View>
);

// ─── Step: Preview (generated routine) ───────────────────────────────────────

interface EditableExercise {
  exerciseId: string;
  exerciseName: string;
  sets: string;
  reps: string;
  weight: string;
  restSeconds: string;
  note: string;
}

const PreviewScreen: React.FC<{
  routine: AIGeneratedRoutine;
  onSave: (edited: AIGeneratedRoutine) => void;
  onRegenerate: () => void;
  saving: boolean;
  weightUnit: 'kg' | 'lbs';
}> = ({ routine, onSave, onRegenerate, saving, weightUnit }) => {
  const [name, setName] = useState(routine.name);
  const [description, setDescription] = useState(routine.description);
  const [showReasoning, setShowReasoning] = useState(false);
  const [exercises, setExercises] = useState<EditableExercise[]>(
    routine.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      sets: String(e.sets),
      reps: String(e.reps),
      weight: e.weight != null ? String(getDisplayWeight(e.weight, weightUnit)) : '',
      restSeconds: e.restSeconds != null ? String(e.restSeconds) : '60',
      note: e.note ?? '',
    }))
  );

  const updateExercise = (idx: number, field: keyof EditableExercise, val: string) => {
    setExercises((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const removeExercise = (idx: number) =>
    setExercises((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (name.trim().length < 2) {
      Alert.alert('Name Required', 'Please enter a routine name (at least 2 characters).');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please keep at least one exercise.');
      return;
    }
    const edited: AIGeneratedRoutine = {
      ...routine,
      name: name.trim(),
      description: description.trim(),
      exercises: exercises.map((e) => {
        const inputW = e.weight ? parseFloat(e.weight) || 0 : 0;
        const weightInKg = e.weight ? getInputWeightInKg(inputW, weightUnit) : undefined;
        return {
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          sets: Math.max(1, parseInt(e.sets, 10) || 3),
          reps: Math.max(1, parseInt(e.reps, 10) || 10),
          weight: weightInKg || undefined,
          restSeconds: parseInt(e.restSeconds, 10) || 60,
          note: e.note || undefined,
        };
      }),
    };
    onSave(edited);
  };

  return (
    <ScrollView contentContainerStyle={styles.previewScroll} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={[styles.previewHeader, { borderLeftColor: routine.color }]}>
        <Text variant="h4" style={{ marginBottom: 2 }}>
          AI Generated Routine
        </Text>
        <Badge label="AI Generated" variant="accent" />
      </View>

      {/* Editable name */}
      <Text color="secondary" style={styles.fieldLabel}>Routine Name</Text>
      <TextInput
        style={styles.previewInput}
        value={name}
        onChangeText={setName}
        maxLength={50}
        placeholderTextColor={Colors.textMuted}
      />

      {/* Editable description */}
      <Text color="secondary" style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.previewInput, { minHeight: 60 }]}
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={200}
        placeholderTextColor={Colors.textMuted}
      />

      {/* Reasoning (collapsible) */}
      <TouchableOpacity
        style={styles.reasoningToggle}
        onPress={() => setShowReasoning(!showReasoning)}
      >
        <Text style={{ fontSize: FontSize.sm, color: Colors.accent }}>
          {showReasoning ? '▾' : '▸'} Why this routine?
        </Text>
      </TouchableOpacity>
      {showReasoning && (
        <View style={styles.reasoningCard}>
          <Text color="secondary" style={{ fontSize: FontSize.sm, lineHeight: 20 }}>
            {routine.reasoning}
          </Text>
        </View>
      )}

      {/* Exercises */}
      <Text style={styles.profileSectionLabel}>
        Exercises ({exercises.length})
      </Text>
      {exercises.map((ex, idx) => (
        <View key={`${ex.exerciseId}-${idx}`} style={styles.exerciseCard}>
          <View style={styles.exerciseCardHeader}>
            <Text semibold style={{ flex: 1, fontSize: FontSize.md }}>
              {ex.exerciseName}
            </Text>
            <TouchableOpacity onPress={() => removeExercise(idx)} style={styles.removeBtn}>
              <Icon name="close" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
          <View style={styles.exerciseFields}>
            <View style={styles.exerciseField}>
              <Text color="muted" style={styles.exFieldLabel}>Sets</Text>
              <TextInput
                style={styles.exFieldInput}
                value={ex.sets}
                onChangeText={(v) => updateExercise(idx, 'sets', v)}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.exerciseField}>
              <Text color="muted" style={styles.exFieldLabel}>Reps</Text>
              <TextInput
                style={styles.exFieldInput}
                value={ex.reps}
                onChangeText={(v) => updateExercise(idx, 'reps', v)}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View style={styles.exerciseField}>
              <Text color="muted" style={styles.exFieldLabel}>{weightUnit}</Text>
              <TextInput
                style={styles.exFieldInput}
                value={ex.weight}
                onChangeText={(v) => updateExercise(idx, 'weight', v)}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={Colors.textMuted}
                maxLength={5}
              />
            </View>
            <View style={styles.exerciseField}>
              <Text color="muted" style={styles.exFieldLabel}>Rest (s)</Text>
              <TextInput
                style={styles.exFieldInput}
                value={ex.restSeconds}
                onChangeText={(v) => updateExercise(idx, 'restSeconds', v)}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
        </View>
      ))}

      {/* Footer stats */}
      <View style={styles.previewStats}>
        <View style={styles.previewStat}>
          <Icon name="time-outline" size={14} color={Colors.textMuted} />
          <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 4 }}>
            ~{routine.estimatedDuration} min
          </Text>
        </View>
        <View style={styles.previewStat}>
          <Icon name="barbell-outline" size={14} color={Colors.textMuted} />
          <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 4 }}>
            {exercises.length} exercises
          </Text>
        </View>
      </View>

      {/* Actions */}
      <Button
        title={saving ? 'Saving...' : '✓ Save to Routines'}
        variant="primary"
        size="lg"
        fullWidth
        loading={saving}
        style={{ marginBottom: Spacing.md }}
        onPress={handleSave}
      />
      <Button
        title="↺ Regenerate"
        variant="outline"
        size="md"
        fullWidth
        style={{ marginBottom: Spacing.xxl }}
        onPress={onRegenerate}
      />
    </ScrollView>
  );
};

// ─── Step: Error ──────────────────────────────────────────────────────────────

const ErrorScreen: React.FC<{
  error: AIServiceError;
  onRetry: () => void;
  onClose: () => void;
}> = ({ error, onRetry, onClose }) => (
  <View style={styles.centerScreen}>
    <View style={styles.errorIconWrap}>
      <Icon name="alert-circle" size={48} color={Colors.error} />
    </View>
    <Text variant="h4" center style={{ marginBottom: Spacing.sm }}>
      Generation Failed
    </Text>
    <Text color="secondary" center style={styles.stepSubtext}>
      {error.message}
    </Text>
    {error.code === 'invalid_key' && (
      <Text color="muted" center style={{ fontSize: FontSize.xs, marginTop: Spacing.sm }}>
        Check your EXPO_PUBLIC_OPENROUTER_API_KEY in the .env file.
      </Text>
    )}
    <View style={{ width: '100%', marginTop: Spacing.xl, gap: Spacing.md }}>
      {error.retryable && (
        <Button title="Try Again" variant="primary" size="lg" fullWidth onPress={onRetry} />
      )}
      <Button title="Close" variant="ghost" size="md" fullWidth onPress={onClose} />
    </View>
  </View>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  visible,
  onClose,
  onSaved,
}) => {
  const state = useStore.getState();
  const settings = useStore((s) => s.settings);
  const weightUnit = settings.weightUnit;
  const addRoutine = useStore((s) => s.addRoutine);
  const updateSettings = useStore((s) => s.updateSettings);

  const [step, setStep] = useState<ModalStep>('gate');
  const [apiKey, setApiKey] = useState('');
  const [keyValidating, setKeyValidating] = useState(false);
  const [profile, setProfile] = useState<AIUserProfile>(
    settings.aiProfile ?? DEFAULT_AI_PROFILE
  );
  const [loadingText, setLoadingText] = useState(LOADING_STEPS[0]);
  const [generatedRoutine, setGeneratedRoutine] = useState<AIGeneratedRoutine | null>(null);
  const [error, setError] = useState<AIServiceError | null>(null);
  const [saving, setSaving] = useState(false);

  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine initial step when modal opens
  useEffect(() => {
    if (!visible) return;
    queueMicrotask(() => {
      // Sync local profile state from settings
      setProfile(settings.aiProfile ?? DEFAULT_AI_PROFILE);
      
      // Always prioritize the environment variable over the persisted Zustand state
      const envKey = 
        process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || 
        process.env.EXPO_PUBLIC_GEMINI_API_KEY || 
        '';
      const currentKey = envKey || settings.geminiApiKey || '';
      setApiKey(currentKey);
      setError(null);
      setGeneratedRoutine(null);

      if (!settings.isPremium) {
        setStep('gate');
      } else if (!currentKey) {
        // Only show key step if no env var AND no persisted key
        setStep('key');
      } else if (!isAIProfileComplete(settings.aiProfile)) {
        setStep('profile');
      } else {
        setStep('confirm');
      }
    });
  }, [visible]);

  // Animate loading text
  useEffect(() => {
    if (step !== 'generating') {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
      return;
    }
    let idx = 0;
    queueMicrotask(() => {
      setLoadingText(LOADING_STEPS[0]);
    });
    loadingInterval.current = setInterval(() => {
      idx = (idx + 1) % LOADING_STEPS.length;
      setLoadingText(LOADING_STEPS[idx]);
    }, 2200);
    return () => {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    };
  }, [step]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleUpgrade = () => {
    Alert.alert(
      '👑 SmartGym Pro',
      'Start your 7-day free trial today!\n\n✅ AI Routine Generator\n✅ Smart Weekly Planner\n✅ Exercise Auto-Fill\n✅ Progress Analysis',
      [
        {
          text: 'Start Free Trial',
          onPress: () => {
            updateSettings({ isPremium: true });
            setStep('key');
          },
        },
        { text: 'Maybe Later', style: 'cancel', onPress: onClose },
      ]
    );
  };

  const handleSaveKey = useCallback(async () => {
    const key = apiKey.trim();
    if (key.length < 10) return;

    const isOpenRouter = process.env.EXPO_PUBLIC_AI_PROVIDER === 'openrouter';
    
    if (isOpenRouter) {
      // For OpenRouter, skip Gemini validation and just save the key
      updateSettings({ geminiApiKey: key });
      if (!isAIProfileComplete(settings.aiProfile)) {
        setStep('profile');
      } else {
        setStep('confirm');
      }
      return;
    }

    setKeyValidating(true);
    const valid = await validateGeminiKey(key);
    setKeyValidating(false);
    if (!valid) {
      Alert.alert(
        'Invalid API Key',
        'Could not validate this key with Google Gemini. Please check it and try again.'
      );
      return;
    }
    updateSettings({ geminiApiKey: key });
    if (!isAIProfileComplete(settings.aiProfile)) {
      setStep('profile');
    } else {
      setStep('confirm');
    }
  }, [apiKey, settings.aiProfile]);

  const handleSaveProfile = useCallback(() => {
    updateSettings({ aiProfile: profile });
    setStep('confirm');
  }, [profile]);

  const handleGenerate = useCallback(async () => {
    // Always prefer env var key over persisted store key
    const key = 
      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ||
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      settings.geminiApiKey;
    if (!key) { setStep('key'); return; }

    setStep('generating');
    setError(null);

    try {
      const freshState = useStore.getState();
      const ctx = buildAIContext(freshState);
      const result = await generateRoutine(key, ctx);
      setGeneratedRoutine(result);
      setStep('preview');
    } catch (err) {
      setError(err as AIServiceError);
      setStep('error');
    }
  }, [settings.geminiApiKey]);

  const handleSaveRoutine = useCallback(
    (edited: AIGeneratedRoutine) => {
      setSaving(true);
      const routine: Routine = {
        id: `ai_${Date.now()}`,
        name: edited.name,
        description: edited.description,
        color: edited.color,
        category: edited.category,
        estimatedDuration: edited.estimatedDuration,
        createdAt: new Date().toISOString(),
        exercises: edited.exercises as RoutineExercise[],
      };
      addRoutine(routine);
      setSaving(false);
      onSaved(routine.name);
      onClose();
    },
    [addRoutine, onSaved, onClose]
  );

  // ── Title per step ──────────────────────────────────────────────────────────

  const titleMap: Record<ModalStep, string> = {
    gate: 'AI Smart Trainer',
    key: 'Setup Gemini AI',
    profile: 'Your AI Profile',
    confirm: 'Generate Routine',
    generating: 'AI Working...',
    preview: 'Your AI Routine',
    error: 'Generation Failed',
  };

  const showClose = step !== 'generating';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <View style={styles.aiHeaderIcon}>
              <Text style={{ fontSize: 16 }}>✦</Text>
            </View>
            <Text semibold style={{ fontSize: FontSize.lg }}>
              {titleMap[step]}
            </Text>
          </View>
          {showClose && (
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Step content */}
        {step === 'gate' && (
          <GateScreen onUpgrade={handleUpgrade} onClose={onClose} />
        )}

        {step === 'key' && (
          <KeyScreen
            apiKey={apiKey}
            setApiKey={setApiKey}
            loading={keyValidating}
            onSave={handleSaveKey}
            onBack={onClose}
          />
        )}

        {step === 'profile' && (
          <ProfileScreen
            profile={profile}
            setProfile={setProfile}
            onContinue={handleSaveProfile}
            onBack={() => setStep(settings.geminiApiKey ? 'confirm' : 'key')}
          />
        )}

        {step === 'confirm' && (
          <ScrollView contentContainerStyle={styles.stepScroll}>
            <View style={styles.confirmIconWrap}>
              <Text style={{ fontSize: 48 }}>✦</Text>
            </View>
            <Text variant="h3" center style={{ marginBottom: Spacing.sm }}>
              Ready to Generate
            </Text>
            <Text color="secondary" center style={styles.stepSubtext}>
              AI will create a personalized routine based on your profile and workout history.
            </Text>

            {/* Profile summary */}
            <View style={styles.confirmSummary}>
              {[
                { label: 'Goals', value: (settings.aiProfile?.goals ?? profile.goals).join(', ').replace(/_/g, ' ') },
                { label: 'Level', value: settings.aiProfile?.experienceLevel ?? profile.experienceLevel },
                { label: 'Days/week', value: String(settings.aiProfile?.daysPerWeek ?? profile.daysPerWeek) },
                { label: 'Equipment', value: (settings.aiProfile?.equipment ?? profile.equipment).join(', ') },
                { label: 'Split', value: (settings.aiProfile?.preferredSplit ?? profile.preferredSplit).replace(/_/g, ' ') },
              ].map((row) => (
                <View key={row.label} style={styles.confirmRow}>
                  <Text color="muted" style={{ fontSize: FontSize.sm, width: 80 }}>{row.label}</Text>
                  <Text style={{ fontSize: FontSize.sm, flex: 1, textTransform: 'capitalize' }}>{row.value}</Text>
                </View>
              ))}
            </View>

            <Button
              title="✦ Generate My Routine"
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}
              onPress={handleGenerate}
            />
            <Button
              title="Edit Profile"
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => setStep('profile')}
            />
          </ScrollView>
        )}

        {step === 'generating' && <LoadingScreen stepText={loadingText} />}

        {step === 'preview' && generatedRoutine && (
          <PreviewScreen
            routine={generatedRoutine}
            onSave={handleSaveRoutine}
            onRegenerate={handleGenerate}
            saving={saving}
            weightUnit={weightUnit}
          />
        )}

        {step === 'error' && error && (
          <ErrorScreen
            error={error}
            onRetry={handleGenerate}
            onClose={onClose}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgModal },

  // Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accentGlow,
  },

  // Center screens (gate, loading, error)
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },

  // Step scroll (key, profile, confirm)
  stepScroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing['6xl'],
  },
  stepIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
  },
  stepSubtext: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },

  // Gate screen
  gateIconWrap: { marginBottom: Spacing.xl },
  gateSubtext: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  gateFeatureList: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  gateFeatureRow: {
    paddingVertical: Spacing.xs,
  },

  // API key screen
  keyInfoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  keyInput: {
    flex: 1,
    height: 48,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  keyEyeBtn: { padding: Spacing.sm },

  // Profile screen
  profileSectionLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    fontFamily: FontFamily.bodyBold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyMedium,
  },
  expRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  expBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  expBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  expBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard2,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { flex: 1, alignItems: 'center' },
  splitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  splitCard: {
    width: (SCREEN_W - Spacing.xl * 2 - Spacing.sm * 2) / 3 - 1,
    backgroundColor: Colors.bgCard2,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 2,
  },
  splitCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentGlow2,
  },
  splitCardTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
  },

  // Loading screen
  loadingRingWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  loadingIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },

  // Confirm screen
  confirmIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    marginBottom: Spacing.lg,
    ...Shadow.accentGlow,
  },
  confirmSummary: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Preview screen
  previewScroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing['6xl'],
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    paddingLeft: Spacing.md,
    marginBottom: Spacing.lg,
  },
  previewInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
  },
  reasoningToggle: { marginBottom: Spacing.sm },
  reasoningCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    marginBottom: Spacing.md,
  },
  exerciseCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseFields: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  exerciseField: { flex: 1, alignItems: 'center' },
  exFieldLabel: { fontSize: FontSize.xs, marginBottom: 2 },
  exFieldInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    height: 36,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },
  previewStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginVertical: Spacing.lg,
  },
  previewStat: { flexDirection: 'row', alignItems: 'center' },

  // Error screen
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
});
