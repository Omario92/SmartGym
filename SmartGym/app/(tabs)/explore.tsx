/**
 * Explore Tab — v2.0
 * Global exercise search, My Exercises quick-access, discover workouts.
 */

import React, { useState, useRef } from 'react';
import {
  View, Image, ScrollView, StyleSheet, TouchableOpacity, Pressable,
  Dimensions, Alert, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { Colors, Spacing, Radius, FontSize, FontFamily, Shadow, Gradients, withAlpha } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { FadeInView } from '@/components/ui/FadeInView';
import { PreviewContextMenu } from '@/components/ui/PreviewContextMenu';
import { GlowOrb } from '@/components/ui/GlowOrb';
import { TAB_BAR_HEIGHT } from './_layout';
import { AI_COACH_SVG } from '@/components/ui/designIcons';
import { muscleIcons } from '@/lib/muscleIcons';
import { GlobalExerciseSearch } from '@/components/exercise/GlobalExerciseSearch';
import { ExerciseImage } from '@/components/exercise/ExerciseImage';
import { AIGeneratorModal } from '@/components/ai/AIGeneratorModal';
import { useStore, selectCustomExercises } from '@/store';
import type { Routine, RoutineExercise } from '@/store';

import { routineRepository } from '@/lib/repositories/routineRepository';
import { exerciseRepository } from '@/lib/repositories/exerciseRepository';
import type { Exercise } from '@/types/exercise';
import { useFocusEffect } from 'expo-router';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Toast ────────────────────────────────────────────────────────────────────

const useToast = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = useState('');
  const show = (msg: string) => {
    setMessage(msg);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };
  const ToastComponent = () => (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={{ color: '#000', fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm }}>{message}</Text>
    </Animated.View>
  );
  return { show, ToastComponent };
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURED_PROGRAMS = [
  {
    id: '7min',
    title: '7 Minute Workout',
    subtitle: 'Quick & effective',
    duration: '7',
    level: 'Beginner',
    exercises: 12,
    calories: 120,
    color: '#00FF9D',
    emoji: '⚡',
    description: 'The scientifically proven 7-minute high-intensity circuit training workout.',
  },
  {
    id: 'fullbody',
    title: 'Full Body Blast',
    subtitle: 'Compound movements',
    duration: '45',
    level: 'Intermediate',
    exercises: 8,
    calories: 380,
    color: '#4DA6FF',
    emoji: '💪',
    description: 'Target every major muscle group with compound movements for maximum results.',
  },
  {
    id: 'hiit',
    title: 'HIIT Cardio',
    subtitle: 'Fat burning protocol',
    duration: '30',
    level: 'Advanced',
    exercises: 10,
    calories: 450,
    color: '#FF6B6B',
    emoji: '🔥',
    description: 'High-intensity interval training for maximum fat burn and cardiovascular fitness.',
  },
  {
    id: 'strength',
    title: 'Strength Builder',
    subtitle: 'Progressive overload',
    duration: '60',
    level: 'Intermediate',
    exercises: 6,
    calories: 290,
    color: '#FFB547',
    emoji: '🏋️',
    description: 'Build raw strength with powerlifting-inspired progressive overload programming.',
  },
];

/** Exercise templates for each featured program */
const PROGRAM_EXERCISES: Record<string, RoutineExercise[]> = {
  '7min': [
    { exerciseId: 'jumping_jacks', exerciseName: 'Jumping Jacks', sets: 1, reps: 30 },
    { exerciseId: 'push_ups', exerciseName: 'Push-Ups', sets: 1, reps: 15 },
    { exerciseId: 'squat', exerciseName: 'Squats', sets: 1, reps: 20 },
    { exerciseId: 'crunches', exerciseName: 'Crunches', sets: 1, reps: 20 },
    { exerciseId: 'mountain_climbers', exerciseName: 'Mountain Climbers', sets: 1, reps: 30 },
    { exerciseId: 'plank', exerciseName: 'Plank (30s)', sets: 1, reps: 1 },
    { exerciseId: 'lunges', exerciseName: 'Lunges', sets: 1, reps: 12 },
    { exerciseId: 'burpees', exerciseName: 'Burpees', sets: 1, reps: 10 },
    { exerciseId: 'push_ups', exerciseName: 'Push-Ups (wide)', sets: 1, reps: 12 },
    { exerciseId: 'leg_raises', exerciseName: 'Leg Raises', sets: 1, reps: 15 },
    { exerciseId: 'mountain_climbers', exerciseName: 'Mountain Climbers (fast)', sets: 1, reps: 20 },
    { exerciseId: 'jumping_jacks', exerciseName: 'Jumping Jacks (cooldown)', sets: 1, reps: 20 },
  ],
  'fullbody': [
    { exerciseId: 'squat', exerciseName: 'Back Squat', sets: 4, reps: 8, weight: 60 },
    { exerciseId: 'deadlift', exerciseName: 'Deadlift', sets: 3, reps: 6, weight: 80 },
    { exerciseId: 'bench_press', exerciseName: 'Bench Press', sets: 4, reps: 8, weight: 60 },
    { exerciseId: 'barbell_row', exerciseName: 'Barbell Row', sets: 3, reps: 10, weight: 50 },
    { exerciseId: 'overhead_press', exerciseName: 'Overhead Press', sets: 3, reps: 10, weight: 40 },
    { exerciseId: 'pull_ups', exerciseName: 'Pull-Ups', sets: 3, reps: 8 },
    { exerciseId: 'lunges', exerciseName: 'Lunges', sets: 3, reps: 12, weight: 20 },
    { exerciseId: 'plank', exerciseName: 'Plank', sets: 3, reps: 1 },
  ],
  'hiit': [
    { exerciseId: 'burpees', exerciseName: 'Burpees', sets: 4, reps: 15 },
    { exerciseId: 'mountain_climbers', exerciseName: 'Mountain Climbers', sets: 4, reps: 30 },
    { exerciseId: 'jumping_jacks', exerciseName: 'Jumping Jacks', sets: 4, reps: 40 },
    { exerciseId: 'squat', exerciseName: 'Jump Squats', sets: 4, reps: 15 },
    { exerciseId: 'push_ups', exerciseName: 'Explosive Push-Ups', sets: 4, reps: 12 },
    { exerciseId: 'lunges', exerciseName: 'Jump Lunges', sets: 4, reps: 16 },
    { exerciseId: 'leg_raises', exerciseName: 'Leg Raises', sets: 3, reps: 15 },
    { exerciseId: 'crunches', exerciseName: 'Bicycle Crunches', sets: 3, reps: 20 },
    { exerciseId: 'plank', exerciseName: 'Plank', sets: 3, reps: 1 },
    { exerciseId: 'burpees', exerciseName: 'Burpees (finisher)', sets: 2, reps: 10 },
  ],
  'strength': [
    { exerciseId: 'squat', exerciseName: 'Back Squat', sets: 5, reps: 5, weight: 80, restSeconds: 180 },
    { exerciseId: 'deadlift', exerciseName: 'Deadlift', sets: 4, reps: 4, weight: 100, restSeconds: 180 },
    { exerciseId: 'bench_press', exerciseName: 'Bench Press', sets: 5, reps: 5, weight: 70, restSeconds: 150 },
    { exerciseId: 'barbell_row', exerciseName: 'Barbell Row', sets: 4, reps: 6, weight: 60, restSeconds: 120 },
    { exerciseId: 'overhead_press', exerciseName: 'Overhead Press', sets: 4, reps: 6, weight: 45, restSeconds: 120 },
    { exerciseId: 'pull_ups', exerciseName: 'Weighted Pull-Ups', sets: 4, reps: 6 },
  ],
};

const EXERCISE_CATEGORIES = [
  { id: 'chest', label: 'Chest', icon: '💪', count: 12, color: '#FF6B6B' },
  { id: 'back', label: 'Back', icon: '🏋️', count: 15, color: '#4DA6FF' },
  { id: 'legs', label: 'Legs', icon: '🦵', count: 18, color: '#FFB547' },
  { id: 'shoulders', label: 'Shoulders', icon: '🦾', count: 10, color: '#9B59B6' },
  { id: 'arms', label: 'Arms', icon: '💪', count: 14, color: '#00FF9D' },
  { id: 'core', label: 'Core', icon: '🎯', count: 11, color: '#FF8C42' },
  { id: 'cardio', label: 'Cardio', icon: '❤️', count: 8, color: '#FF4D6D' },
  { id: 'glutes', label: 'Glutes', icon: '🍑', count: 9, color: '#FF69B4' },
];

const QUICK_WORKOUTS = [
  { id: 'pushups', name: '100 Push-ups', time: '15 min', level: 'Any', emoji: '💪',
    color: '#00FF9D',
    exercises: [
      { exerciseId: 'push_ups', exerciseName: 'Push-Ups', sets: 5, reps: 20 },
      { exerciseId: 'push_ups', exerciseName: 'Wide Push-Ups', sets: 5, reps: 20 },
    ] as RoutineExercise[] },
  { id: 'abs', name: 'Ab Burner', time: '10 min', level: 'Any', emoji: '🎯',
    color: '#FFB547',
    exercises: [
      { exerciseId: 'crunches', exerciseName: 'Crunches', sets: 3, reps: 20 },
      { exerciseId: 'leg_raises', exerciseName: 'Leg Raises', sets: 3, reps: 15 },
      { exerciseId: 'plank', exerciseName: 'Plank (30s)', sets: 3, reps: 1 },
      { exerciseId: 'bicycle_crunch', exerciseName: 'Bicycle Crunches', sets: 3, reps: 20 },
    ] as RoutineExercise[] },
  { id: 'squat', name: '1000 Squats', time: '20 min', level: 'Intermediate', emoji: '🦵',
    color: '#4DA6FF',
    exercises: [
      { exerciseId: 'squat', exerciseName: 'Air Squats', sets: 10, reps: 50 },
      { exerciseId: 'lunges', exerciseName: 'Lunges', sets: 5, reps: 20 },
      { exerciseId: 'calf_raises', exerciseName: 'Calf Raises', sets: 5, reps: 30 },
    ] as RoutineExercise[] },
  { id: 'yoga', name: 'Morning Stretch', time: '12 min', level: 'Beginner', emoji: '🧘',
    color: '#9B59B6',
    exercises: [
      { exerciseId: 'plank', exerciseName: 'Plank (Hold)', sets: 3, reps: 1 },
      { exerciseId: 'mountain_climbers', exerciseName: 'Mountain Climbers (slow)', sets: 3, reps: 10 },
      { exerciseId: 'lunges', exerciseName: 'Walking Lunges', sets: 2, reps: 10 },
    ] as RoutineExercise[] },
];

// ─── Convert program → Routine ────────────────────────────────────────────────

function programToRoutine(program: typeof FEATURED_PROGRAMS[0]): Routine {
  return {
    id: `program_${program.id}_${Date.now()}`,
    name: program.title,
    description: program.description,
    color: program.color,
    category: program.level.toLowerCase(),
    estimatedDuration: parseInt(program.duration, 10),
    createdAt: new Date().toISOString(),
    exercises: PROGRAM_EXERCISES[program.id] ?? [],
  };
}

function generateSavedId(id: string): string {
  return `saved_${id}_${Date.now()}`;
}

// ─── Program long-press: glow + shared context menu ──────────────────────────

type ProgramLike = Routine | typeof FEATURED_PROGRAMS[0];
const progName = (p: any) => p.title || p.name;
const progDesc = (p: any): string => p.description;
const progDuration = (p: any) => p.duration || p.estimatedDuration;
const progExCount = (p: any) => (Array.isArray(p.exercises) ? p.exercises.length : p.exercises);
const progEmoji = (p: any) => p.emoji || '💪';

/** Wraps a program card with press-in glow + long-press to open the menu. */
const ProgramPressable: React.FC<{
  onPress: () => void;
  onLongPress: () => void;
  style?: any;
  children: React.ReactNode;
}> = ({ onPress, onLongPress, style, children }) => {
  const press = useSharedValue(0);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.02 }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: press.value }));
  return (
    <Reanimated.View style={[scaleStyle, style]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={260}
        onPressIn={() => { press.value = withTiming(1, { duration: 240 }); }}
        onPressOut={() => { press.value = withTiming(0, { duration: 220 }); }}
      >
        {children}
        <Reanimated.View pointerEvents="none" style={[styles.programGlow, glowStyle]} />
      </Pressable>
    </Reanimated.View>
  );
};

const ExploreProgramPreview: React.FC<{ program: ProgramLike }> = ({ program }) => (
  <View style={styles.menuPreviewCard}>
    <View style={styles.previewTitleRow}>
      <Text style={{ fontSize: 24 }}>{progEmoji(program)}</Text>
      <Text variant="h4" style={{ flex: 1 }} numberOfLines={1}>{progName(program)}</Text>
    </View>
    {progDesc(program) ? (
      <Text color="secondary" numberOfLines={2} style={styles.previewDesc}>
        {progDesc(program)}
      </Text>
    ) : null}
    <View style={styles.programStats}>
      <View style={styles.programStat}>
        <Icon name="time-outline" size={14} color={Colors.textMuted} />
        <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 4 }}>{progDuration(program)} min</Text>
      </View>
      <View style={styles.programStat}>
        <Icon name="barbell-outline" size={14} color={Colors.textMuted} />
        <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 4 }}>{progExCount(program)} exercises</Text>
      </View>
    </View>
  </View>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProgramCard: React.FC<{
  program: typeof FEATURED_PROGRAMS[0];
  onStart: () => void;
  onOpenMenu: () => void;
}> = ({ program, onStart, onOpenMenu }) => (
  <ProgramPressable onPress={onOpenMenu} onLongPress={onOpenMenu} style={styles.programCardVertical}>
    <View style={[styles.programCardBg, { borderColor: program.color + '33' }]}>
      <View style={styles.programCardContent}>
        <View style={styles.programCardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Text style={{ fontSize: 24 }}>{program.emoji}</Text>
            <Text variant="h4" style={{ fontWeight: 'bold' }}>{program.title}</Text>
          </View>
          <Badge
            label={program.level}
            variant={program.level === 'Beginner' ? 'accent' : program.level === 'Intermediate' ? 'info' : 'error'}
          />
        </View>

        <Text color="secondary" style={{ fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20 }}>
          {program.description}
        </Text>

        <View style={styles.programStats}>
          <View style={styles.programStat}>
            <Icon name="time-outline" size={14} color={Colors.textMuted} />
            <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 4 }}>{program.duration} min</Text>
          </View>
          <View style={styles.programStat}>
            <Icon name="barbell-outline" size={14} color={Colors.textMuted} />
            <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 4 }}>{program.exercises} exercises</Text>
          </View>
          <View style={styles.programStat}>
            <Icon name="flame-outline" size={14} color={Colors.textMuted} />
            <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 4 }}>~{program.calories} kcal</Text>
          </View>
        </View>

        <View style={styles.programActions}>
          <TouchableOpacity
            style={[styles.programStartBtn, { backgroundColor: program.color, flex: 1 }]}
            onPress={onStart} activeOpacity={0.8}>
            <Text style={{ color: Colors.textOnAccent, fontFamily: FontFamily.bodyBold, fontSize: FontSize.md }}>
              Start
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </ProgramPressable>
);

const CategoryChip: React.FC<{
  cat: typeof EXERCISE_CATEGORIES[0];
  onPress: () => void;
}> = ({ cat, onPress }) => {
  const muscleImg = (muscleIcons as Record<string, any>)[cat.id];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.muscleCard, { borderColor: withAlpha(cat.color, 0.45) }]}
    >
      <View style={[styles.muscleCardTint, { backgroundColor: withAlpha(cat.color, 0.1) }]} />
      {muscleImg ? (
        <Image source={muscleImg} style={styles.muscleCardImg} resizeMode="contain" />
      ) : (
        <Text style={styles.muscleCardEmoji}>{cat.icon}</Text>
      )}
      <Text style={styles.muscleCardLabel}>{cat.label}</Text>
      {cat.count > 0 ? (
        <Text style={styles.muscleCardCount}>{cat.count}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const addRoutine = useStore((s) => s.addRoutine);
  const startWorkout = useStore((s) => s.startWorkout);
  const customExercises = useStore(selectCustomExercises);
  const hapticsEnabled = useStore((s) => s.settings.hapticFeedback);
  const { show: showToast, ToastComponent } = useToast();

  const [menuProgram, setMenuProgram] = useState<ProgramLike | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [dynamicPrograms, setDynamicPrograms] = useState<Routine[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routines, exercises] = await Promise.all([
        routineRepository.getExploreRoutines(),
        exerciseRepository.getAll(),
      ]);
      
      if (routines.length > 0) setDynamicPrograms(routines);
      if (exercises.length > 0) setAllExercises(exercises);
    } catch (err) {
      console.error('Failed to load explore data:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const categoriesWithCount = React.useMemo(() => {
    const combined = [...allExercises, ...customExercises];
    return EXERCISE_CATEGORIES.map(cat => ({
      ...cat,
      count: combined.filter(e => e.muscleGroup === cat.id).length
    }));
  }, [allExercises, customExercises]);

  const handleSaveToRoutines = (program: any) => {
    // Check if it's a dynamic routine (Routine type) or a hardcoded program
    const routine = Array.isArray((program as any).exercises)
      ? (program as Routine)
      : programToRoutine(program as typeof FEATURED_PROGRAMS[0]);
    
    addRoutine({
      ...routine,
      id: generateSavedId(routine.id), // Ensure unique ID for saved copy
    });
    showToast(`✅ "${routine.name}" saved to Routines!`);
  };

  const startProgramNow = (program: ProgramLike) => {
    const routine = Array.isArray((program as any).exercises)
      ? (program as Routine)
      : programToRoutine(program as typeof FEATURED_PROGRAMS[0]);
    startWorkout(routine);
    router.push('/workout/active');
  };

  const openProgramMenu = (program: ProgramLike) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setMenuProgram(program);
  };

  const handleStartQuickWorkout = (w: typeof QUICK_WORKOUTS[0]) => {
    Alert.alert(
      w.emoji + ' ' + w.name,
      `Duration: ${w.time}  •  Level: ${w.level}\n\nReady to start this quick workout?`,
      [
        {
          text: 'Start Now 🚀',
          onPress: () => {
            startWorkout({
              id: `quick_${w.id}_${Date.now()}`,
              name: w.name,
              description: `Quick ${w.time} workout`,
              color: w.color,
              exercises: w.exercises,
              createdAt: new Date().toISOString(),
              estimatedDuration: parseInt(w.time),
            } as Routine);
            router.push('/workout/active');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Global search modal */}
      <GlobalExerciseSearch
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />

      {/* AI Generator Modal */}
      <AIGeneratorModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        onSaved={(name) => {
          setAiModalVisible(false);
          showToast(`✅ "${name}" saved to Routines!`);
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="h2" style={{ fontSize: 28 }}>Explore</Text>
          <Text color="secondary" style={{ marginTop: 2, fontSize: FontSize.sm }}>
            Discover. Train. Transform.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + Spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Smart Trainer */}
        <View style={styles.aiCard}>
          <LinearGradient
            colors={Gradients.aiExplore}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <GlowOrb
            size={240}
            color="rgba(0,209,255,0.30)"
            opacity={0.38}
            falloff={0.85}
            style={{ top: -90, right: -60 }}
          />
          <View style={styles.aiCardInner}>
            <View style={{ flex: 1 }}>
              <View style={styles.aiHeader}>
                <Text variant="h4" style={{ fontWeight: 'bold', fontSize: 20 }}>Smart Trainer AI</Text>
                <Badge label="PRO" variant="premium" style={{ marginLeft: Spacing.sm }} />
              </View>
              <Text color="secondary" style={styles.aiSubtext}>
                Get a personalized plan built around YOU.
              </Text>

              <View style={styles.aiList}>
                <Text color="secondary" style={styles.aiListItem}>• Your goals</Text>
                <Text color="secondary" style={styles.aiListItem}>• Your fitness level</Text>
                <Text color="secondary" style={styles.aiListItem}>• Your time & equipment</Text>
              </View>

              <Pressable style={styles.aiGenerateBtn} onPress={() => setAiModalVisible(true)}>
                <LinearGradient
                  colors={Gradients.aiButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.aiGenerateBtnText}>Generate My Plan</Text>
                <Icon name="arrow-forward" size={15} color={Colors.textPrimary} />
              </Pressable>
            </View>
            <View style={styles.aiIconWrapLarge}>
              <SvgXml xml={AI_COACH_SVG} width={56} height={56} />
            </View>
          </View>
        </View>

        {/* Global Exercise Search Bar */}
        <TouchableOpacity
          style={styles.globalSearchBar}
          onPress={() => setSearchVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="search" size={18} color={Colors.iconInactive} />
          <Text style={{ flex: 1, fontSize: FontSize.md, color: Colors.iconInactive }}>
            Search exercises, programs...
          </Text>
          <Icon name="options-outline" size={18} color={Colors.iconInactive} />
        </TouchableOpacity>

        {/* My Custom Exercises section */}
        {customExercises.length > 0 && (
          <View>
            <SectionHeader
              title="My Custom Exercises"
              action={{
                label: '+ Create new',
                onPress: () => router.push('/routine/add-custom-exercise'),
              }}
              style={styles.sectionHeader}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {customExercises.slice(0, 8).map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.customExCard}
                  activeOpacity={0.85}
                  onPress={() => setSearchVisible(true)}
                >
                  <ExerciseImage uri={ex.image} width={120} height={80} borderRadius={Radius.md} />
                  <View style={styles.customExInfo}>
                    <Text semibold style={{ fontSize: FontSize.sm }} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text color="muted" style={{ fontSize: FontSize.xs, textTransform: 'capitalize' }}>
                      {ex.muscleGroup.replace(/_/g, ' ')}
                    </Text>
                    <View style={styles.customExBadge}>
                      <Text style={{ color: Colors.accent, fontSize: 10, fontFamily: FontFamily.bodyBold }}>✨ Custom</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {customExercises.length > 8 && (
                <TouchableOpacity
                  style={styles.customExMore}
                  onPress={() => setSearchVisible(true)}
                >
                  <Text color="accent" style={{ fontFamily: FontFamily.bodyBold }}>
                    +{customExercises.length - 8} more
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.customExCreate}
                onPress={() => router.push('/routine/add-custom-exercise')}
              >
                <Icon name="add-circle" size={28} color={Colors.accent} />
                <Text color="accent" style={{ fontSize: FontSize.xs, marginTop: 4, textAlign: 'center' }}>
                  Create
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Create custom exercise CTA (when none exist) */}
        {customExercises.length === 0 && (
          <TouchableOpacity
            style={styles.createCustomCta}
            onPress={() => router.push('/routine/add-custom-exercise')}
            activeOpacity={0.85}
          >
            <View style={styles.createCustomLeft}>
              <Text style={{ fontSize: 32 }}>🏗️</Text>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text semibold style={{ fontSize: FontSize.md }}>
                  Create Your First Exercise
                </Text>
                <Text color="secondary" style={{ fontSize: FontSize.sm, marginTop: 2 }}>
                  Build custom exercises with images, instructions, and personal notes.
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={Colors.accent} />
          </TouchableOpacity>
        )}

        {/* Featured Programs */}
        <SectionHeader
          title="Featured Programs"
          action={{ label: 'See all', onPress: () => router.push('/workout/all-exercises') }}
          style={styles.sectionHeader}
        />

        <View style={styles.verticalListContainer}>
          {loading && dynamicPrograms.length === 0 ? (
            <LoadingState label="Loading programs…" minHeight={180} />
          ) : dynamicPrograms.length > 0 ? (
            dynamicPrograms.map((p, i) => (
              <FadeInView key={p.id} delay={Math.min(i, 6) * 60}>
              <ProgramPressable
                onPress={() => openProgramMenu(p)}
                onLongPress={() => openProgramMenu(p)}
                style={styles.programCardVertical}
              >
                <View style={[styles.programCardBg, { borderColor: (p.color || Colors.accent) + '33' }]}>
                  <View style={styles.programCardContent}>
                    <View style={styles.programCardHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                        <Text style={{ fontSize: 24 }}>💪</Text>
                        <Text variant="h4" style={{ fontWeight: 'bold' }}>{p.name}</Text>
                      </View>
                      <Badge
                        label={p.category || 'Intermediate'}
                        variant={p.category === 'beginner' ? 'accent' : p.category === 'intermediate' ? 'info' : 'error'}
                      />
                    </View>
                    <Text color="secondary" numberOfLines={2} style={{ fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20 }}>
                      {p.description}
                    </Text>
                    <View style={styles.programStats}>
                      <View style={styles.programStat}>
                        <Icon name="time-outline" size={14} color={Colors.textMuted} />
                        <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 4 }}>{p.estimatedDuration} min</Text>
                      </View>
                      <View style={styles.programStat}>
                        <Icon name="barbell-outline" size={14} color={Colors.textMuted} />
                        <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 4 }}>{p.exercises.length} exercises</Text>
                      </View>
                    </View>
                    <View style={styles.programActions}>
                      <TouchableOpacity
                        style={[styles.programStartBtn, { backgroundColor: p.color || Colors.accent, flex: 1 }]}
                        onPress={() => startProgramNow(p)} activeOpacity={0.8}>
                        <Text style={{ color: Colors.textOnAccent, fontFamily: FontFamily.bodyBold, fontSize: FontSize.md }}>
                          Start
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ProgramPressable>
              </FadeInView>
            ))
          ) : (
            FEATURED_PROGRAMS.map((p, i) => (
              <FadeInView key={p.id} delay={Math.min(i, 6) * 60}>
                <ProgramCard
                  program={p}
                  onStart={() => startProgramNow(p)}
                  onOpenMenu={() => openProgramMenu(p)}
                />
              </FadeInView>
            ))
          )}
        </View>

        {/* Quick Workouts */}
        <SectionHeader title="Quick Workouts" style={styles.sectionHeader} />
        <View style={styles.quickWorkoutsGrid}>
          {QUICK_WORKOUTS.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.quickCard}
              activeOpacity={0.85}
              onPress={() => handleStartQuickWorkout(w)}
            >
              <Text style={{ fontSize: 28, marginBottom: Spacing.xs }}>{w.emoji}</Text>
              <Text semibold style={{ fontSize: FontSize.sm }}>{w.name}</Text>
              <Text color="muted" style={{ fontSize: FontSize.xs }}>{w.time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browse by Muscle */}
        <SectionHeader
          title="Browse by Muscle"
          action={{ label: 'All exercises', onPress: () => router.push('/workout/all-exercises') }}
          style={styles.sectionHeader}
        />
        <View style={styles.categoriesGrid}>
          {categoriesWithCount.map((cat, i) => (
            <FadeInView key={cat.id} delay={Math.min(i, 8) * 40} distance={8}>
              <CategoryChip
                cat={cat}
                onPress={() => router.push({ pathname: '/workout/all-exercises', params: { muscle: cat.id } })}
              />
            </FadeInView>
          ))}
        </View>

      </ScrollView>

      {/* Program long-press context menu */}
      <PreviewContextMenu
        visible={!!menuProgram}
        haptics={hapticsEnabled}
        onClose={() => setMenuProgram(null)}
        preview={menuProgram ? <ExploreProgramPreview program={menuProgram} /> : null}
        actions={
          menuProgram
            ? [
                { icon: 'play', label: 'Start Now', onPress: () => startProgramNow(menuProgram) },
                {
                  icon: 'bookmark-outline',
                  label: 'Save to Routines',
                  onPress: () => handleSaveToRoutines(menuProgram),
                },
              ]
            : []
        }
      />

      {/* Toast */}
      <ToastComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  searchBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing['6xl'] },
  aiCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderViolet,
    shadowColor: Colors.iconCinematicViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  aiCardInner: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  aiSubtext: { fontSize: FontSize.md, lineHeight: 22, marginBottom: Spacing.sm, color: Colors.textCoach },
  aiList: { marginTop: Spacing.xs },
  aiListItem: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: 2, color: Colors.textCoach },
  aiGenerateBtn: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  aiGenerateBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textPrimary,
  },
  aiIconWrapLarge: {
    marginLeft: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, marginTop: Spacing.md,
  },
  horizontalScroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  verticalListContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  programCardVertical: { width: '100%', marginBottom: Spacing.md },
  programCardBg: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderCurve: 'continuous',
    borderWidth: 1, overflow: 'hidden', ...Shadow.card,
  },
  programGlow: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.lg,
    // Simple brightness tint (like a button press), not an accent glow.
    backgroundColor: Colors.glassBgStrong,
  },
  menuPreviewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  previewDesc: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  programCardHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  programCardContent: { padding: Spacing.xl },
  programStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg, marginBottom: Spacing.lg },
  programStat: { flexDirection: 'row', alignItems: 'center' },
  programActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  programStartBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
  },
  saveBtn: {
    width: 50, height: 50, borderRadius: Radius.md,
    backgroundColor: Colors.bgCard2, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnActive: {
    borderColor: Colors.accent, backgroundColor: Colors.accentGlow2,
  },
  quickWorkoutsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.xl,
  },
  quickCard: {
    flex: 1, minWidth: (SCREEN_W - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg, gap: Spacing.sm + 2, marginBottom: Spacing.xl,
  },
  muscleCard: {
    width: (SCREEN_W - Spacing.lg * 2 - (Spacing.sm + 2) * 2) / 3,
    height: 150,
    borderRadius: Radius.md + 2,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    ...Shadow.soft,
  },
  muscleCardTint: {
    ...StyleSheet.absoluteFill,
  },
  muscleCardImg: { width: 69, height: 69, flex: 1 },
  muscleCardEmoji: { fontSize: 40, flex: 1, textAlignVertical: 'center' },
  muscleCardLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textPrimary,
  },
  muscleCardCount: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.body,
    color: Colors.textMuted,
  },
  searchBtnGlow: {
    borderColor: Colors.accentGlow,
    backgroundColor: Colors.accentGlow2,
  },
  globalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.iconPanel,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.sm,
  },
  globalSearchBadge: {
    backgroundColor: Colors.accentGlow2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  customExCard: {
    width: 130,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.md,
    ...Shadow.card,
  },
  customExInfo: { padding: Spacing.sm },
  customExBadge: {
    backgroundColor: Colors.accentGlow2,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  customExMore: {
    width: 80,
    height: 130,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  customExCreate: {
    width: 80,
    height: 130,
    backgroundColor: Colors.accentGlow2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  createCustomCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  createCustomLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toast: {
    position: 'absolute', bottom: 30, alignSelf: 'center',
    backgroundColor: Colors.accent, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderRadius: Radius.full, ...Shadow.accentGlow,
  },
});
