/**
 * ExerciseCard — Reusable card for exercise lists throughout the app.
 * Shows thumbnail, name, muscle/equipment meta, difficulty badge,
 * favorite heart icon, and a "Custom" badge for user-created exercises.
 */

import React, { useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_W = Dimensions.get('window').width;
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { ExerciseImage } from './ExerciseImage';
import { useStore } from '@/store';
import type { Exercise, CustomExercise } from '@/lib/exercises';

interface ExerciseCardProps {
  exercise: Exercise | CustomExercise;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Show add (+) button on the right */
  showAdd?: boolean;
  /** Show favorite heart */
  showFavorite?: boolean;
  /** Compact row style (used in pickers) */
  compact?: boolean;
  /** Currently selected (neon glow border) */
  selected?: boolean;
  style?: object;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: Colors.success,
  intermediate: Colors.info,
  advanced: Colors.error,
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPress,
  onLongPress,
  showAdd = false,
  showFavorite = true,
  compact = false,
  selected = false,
  style,
}) => {
  const toggleFavorite = useStore((s) => s.toggleFavoriteExercise);
  const favoriteIds = useStore((s) => s.favoriteExerciseIds);
  const isFav = favoriteIds.includes(exercise.id);
  const isCustom = 'isCustom' in exercise && exercise.isCustom;

  // Heart scale animation
  const heartScale = useSharedValue(1);
  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleFavorite = useCallback(() => {
    heartScale.value = withSpring(1.4, { damping: 4 }, () => {
      heartScale.value = withSpring(1);
    });
    toggleFavorite(exercise.id);
  }, [exercise.id, toggleFavorite, heartScale]);

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactRow,
          selected && styles.compactRowSelected,
          style,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
      >
        <ExerciseImage
          uri={exercise.image}
          width={60}
          height={46}
          borderRadius={Radius.sm}
        />
        <View style={styles.compactInfo}>
          <View style={styles.compactTitleRow}>
            <Text semibold style={styles.compactName} numberOfLines={1}>
              {exercise.name}
            </Text>
            {isCustom && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>✨ Custom</Text>
              </View>
            )}
          </View>
          <Text color="muted" style={styles.compactMeta}>
            {exercise.muscleGroup.replace(/_/g, ' ')} ·{' '}
            {exercise.equipment.replace(/_/g, ' ')}
          </Text>
        </View>
        <View style={styles.compactRight}>
          <View
            style={[
              styles.difficultyDot,
              { backgroundColor: DIFFICULTY_COLOR[exercise.difficulty] },
            ]}
          />
          {showAdd && (
            <Ionicons
              name="add-circle"
              size={22}
              color={Colors.accent}
              style={{ marginLeft: Spacing.sm }}
            />
          )}
          {showFavorite && (
            <TouchableOpacity
              onPress={handleFavorite}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: Spacing.sm }}
            >
              <Animated.View style={heartAnimStyle}>
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFav ? Colors.error : Colors.textMuted}
                />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Full card
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected, style]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      {/* Image */}
      <ExerciseImage
        uri={exercise.image}
        width={SCREEN_W - 32}
        height={140}
        borderRadius={0}
        style={styles.cardImage}
      />

      {/* Badges row over image */}
      <View style={styles.imageBadges}>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: DIFFICULTY_COLOR[exercise.difficulty] + 'CC' },
          ]}
        >
          <Text style={styles.difficultyBadgeText}>{exercise.difficulty}</Text>
        </View>
        {isCustom && (
          <View style={styles.customImageBadge}>
            <Text style={styles.customBadgeText}>✨ Custom</Text>
          </View>
        )}
        {showFavorite && (
          <TouchableOpacity
            style={styles.favBtn}
            onPress={handleFavorite}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Animated.View style={heartAnimStyle}>
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={18}
                color={isFav ? Colors.error : '#fff'}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text semibold style={styles.cardName} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text color="secondary" style={styles.cardMeta}>
          {exercise.muscleGroup.replace(/_/g, ' ')} ·{' '}
          {exercise.equipment.replace(/_/g, ' ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // ── Full card ──
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  cardSelected: {
    borderColor: Colors.accent,
    ...Shadow.accentGlow,
  },
  cardImage: { width: '100%' },
  imageBadges: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  difficultyBadgeText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'capitalize',
  },
  customImageBadge: {
    backgroundColor: Colors.accentGlow,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  favBtn: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { padding: Spacing.md },
  cardName: { fontSize: FontSize.md, marginBottom: 2 },
  cardMeta: { fontSize: FontSize.xs, textTransform: 'capitalize' },

  // ── Compact row ──
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  compactRowSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentGlow2,
  },
  compactInfo: { flex: 1, minWidth: 0 },
  compactTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  compactName: { fontSize: FontSize.md, flexShrink: 1 },
  compactMeta: { fontSize: FontSize.xs, marginTop: 2, textTransform: 'capitalize' },
  compactRight: { flexDirection: 'row', alignItems: 'center' },
  difficultyDot: { width: 8, height: 8, borderRadius: 4 },

  // ── Shared ──
  customBadge: {
    backgroundColor: Colors.accentGlow2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  customBadgeText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
