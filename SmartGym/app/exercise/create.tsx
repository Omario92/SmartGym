/**
 * app/exercise/create.tsx
 * Create a new custom exercise. Authenticated → saves to Supabase.
 * Unauthenticated → saves locally with clear message.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { ExerciseForm, type ExerciseFormValues } from '@/components/exercise/ExerciseForm';
import { ExerciseMediaPicker } from '@/components/exercise/ExerciseMediaPicker';
import { ExerciseMediaPreview, NoMediaPlaceholder } from '@/components/exercise/ExerciseMediaPreview';
import { useStore } from '@/store';
import { useCreateExercise } from '@/lib/exerciseService';
import { formDataToInsert } from '@/lib/exerciseMapper';
import type { MediaItem } from '@/lib/supabaseTypes';

export default function CreateExerciseScreen() {
  const authUser = useStore((s) => s.authUser);
  const addCustomExercise = useStore((s) => s.addCustomExercise);

  const [exerciseId] = useState(() => `local_${Date.now()}`);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Always call hook unconditionally; only invoke mutation when authUser exists
  const createMutation = useCreateExercise(authUser?.id ?? '');

  const handleSubmit = async (values: ExerciseFormValues) => {
    setSaving(true);
    try {
      if (authUser) {
        // ── Cloud save ─────────────────────────────────────────────
        const payload = formDataToInsert(
          {
            ...values,
            instructions: values.instructions.map((i) => i.value),
            tips: values.tips.map((t) => t.value),
            notes: values.notes,
            media,
            isPublic: false,
          },
          authUser.id
        );
        await createMutation.mutateAsync(payload);
        Alert.alert('✅ Saved!', 'Your exercise was saved to the cloud.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        // ── Local save ─────────────────────────────────────────────
        addCustomExercise({
          id: exerciseId,
          name: values.name,
          muscleGroup: values.muscleGroup,
          equipment: values.equipment,
          type: values.type,
          difficulty: values.difficulty,
          description: values.description,
          instructions: values.instructions.map((i) => i.value),
          tips: values.tips.map((t) => t.value),
          notes: values.notes,
          image: media[0]?.url ?? '',
          isCustom: true,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Saved Locally', 'Sign in to sync this exercise to the cloud.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save exercise.';
      Alert.alert('Save Failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleMediaAdded = (item: MediaItem) => {
    setMedia((prev) => [...prev, item]);
  };

  const handleMediaRemoved = (pathOrUrl: string) => {
    setMedia((prev) => prev.filter((m) => m.storagePath !== pathOrUrl && m.url !== pathOrUrl));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Exercise</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Auth banner */}
      {!authUser && (
        <View style={styles.authBanner}>
          <Icon name="cloud-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.authBannerText}>
            Sign in to save exercises to the cloud.{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={{ color: Colors.accent, fontSize: FontSize.xs, fontFamily: FontFamily.bodyBold }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Media section */}
        {media.length > 0
          ? <ExerciseMediaPreview media={media} onMediaRemoved={handleMediaRemoved} />
          : <NoMediaPlaceholder />
        }
        {authUser && (
          <ExerciseMediaPicker
            userId={authUser.id}
            exerciseId={exerciseId}
            onMediaAdded={handleMediaAdded}
          />
        )}

        {/* Main form */}
        <ExerciseForm
          onSubmit={handleSubmit}
          loading={saving}
          submitLabel={authUser ? 'Save to Cloud' : 'Save Locally'}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs, width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontFamily: FontFamily.display, color: Colors.textPrimary },
  authBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  authBannerText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 60 },
});
