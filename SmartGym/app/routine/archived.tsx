/**
 * app/routine/archived.tsx
 * Archived Routines — routines hidden from the main list via Archive.
 * Restore (unarchive) or permanently delete them here.
 */

import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/store';

export default function ArchivedRoutinesScreen() {
  const routines = useStore((s) => s.routines);
  const archived = React.useMemo(
    () => routines.filter((r) => r.archived && !r.deletedAt),
    [routines]
  );
  const unarchiveRoutine = useStore((s) => s.unarchiveRoutine);
  const deleteRoutine = useStore((s) => s.deleteRoutine);
  const hapticsEnabled = useStore((s) => s.settings.hapticFeedback);

  const buzz = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleRestore = (id: string) => {
    buzz();
    unarchiveRoutine(id);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Routine',
      `Permanently delete "${name}"? This removes it from the database and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            deleteRoutine(id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Icon name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Archived Routines</Text>
        <View style={{ width: 40 }} />
      </View>

      {archived.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 44, marginBottom: Spacing.md }}>🗄️</Text>
          <Text semibold style={{ fontSize: FontSize.lg, marginBottom: Spacing.sm }}>
            No archived routines
          </Text>
          <Text color="secondary" style={{ textAlign: 'center', paddingHorizontal: Spacing.xl }}>
            Archive a routine (swipe or long-press it) to keep it here without deleting it.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {archived.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={[styles.colorDot, { backgroundColor: r.color || Colors.accent }]} />
              <View style={{ flex: 1 }}>
                <Text semibold numberOfLines={1} style={styles.name}>
                  {r.name}
                </Text>
                <Text color="muted" style={styles.meta}>
                  {r.exercises.length} exercise{r.exercises.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleRestore(r.id)}
                hitSlop={8}
              >
                <Icon name="arrow-undo-outline" size={18} color={Colors.accent} />
                <Text style={[styles.actionLabel, { color: Colors.accent }]}>Restore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDelete(r.id, r.name)}
                hitSlop={8}
              >
                <Icon name="trash-outline" size={18} color={Colors.error} />
                <Text style={[styles.actionLabel, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  list: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: FontSize.md, color: Colors.textPrimary },
  meta: { fontSize: FontSize.sm, marginTop: 2 },
  actionBtn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xs, gap: 2 },
  actionLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.bodyBold },
});
