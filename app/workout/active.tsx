/**
 * Active Workout Screen — Full-screen workout session
 * Set logging, rest timer, exercise navigation, finish summary
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ExerciseImage } from '@/components/exercise/ExerciseImage';
import { useStore, type SetLog, selectCustomExercises } from '@/store';
import { findExerciseById } from '@/lib/exercises';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Format helpers ───────────────────────────────────────────────────────────

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// ─── Rest Timer Component ─────────────────────────────────────────────────────

const RestTimer: React.FC<{
  totalSeconds: number;
  remaining: number;
  onSkip: () => void;
}> = ({ totalSeconds, remaining, onSkip }) => {
  const progress = remaining / totalSeconds;

  return (
    <View style={styles.restOverlay}>
      <Text variant="h3" style={{ marginBottom: Spacing.sm }}>
        Rest Time
      </Text>
      <ProgressRing
        size={160}
        strokeWidth={12}
        progress={progress}
        color={Colors.accent}
        label={formatTime(remaining)}
        sublabel="remaining"
      />
      <Text color="secondary" style={{ marginTop: Spacing.xl, marginBottom: Spacing.xl }}>
        Great set! Take a breather 💪
      </Text>
      <Button title="Skip Rest" variant="outline" onPress={onSkip} />
    </View>
  );
};

// ─── Set Row ──────────────────────────────────────────────────────────────────

const SetRow: React.FC<{
  set: SetLog;
  setIndex: number;
  exerciseIndex: number;
  isActive: boolean;
  onComplete: () => void;
}> = ({ set, setIndex, exerciseIndex, isActive, onComplete }) => {
  const updateSet = useStore((s) => s.updateSet);

  return (
    <View style={[styles.setRow, set.completed && styles.setRowCompleted, isActive && styles.setRowActive]}>
      <View style={styles.setNum}>
        {set.completed ? (
          <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
        ) : (
          <Text color="muted" style={{ fontWeight: FontWeight.semibold }}>
            {setIndex + 1}
          </Text>
        )}
      </View>

      {/* Weight */}
      <View style={styles.setInputWrap}>
        <Text color="muted" style={styles.setInputLabel}>Weight (kg)</Text>
        <TextInput
          style={[styles.setInput, set.completed && styles.setInputDone]}
          keyboardType="decimal-pad"
          value={set.weight > 0 ? set.weight.toString() : ''}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          onChangeText={(v) =>
            updateSet(exerciseIndex, setIndex, { weight: parseFloat(v) || 0 })
          }
          editable={!set.completed}
        />
      </View>

      {/* Reps */}
      <View style={styles.setInputWrap}>
        <Text color="muted" style={styles.setInputLabel}>Reps</Text>
        <TextInput
          style={[styles.setInput, set.completed && styles.setInputDone]}
          keyboardType="number-pad"
          value={set.reps > 0 ? set.reps.toString() : ''}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          onChangeText={(v) =>
            updateSet(exerciseIndex, setIndex, { reps: parseInt(v) || 0 })
          }
          editable={!set.completed}
        />
      </View>

      {/* Complete button */}
      <TouchableOpacity
        style={[styles.doneBtn, set.completed && styles.doneBtnActive]}
        onPress={onComplete}
        activeOpacity={0.8}
      >
        <Ionicons
          name={set.completed ? 'checkmark' : 'checkmark-outline'}
          size={20}
          color={set.completed ? '#000' : Colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ActiveWorkoutScreen() {
  const activeWorkout = useStore((s) => s.activeWorkout);
  const updateSet = useStore((s) => s.updateSet);
  const addSet = useStore((s) => s.addSet);
  const finishWorkout = useStore((s) => s.finishWorkout);
  const cancelWorkout = useStore((s) => s.cancelWorkout);
  const updateElapsed = useStore((s) => s.updateElapsed);
  const startRest = useStore((s) => s.startRest);
  const skipRest = useStore((s) => s.skipRest);
  const settings = useStore((s) => s.settings);
  const customExercises = useStore(selectCustomExercises);
  const insets = useSafeAreaInsets();

  const [restRemaining, setRestRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed workout timer
  useEffect(() => {
    if (!activeWorkout) return;
    timerRef.current = setInterval(() => {
      updateElapsed((activeWorkout?.elapsedSeconds ?? 0) + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeWorkout?.elapsedSeconds]);

  // Rest timer countdown
  useEffect(() => {
    if (!activeWorkout?.isResting) {
      if (restRef.current) clearInterval(restRef.current);
      setRestRemaining(activeWorkout?.restSecondsLeft ?? 0);
      return;
    }

    setRestRemaining(activeWorkout.restSecondsLeft);
    restRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          skipRest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (restRef.current) clearInterval(restRef.current);
    };
  }, [activeWorkout?.isResting]);

  if (!activeWorkout) {
    return <Redirect href="/" />;
  }

  const currentExercise = activeWorkout.exercises[activeWorkout.currentExerciseIndex];
  const completedSets = activeWorkout.exercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = activeWorkout.exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  const handleSetComplete = (exerciseIndex: number, setIndex: number, set: SetLog) => {
    if (set.completed) {
      // Uncheck
      updateSet(exerciseIndex, setIndex, { completed: false });
    } else {
      // Complete the set
      updateSet(exerciseIndex, setIndex, { completed: true });
      // Start rest timer
      const restTime = settings.restTimerDefault;
      startRest(restTime);
    }
  };

  const handleFinish = () => {
    Alert.alert(
      'Finish Workout?',
      `You've completed ${completedSets}/${totalSets} sets.\n\nAre you ready to finish?`,
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            finishWorkout();
            router.replace('/history');
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert('Cancel Workout?', 'All progress will be lost.', [
      { text: 'Continue Workout', style: 'cancel' },
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: () => {
          cancelWorkout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.md), paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text semibold style={{ fontSize: FontSize.sm }}>
              {activeWorkout.routineName}
            </Text>
            <Text color="accent" style={{ fontSize: FontSize.xs }}>
              {formatTime(activeWorkout.elapsedSeconds)}
            </Text>
          </View>
          <Button
            title="Finish"
            variant="primary"
            size="sm"
            onPress={handleFinish}
          />
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text color="muted" style={styles.progressLabel}>
          {completedSets} / {totalSets} sets completed
        </Text>

        {/* Rest Timer Overlay */}
        {activeWorkout.isResting && (
          <RestTimer
            totalSeconds={settings.restTimerDefault}
            remaining={restRemaining}
            onSkip={skipRest}
          />
        )}

        {/* Exercise List */}
        {!activeWorkout.isResting && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {activeWorkout.exercises.map((exercise, eIdx) => {
              const allSetsComplete = exercise.sets.every((s) => s.completed);
              const exInfo = findExerciseById(exercise.exerciseId, customExercises);
              return (
                <View key={`${exercise.exerciseId}-${eIdx}`} style={styles.exerciseSection}>
                  {/* Exercise image */}
                  {exInfo?.image && (
                    <ExerciseImage
                      uri={exInfo.image}
                      width={SCREEN_W - Spacing.lg * 2}
                      height={160}
                      borderRadius={0}
                      style={styles.exerciseSectionImage}
                    />
                  )}
                  {/* Exercise header */}
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseHeaderLeft}>
                      {allSetsComplete && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={Colors.accent}
                          style={{ marginRight: Spacing.sm }}
                        />
                      )}
                      <Text variant="h4" style={{ flex: 1 }}>
                        {exercise.exerciseName}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => addSet(eIdx)}>
                      <Text color="accent" style={{ fontSize: FontSize.sm }}>
                        + Set
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Set column labels */}
                  <View style={styles.setLabels}>
                    <View style={styles.setNum}>
                      <Text color="muted" style={styles.setInputLabel}>Set</Text>
                    </View>
                    <View style={styles.setInputWrap}>
                      <Text color="muted" style={styles.setInputLabel}>Weight</Text>
                    </View>
                    <View style={styles.setInputWrap}>
                      <Text color="muted" style={styles.setInputLabel}>Reps</Text>
                    </View>
                    <View style={styles.doneBtn} />
                  </View>

                  {/* Sets */}
                  {exercise.sets.map((set, sIdx) => (
                    <SetRow
                      key={set.id}
                      set={set}
                      setIndex={sIdx}
                      exerciseIndex={eIdx}
                      isActive={
                        eIdx === activeWorkout.currentExerciseIndex &&
                        sIdx === activeWorkout.currentSetIndex
                      }
                      onComplete={() => handleSetComplete(eIdx, sIdx, set)}
                    />
                  ))}
                </View>
              );
            })}

            {/* Finish button at bottom */}
            <Button
              title="🏁 Finish Workout"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleFinish}
              style={{ marginTop: Spacing.xl }}
            />
            <Button
              title="Cancel Workout"
              variant="ghost"
              size="md"
              fullWidth
              onPress={handleCancel}
              style={{ marginTop: Spacing.sm }}
            />
          </ScrollView>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  progressBar: {
    height: 4,
    backgroundColor: Colors.bgCard2,
    marginHorizontal: Spacing.lg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing['5xl'] },

  // Exercise section
  exerciseSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  exerciseSectionImage: {
    width: '100%',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.bgCard2,
  },
  exerciseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  setLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 0,
  },

  // Set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  setRowCompleted: {
    backgroundColor: Colors.accentGlow2,
  },
  setRowActive: {
    backgroundColor: Colors.bgCard3,
  },
  setNum: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setInputWrap: {
    flex: 1,
    alignItems: 'center',
  },
  setInputLabel: {
    fontSize: FontSize.xs,
    marginBottom: 2,
    textAlign: 'center',
  },
  setInput: {
    width: '100%',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    textAlign: 'center',
    minHeight: 40,
    fontWeight: FontWeight.semibold,
  },
  setInputDone: {
    backgroundColor: Colors.accentGlow2,
    borderColor: Colors.accentGlow,
    color: Colors.accent,
  },
  doneBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCard2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    ...Shadow.accentGlow,
  },

  // Rest overlay
  restOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
});
