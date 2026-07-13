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
import { useVideoPlayer, VideoView } from 'expo-video';
import { Icon } from '@/components/ui/Icon';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { ExerciseImage } from './ExerciseImage';
import type { Exercise, CustomExercise } from '@/lib/exercises';
import type { MediaItem } from '@/lib/supabaseTypes';
import { useStore, selectExercisePRs, getExercise1RMHistory } from '@/store';
import { LineChart } from '@/components/ui/LineChart';
import { getDisplayWeight } from '@/lib/unit';

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

/** "full_body" / "resistance band" → "Full Body" / "Resistance Band" */
const titleCase = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
  const settings = useStore((s) => s.settings);
  const weightUnit = settings.weightUnit;

  // Resolve a playable video (Supabase Storage object or a real video file).
  // Google Drive /view share links are ignored so they fall back to the image.
  const mediaArr = (exercise as any)?.media as MediaItem[] | undefined;
  const rawVideo =
    mediaArr?.find((m) => m.type === 'video')?.url ??
    (exercise as any)?.videoUrl ??
    null;
  const videoUrl =
    rawVideo &&
    (/\.(mp4|m4v|mov|webm|m3u8)(\?.*)?$/i.test(rawVideo) ||
      /\/storage\/v1\/object\/public\//.test(rawVideo))
      ? rawVideo
      : null;

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // The modal component stays mounted (parent renders it with a `visible` prop),
  // so the player keeps playing — and its audio keeps sounding — after the modal
  // closes. Pause it whenever the modal is hidden or there's no video, and on unmount.
  React.useEffect(() => {
    try {
      if (visible && videoUrl) {
        player.muted = true;
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // player may be released; ignore
    }
    return () => {
      try { player.pause(); } catch { /* released */ }
    };
  }, [visible, videoUrl, player]);

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
            <Icon name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text semibold style={styles.headerTitle} numberOfLines={1}>
            {exercise.name}
          </Text>
          {isCustom(exercise) && onEdit && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => onEdit(exercise as CustomExercise)}
            >
              <Icon name="pencil" size={18} color={Colors.accent} />
            </TouchableOpacity>
          )}
          {!isCustom(exercise) && <View style={styles.editBtn} />}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero media — video when available, else image */}
          {videoUrl ? (
            <VideoView
              player={player}
              style={styles.heroVideo}
              contentFit="cover"
              nativeControls
            />
          ) : (
            <ExerciseImage
              uri={exercise.image}
              width={SCREEN_W}
              height={220}
              borderRadius={0}
            />
          )}

          {/* Badges row */}
          <View style={styles.badgeRow}>
            <Badge
              label={titleCase(exercise.muscleGroup)}
              variant="secondary"
            />
            <Badge
              label={titleCase(exercise.difficulty)}
              variant={difficultyVariant(exercise.difficulty)}
            />
            <Badge
              label={titleCase(exercise.equipment)}
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
          {exercisePR && (() => {
            const rawHistory = getExercise1RMHistory(useStore.getState(), exercise.id);
            const convertedHistory = rawHistory.map(item => ({
              ...item,
              value: weightUnit === 'lbs' ? Math.round(item.value * 2.20462) : item.value,
              weight: weightUnit === 'lbs' ? Math.round(item.weight * 2.20462) : item.weight,
            }));
            const displayOneRM = weightUnit === 'lbs' ? Math.round(exercisePR.oneRM * 2.20462) : exercisePR.oneRM;
            const displayWeight = weightUnit === 'lbs' ? Math.round(exercisePR.weight * 2.20462) : exercisePR.weight;
            const displayOneRMStr = weightUnit === 'lbs' ? displayOneRM.toFixed(0) : displayOneRM.toFixed(1);
            const displayWeightStr = weightUnit === 'lbs' ? displayWeight.toFixed(0) : displayWeight.toFixed(1);

            return (
              <View style={styles.section}>
                <Text semibold style={styles.sectionTitle}>
                  Strength Progress (1RM)
                </Text>
                <View style={styles.prSummary}>
                  <View>
                    <Text color="secondary" style={{ fontSize: FontSize.xs, marginBottom: 2 }}>All-Time PR</Text>
                    <Text variant="h3" color="accent">{displayOneRMStr} {weightUnit}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text color="secondary" style={{ fontSize: FontSize.xs, marginBottom: 2 }}>Best Set</Text>
                    <Text semibold>{displayWeightStr} {weightUnit} × {exercisePR.reps}</Text>
                  </View>
                </View>
                <View style={{ marginTop: Spacing.sm }}>
                  <LineChart 
                    data={convertedHistory} 
                    unit={weightUnit} 
                  />
                </View>
              </View>
            );
          })()}

          {/* Tips */}
          {exercise.tips && exercise.tips.length > 0 && (
            <View style={styles.section}>
              <Text semibold style={styles.sectionTitle}>
                💡 Pro Tips
              </Text>
              {exercise.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Icon
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
              <Icon name="trash-outline" size={18} color={Colors.error} />
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
  heroVideo: { width: SCREEN_W, height: 220, backgroundColor: Colors.bgCard },
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
    fontFamily: FontFamily.bodyBold,
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
    fontFamily: FontFamily.bodyBold,
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
