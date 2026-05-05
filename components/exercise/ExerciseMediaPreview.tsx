/**
 * ExerciseMediaPreview — Grid of media items with delete support.
 */

import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import type { MediaItem } from '@/lib/supabaseTypes';
import { deleteMedia } from '@/lib/mediaUploadService';

interface ExerciseMediaPreviewProps {
  media: MediaItem[];
  onMediaRemoved?: (storagePath: string) => void;
  /** If false, hide delete buttons (view-only mode) */
  editable?: boolean;
}

export function ExerciseMediaPreview({ media, onMediaRemoved, editable = true }: ExerciseMediaPreviewProps) {
  if (media.length === 0) return null;

  const handleDelete = (item: MediaItem) => {
    if (!editable || !onMediaRemoved) return;
    Alert.alert('Remove Media', 'Remove this file from the exercise?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item.storagePath) await deleteMedia(item.storagePath);
            onMediaRemoved(item.storagePath ?? item.url);
          } catch {
            Alert.alert('Error', 'Could not remove media. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {media.map((item, idx) => (
        <View key={idx} style={styles.cell}>
          <Image
            source={{ uri: item.thumbnailUrl ?? item.url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {/* Type badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
          </View>

          {/* Video play icon overlay */}
          {item.type === 'video' && (
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
            </View>
          )}

          {/* Delete button */}
          {editable && onMediaRemoved && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="close-circle" size={22} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cell: {
    width: 100,
    height: 80,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbnail: { width: '100%', height: '100%' },
  typeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  typeText: { fontSize: 9, color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  deleteBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
});

// ─── Inline "no media" placeholder ────────────────────────────────────────────

export function NoMediaPlaceholder() {
  return (
    <View style={placeholder.wrap}>
      <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
      <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 6 }}>
        No media yet
      </Text>
    </View>
  );
}

const placeholder = StyleSheet.create({
  wrap: {
    height: 80,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
});
