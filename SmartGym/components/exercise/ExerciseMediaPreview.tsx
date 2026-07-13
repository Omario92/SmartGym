/**
 * ExerciseMediaPreview — Grid of media items with delete support.
 */

import { Image } from 'expo-image';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { SvgXml } from 'react-native-svg';
import { Colors, Spacing, Radius, FontSize } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { EMPTY_STATE_SVG } from '@/components/ui/designIcons';
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
            source={item.thumbnailUrl || item.url}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />
          {/* Type badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
          </View>

          {/* Video play icon overlay */}
          {item.type === 'video' && (
            <View style={styles.playOverlay}>
              <Icon name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
            </View>
          )}

          {/* Delete button */}
          {editable && onMediaRemoved && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
            >
              <Icon name="close-circle" size={22} color={Colors.error} />
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
    ...StyleSheet.absoluteFill,
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
      <SvgXml xml={EMPTY_STATE_SVG} width={44} height={44} style={{ marginBottom: Spacing.sm }} />
      <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' }}>
        Add photos or video for this exercise
      </Text>
      <View style={placeholder.pill}>
        <Icon name="camera-outline" size={16} color={Colors.accent} />
        <Text style={{ fontSize: FontSize.xs, color: Colors.accent, fontWeight: '600', marginLeft: 6 }}>
          Add Media
        </Text>
      </View>
    </View>
  );
}

const placeholder = StyleSheet.create({
  wrap: {
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
