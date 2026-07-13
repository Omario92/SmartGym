/**
 * ExerciseMediaPicker — Pick image, GIF, or video from device library and upload to Supabase.
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { pickMedia, uploadMedia, type MediaPickType } from '@/lib/mediaUploadService';
import type { MediaItem } from '@/lib/supabaseTypes';

interface ExerciseMediaPickerProps {
  userId: string;
  exerciseId: string;
  onMediaAdded: (item: MediaItem) => void;
  disabled?: boolean;
}

const PICK_OPTIONS: { type: MediaPickType; label: string; icon: string; accent: string }[] = [
  { type: 'image', label: 'Photo', icon: 'image-outline', accent: Colors.accent },
  { type: 'gif', label: 'GIF', icon: 'film-outline', accent: '#4DA6FF' },
  { type: 'video', label: 'Video', icon: 'videocam-outline', accent: '#FF8C42' },
];

export function ExerciseMediaPicker({ userId, exerciseId, onMediaAdded, disabled }: ExerciseMediaPickerProps) {
  const [uploading, setUploading] = useState<MediaPickType | null>(null);

  const handlePick = async (type: MediaPickType) => {
    if (disabled || uploading) return;
    try {
      const asset = await pickMedia(type);
      if (!asset) return; // user cancelled

      setUploading(type);
      const { mediaItem } = await uploadMedia(asset, userId, exerciseId, type);
      onMediaAdded(mediaItem);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      Alert.alert('Upload Failed', message, [{ text: 'OK' }]);
    } finally {
      setUploading(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Media</Text>
      <Text style={styles.hint}>Add photos, GIFs, or videos to demonstrate the exercise.</Text>
      <View style={styles.row}>
        {PICK_OPTIONS.map((opt) => {
          const isLoading = uploading === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[styles.pickBtn, { borderColor: isLoading ? opt.accent : Colors.border }]}
              onPress={() => handlePick(opt.type)}
              disabled={!!uploading || disabled}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={opt.accent} />
              ) : (
                <Icon name={opt.icon as 'image-outline'} size={22} color={opt.accent} />
              )}
              <Text style={[styles.pickLabel, isLoading && { color: opt.accent }]}>
                {isLoading ? 'Uploading…' : opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.sizeHint}>Max size: 10MB (image/GIF) · 50MB (video)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.bodyMedium,
  },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm },
  pickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  pickLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  sizeHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center' },
});
