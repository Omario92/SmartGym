/**
 * Explore Tab — Discover workouts, AI trainer, exercise library
 * "Save to Routines" properly converts Featured Programs into persisted Routines.
 */

import React, { useState, useRef } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store';
import type { Routine, RoutineExercise } from '@/store';

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
      <Text style={{ color: '#000', fontWeight: FontWeight.semibold, fontSize: FontSize.sm }}>{message}</Text>
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
  { id: 'pushups', name: '100 Push-ups', time: '15 min', level: 'Any', emoji: '💪' },
  { id: 'abs', name: 'Ab Burner', time: '10 min', level: 'Any', emoji: '🎯' },
  { id: 'squat', name: '1000 Squats', time: '20 min', level: 'Intermediate', emoji: '🦵' },
  { id: 'yoga', name: 'Morning Stretch', time: '12 min', level: 'Beginner', emoji: '🧘' },
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProgramCard: React.FC<{
  program: typeof FEATURED_PROGRAMS[0];
  saved: boolean;
  onStart: () => void;
  onSave: () => void;
}> = ({ program, saved, onStart, onSave }) => (
  <TouchableOpacity onPress={onStart} activeOpacity={0.85} style={styles.programCard}>
    <View style={[styles.programCardBg, { borderColor: program.color + '33' }]}>
      {/* Top */}
      <View style={[styles.programCardTop, { backgroundColor: program.color + '15' }]}>
        <Text style={styles.programEmoji}>{program.emoji}</Text>
        <Badge
          label={program.level}
          variant={program.level === 'Beginner' ? 'accent' : program.level === 'Intermediate' ? 'info' : 'error'}
        />
      </View>

      {/* Content */}
      <View style={styles.programCardContent}>
        <Text variant="h4" style={{ marginBottom: 4 }}>{program.title}</Text>
        <Text color="secondary" style={{ fontSize: FontSize.sm, marginBottom: Spacing.md }}>
          {program.description}
        </Text>

        <View style={styles.programStats}>
          <View style={styles.programStat}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 3 }}>{program.duration} min</Text>
          </View>
          <View style={styles.programStat}>
            <Ionicons name="barbell-outline" size={13} color={Colors.textMuted} />
            <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 3 }}>{program.exercises} exercises</Text>
          </View>
          <View style={styles.programStat}>
            <Ionicons name="flame-outline" size={13} color={Colors.textMuted} />
            <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 3 }}>~{program.calories} kcal</Text>
          </View>
        </View>

        <View style={styles.programActions}>
          <TouchableOpacity
            style={[styles.programStartBtn, { backgroundColor: program.color, flex: 1 }]}
            onPress={onStart} activeOpacity={0.8}>
            <Text style={{ color: '#000', fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>
              Start Workout
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnActive]}
            onPress={onSave} activeOpacity={0.8}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? Colors.accent : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const CategoryChip: React.FC<{
  cat: typeof EXERCISE_CATEGORIES[0];
  onPress: () => void;
}> = ({ cat, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.categoryChip} activeOpacity={0.8}>
    <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
      <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
    </View>
    <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.semibold }}>{cat.label}</Text>
    <Text color="muted" style={{ fontSize: FontSize.xs }}>{cat.count} exercises</Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const addRoutine = useStore((s) => s.addRoutine);
  const { show: showToast, ToastComponent } = useToast();

  // Track which program IDs have been saved (session-local; persists via store)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const handleSaveToRoutines = (program: typeof FEATURED_PROGRAMS[0]) => {
    const routine = programToRoutine(program);
    addRoutine(routine);
    setSavedIds((prev) => new Set(prev).add(program.id));
    showToast(`✅ "${program.title}" saved to Routines!`);
  };

  const handleStartProgram = (program: typeof FEATURED_PROGRAMS[0]) => {
    Alert.alert(program.title, `${program.description}\n\nDuration: ${program.duration} min\nCalories: ~${program.calories} kcal`, [
      { text: 'Start Now', onPress: () => {} },
      {
        text: 'Save to Routines',
        onPress: () => handleSaveToRoutines(program),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="h2">Explore</Text>
          <Text color="secondary" style={{ marginTop: 2 }}>Discover workouts & exercises</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* AI Smart Trainer */}
        <Card style={styles.aiCard} glowing>
          <View style={styles.aiCardInner}>
            <View style={styles.aiLeft}>
              <View style={styles.aiIconWrap}>
                <Text style={{ fontSize: 28 }}>🤖</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.aiHeader}>
                  <Text variant="h4">Smart Trainer AI</Text>
                  <Badge label="PRO" variant="premium" style={{ marginLeft: Spacing.sm }} />
                </View>
                <Text color="secondary" style={styles.aiSubtext}>
                  Get a personalized workout plan generated just for you based on your goals and fitness level.
                </Text>
                <Button
                  title="Generate My Plan"
                  variant="primary"
                  size="sm"
                  style={{ marginTop: Spacing.md, alignSelf: 'flex-start' }}
                  onPress={() => Alert.alert('🤖 Smart Trainer AI', 'Upgrade to Pro to unlock AI-powered personalized workout plans!')}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Featured Programs */}
        <View style={styles.sectionHeader}>
          <Text variant="h4">Featured Programs</Text>
          <TouchableOpacity>
            <Text color="accent" style={{ fontSize: FontSize.sm }}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {FEATURED_PROGRAMS.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              saved={savedIds.has(p.id)}
              onStart={() => handleStartProgram(p)}
              onSave={() => handleSaveToRoutines(p)}
            />
          ))}
        </ScrollView>

        {/* Quick Workouts */}
        <View style={styles.sectionHeader}>
          <Text variant="h4">Quick Workouts</Text>
        </View>
        <View style={styles.quickWorkoutsGrid}>
          {QUICK_WORKOUTS.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.quickCard}
              activeOpacity={0.85}
              onPress={() => Alert.alert(w.name, `${w.time} • ${w.level}`)}
            >
              <Text style={{ fontSize: 28, marginBottom: Spacing.xs }}>{w.emoji}</Text>
              <Text semibold style={{ fontSize: FontSize.sm }}>{w.name}</Text>
              <Text color="muted" style={{ fontSize: FontSize.xs }}>{w.time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browse by Muscle */}
        <View style={styles.sectionHeader}>
          <Text variant="h4">Browse by Muscle</Text>
          <TouchableOpacity>
            <Text color="accent" style={{ fontSize: FontSize.sm }}>All exercises</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesGrid}>
          {EXERCISE_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              cat={cat}
              onPress={() => Alert.alert(cat.label, `${cat.count} ${cat.label.toLowerCase()} exercises`)}
            />
          ))}
        </View>

        {/* Personal Trainer upsell */}
        <Card style={styles.trainerCard} premium>
          <View style={styles.trainerInner}>
            <Text style={{ fontSize: 36 }}>👨‍💼</Text>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text variant="h4" style={{ marginBottom: 4 }}>Work with a Trainer</Text>
              <Text color="secondary" style={{ fontSize: FontSize.sm, lineHeight: 18 }}>
                Connect with certified personal trainers for custom programs and coaching.
              </Text>
              <Button
                title="Find a Trainer"
                variant="premium"
                size="sm"
                style={{ marginTop: Spacing.md, alignSelf: 'flex-start' }}
                onPress={() => Alert.alert('Coming Soon', 'Personal Trainer feature launching soon!')}
              />
            </View>
          </View>
        </Card>
      </ScrollView>

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
  aiCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  aiCardInner: { flexDirection: 'row' },
  aiLeft: { flexDirection: 'row', gap: Spacing.md, flex: 1 },
  aiIconWrap: {
    width: 52, height: 52, borderRadius: Radius.md,
    backgroundColor: Colors.accentGlow, alignItems: 'center', justifyContent: 'center',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  aiSubtext: { fontSize: FontSize.sm, lineHeight: 18 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  horizontalScroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  programCard: { width: 270, marginRight: Spacing.md },
  programCardBg: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, overflow: 'hidden', ...Shadow.card,
  },
  programCardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  programEmoji: { fontSize: 36 },
  programCardContent: { padding: Spacing.lg },
  programStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.md },
  programStat: { flexDirection: 'row', alignItems: 'center' },
  programActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  programStartBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, alignItems: 'center',
  },
  saveBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
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
    paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.xl,
  },
  categoryChip: {
    flex: 1, minWidth: (SCREEN_W - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', gap: Spacing.xs,
  },
  categoryIcon: {
    width: 48, height: 48, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  trainerCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  trainerInner: { flexDirection: 'row', alignItems: 'flex-start' },
  toast: {
    position: 'absolute', bottom: 30, alignSelf: 'center',
    backgroundColor: Colors.accent, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderRadius: Radius.full, ...Shadow.accentGlow,
  },
});
