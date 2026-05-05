/**
 * ExerciseDetailModal — Full-screen modal showing exercise image,
 * description, step-by-step instructions, tips, and (for custom
 * exercises) edit / delete actions.
 */

import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { ExerciseImage } from './ExerciseImage';
import type { Exercise, CustomExercise } from '@/lib/exercises';
import { useStore, selectExercisePRs, getExercise1RMHistory } from '@/store';
import { LineChart } from '@/components/ui/LineChart';

const { width: SCREEN_W } = Dimensions.get('window');

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (exercise: CustomExercise) => void;
  onDelete?: (id: string) => void;
}

const isCustom = (ex: Exercise): ex is CustomExercise =>
  (ex as CustomExercise).isCustom === true;

const difficultyVariant = (d: string) => {
  if (d === 'beginner') return 'accent' as const;
  if (d === 'intermediate') return 'info' as const;
  return 'error' as const;
};

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  visible,
  onClose,
  onEdit,
  onDelete,
}) => {
  const prs = useStore(selectExercisePRs);
  const exercisePR = exercise ? prs[exercise.id] : null;

  if (!exercise) return null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Exercise',
      `Delete "${exercise.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(exercise.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text semibold style={styles.headerTitle} numberOfLines={1}>
            {exercise.name}
          </Text>
          {isCustom(exercise) && onEdit && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => onEdit(exercise as CustomExercise)}
            >
              <Ionicons name="pencil" size={18} color={Colors.accent} />
            </TouchableOpacity>
          )}
          {!isCustom(exercise) && <View style={styles.editBtn} />}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image */}
          <ExerciseImage
            uri={exercise.image}
            width={SCREEN_W}
            height={220}
            borderRadius={0}
          />

          {/* Badges row */}
          <View style={styles.badgeRow}>
            <Badge
              label={exercise.muscleGroup.replace('_', ' ')}
              variant="secondary"
            />
            <Badge
              label={exercise.difficulty}
              variant={difficultyVariant(exercise.difficulty)}
            />
            <Badge
              label={exercise.equipment.replace('_', ' ')}
              variant="secondary"
            />
            {isCustom(exercise) && (
              <Badge label="Custom" variant="accent" />
            )}
          </View>

          {/* Description */}
          {exercise.description && (
            <View style={styles.section}>
              <Text semibold style={styles.sectionTitle}>
                About
              </Text>
              <Text color="secondary" style={styles.description}>
                {exercise.description}
              </Text>
            </View>
          )}

          {/* Instructions */}
          {exercise.instructions.length > 0 && (
            <View style={styles.section}>
              <Text semibold style={styles.sectionTitle}>
                Instructions
              </Text>
              {exercise.instructions.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text color="accent" style={styles.stepNumText}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text color="secondary" style={styles.stepText}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* 1RM History */}
          {exercisePR && (
            <View style={styles.section}>
              <Text semibold style={styles.sectionTitle}>
                Strength Progress (1RM)
              </Text>
              <View style={styles.prSummary}>
                <View>
                  <Text color="secondary" style={{ fontSize: FontSize.xs, marginBottom: 2 }}>All-Time PR</Text>
                  <Text variant="h3" color="accent">{exercisePR.oneRM.toFixed(1)} kg</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text color="secondary" style={{ fontSize: FontSize.xs, marginBottom: 2 }}>Best Set</Text>
                  <Text semibold>{exercisePR.weight} kg × {exercisePR.reps}</Text>
                </View>
              </View>
              <View style={{ marginTop: Spacing.sm }}>
                <LineChart 
                  data={getExercise1RMHistory(useStore.getState(), exercise.id)} 
                  unit="kg" 
                />
              </View>
            </View>
          )}

          {/* Tips */}
          {exercise.tips && exercise.tips.length > 0 && (
            <View style={styles.section}>
              <Text semibold style={styles.sectionTitle}>
                💡 Pro Tips
              </Text>
              {exercise.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={Colors.accent}
                    style={{ marginTop: 2 }}
                  />
                  <Text color="secondary" style={styles.tipText}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Delete button for custom exercises */}
          {isCustom(exercise) && onDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.deleteBtnText}>Delete Exercise</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgModal },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    marginHorizontal: Spacing.sm,
  },
  editBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  description: {
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accentGlow2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    flexShrink: 0,
  },
  stepNumText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  stepText: {
    flex: 1,
    lineHeight: 20,
  },
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    lineHeight: 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    margin: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.error + '44',
    backgroundColor: Colors.error + '11',
  },
  deleteBtnText: {
    color: Colors.error,
    fontWeight: FontWeight.semibold,
  },
  prSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard2,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
});
