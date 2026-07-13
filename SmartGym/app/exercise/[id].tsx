/**
 * app/exercise/[id].tsx
 * View + Edit a cloud custom exercise.
 * View mode: hero image + badges + About/Instructions/Tips (matches ExerciseDetailModal layout)
 * Edit mode: media grid + form
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ExerciseForm, type ExerciseFormValues } from '@/components/exercise/ExerciseForm';
import { ExerciseMediaPicker } from '@/components/exercise/ExerciseMediaPicker';
import { ExerciseMediaPreview, NoMediaPlaceholder } from '@/components/exercise/ExerciseMediaPreview';
import { useStore } from '@/store';
import {
  useExerciseDetail,
  useUpdateExercise,
  useArchiveExercise,
} from '@/lib/exerciseService';
import type { MediaItem } from '@/lib/supabaseTypes';
import type { MuscleGroup, Equipment, ExerciseType } from '@/lib/exercises';

const { width: SCREEN_W } = Dimensions.get('window');

const titleCase = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const diffVariant = (d: string) =>
  d === 'beginner' ? 'accent' as const : d === 'intermediate' ? 'info' as const : 'error' as const;

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const authUser = useStore((s) => s.authUser);

  const { data: exercise, isLoading, error, refetch } = useExerciseDetail(id ?? null);
  // Always call hooks unconditionally — guard actual mutations with isOwner check
  const updateMutation = useUpdateExercise(authUser?.id ?? '');
  const archiveMutation = useArchiveExercise(authUser?.id ?? '');

  const [editing, setEditing] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);

  const isOwner = !!(authUser && exercise?.userId === authUser.id);

  // Sync media from fetched exercise when it loads
  React.useEffect(() => {
    if (exercise?.media) {
      queueMicrotask(() => {
        setMedia(exercise.media);
      });
    }
  }, [exercise?.media]);

  // ─── Hero media (first image, gif, or video) ───────────────────────────
  const heroMedia = media[0] ?? (exercise?.image ? { url: exercise.image, type: 'image' } : null);

  // Setup video player if hero is a video
  const player = useVideoPlayer(heroMedia?.type === 'video' ? heroMedia.url : null, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSave = async (values: ExerciseFormValues) => {
    if (!authUser || !id) return;
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          name: values.name,
          muscle_group: values.muscleGroup as MuscleGroup,
          equipment: values.equipment as Equipment,
          type: values.type as ExerciseType,
          difficulty: values.difficulty,
          description: values.description,
          instructions: values.instructions.map((i) => i.value),
          tips: values.tips.map((t) => t.value),
          notes: values.notes,
          media,
        },
      });
      setEditing(false);
      Alert.alert('Saved', 'Exercise updated successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = () => {
    Alert.alert(
      'Delete Exercise',
      `Remove "${exercise?.name}"? It will still appear in existing routines and history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await archiveMutation.mutateAsync(id);
              router.back();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('Archive error:', msg);
              Alert.alert('Error', `Could not delete exercise. ${msg}`);
            }
          },
        },
      ]
    );
  };

  const handleMediaAdded = (item: MediaItem) => setMedia((prev) => [...prev, item]);
  const handleMediaRemoved = (pathOrUrl: string) =>
    setMedia((prev) => prev.filter((m) => m.storagePath !== pathOrUrl && m.url !== pathOrUrl));

  // ─── Loading / Error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState fill label="Loading exercise…" />
      </SafeAreaView>
    );
  }

  if (error || !exercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Icon name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={{ color: Colors.textSecondary, marginTop: Spacing.md }}>
            Exercise not found.
          </Text>
          {error && (
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4, textAlign: 'center', paddingHorizontal: Spacing.xl }}>
              {error instanceof Error ? error.message : String(error)}
            </Text>
          )}
          <Button title="Retry" onPress={() => refetch()} style={{ marginTop: Spacing.md }} />
          <Button title="Go Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: Spacing.sm }} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Icon name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {editing ? 'Edit Exercise' : exercise.name}
        </Text>
        {isOwner ? (
          <View style={styles.headerActions}>
            {editing ? (
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.iconBtn}>
                <Icon name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity onPress={() => setEditing(true)} style={styles.iconBtn}>
                  <Icon name="pencil-outline" size={20} color={Colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleArchive} style={styles.iconBtn}>
                  <Icon name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {editing && isOwner ? (
        /* ── Edit Mode ─────────────────────────────────────────────────── */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.editContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {media.length > 0
            ? <ExerciseMediaPreview media={media} onMediaRemoved={handleMediaRemoved} />
            : <NoMediaPlaceholder />
          }
          {authUser && (
            <ExerciseMediaPicker
              userId={authUser.id}
              exerciseId={id ?? ''}
              onMediaAdded={handleMediaAdded}
            />
          )}
          <ExerciseForm
            defaultValues={{
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
              equipment: exercise.equipment,
              type: exercise.type,
              difficulty: exercise.difficulty,
              description: exercise.description,
              instructions: exercise.instructions.map((v) => ({ value: v })),
              tips: exercise.tips.map((v) => ({ value: v })),
              notes: exercise.notes ?? '',
            }}
            onSubmit={handleSave}
            loading={saving}
            submitLabel="Save Changes"
          />
        </ScrollView>
      ) : (
        /* ── View Mode ─────────────────────────────────────────────────── */
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero Media — full width, no horizontal padding */}
          {heroMedia ? (
            heroMedia.type === 'video' ? (
              <VideoView
                player={player}
                style={styles.heroImage}
                contentFit="cover"
              />
            ) : (
              <Image
                source={{ uri: heroMedia.url }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            )
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={{ fontSize: 52 }}>💪</Text>
            </View>
          )}

          {/* Badges */}
          <View style={styles.badgeRow}>
            <Badge
              label={titleCase(exercise.muscleGroup)}
              variant="secondary"
            />
            <Badge
              label={titleCase(exercise.difficulty)}
              variant={diffVariant(exercise.difficulty)}
            />
            <Badge
              label={titleCase(exercise.equipment)}
              variant="secondary"
            />
            {exercise.source === 'custom' && (
              <Badge label="✨ Custom" variant="accent" />
            )}
          </View>

          {/* About */}
          {exercise.description ? (
            <View style={styles.section}>
              <Text semibold style={styles.sectionTitle}>About</Text>
              <Text color="secondary" style={styles.body}>{exercise.description}</Text>
            </View>
          ) : null}

          {/* Instructions */}
          {exercise.instructions.length > 0 && (
            <View style={styles.section}>
              <Text semibold style={styles.sectionTitle}>Instructions</Text>
              {exercise.instructions.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  <Text color="secondary" style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tips */}
          {exercise.tips.length > 0 && (
            <View style={styles.section}>
              <Text semibold style={styles.sectionTitle}>💡 Pro Tips</Text>
              {exercise.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Icon name="checkmark-circle" size={16} color={Colors.accent} style={{ marginTop: 2 }} />
                  <Text color="secondary" style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Personal notes */}
          {exercise.notes ? (
            <View style={[styles.section, styles.notesCard]}>
              <Text semibold style={styles.sectionTitle}>My Notes</Text>
              <Text color="secondary" style={styles.body}>{exercise.notes}</Text>
            </View>
          ) : null}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBtn: { padding: Spacing.sm, width: 40, alignItems: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.display,
    color: Colors.textPrimary,
  },
  headerActions: { flexDirection: 'row', width: 80, justifyContent: 'flex-end' },

  scroll: { flex: 1 },

  // Edit mode
  editContent: { padding: Spacing.lg, paddingBottom: 60 },

  // Hero image (view mode)
  heroImage: {
    width: SCREEN_W,
    height: 220,
  },
  heroPlaceholder: {
    width: SCREEN_W,
    height: 180,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  body: {
    lineHeight: 22,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  // Instructions
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  stepCircle: {
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
  stepNum: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bodyBold,
    color: Colors.accent,
  },
  stepText: {
    flex: 1,
    lineHeight: 20,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  // Tips
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    lineHeight: 20,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  // Notes
  notesCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
});
