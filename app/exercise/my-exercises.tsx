/**
 * app/exercise/index.tsx
 * List all cloud custom exercises for the authenticated user.
 * Supports view, edit (→ /exercise/[id]) and create new (→ /exercise/create).
 */

import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/store';
import { useMyCustomExercises } from '@/lib/exerciseService';
import type { CloudExercise } from '@/lib/supabaseTypes';

// ─── Exercise Card ────────────────────────────────────────────────────────────

function CloudExerciseRow({ item, onPress }: { item: CloudExercise; onPress: () => void }) {
  const diff = item.difficulty;
  const diffColor = diff === 'beginner' ? Colors.accent : diff === 'intermediate' ? '#4DA6FF' : '#FF6B6B';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      {/* Icon / Image placeholder */}
      <View style={styles.rowIcon}>
        {item.image ? (
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          <View style={[styles.rowIcon, { overflow: 'hidden' }]}>
            {/* show first letter as fallback */}
            <Text style={{ fontSize: 20 }}>💪</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 20 }}>💪</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowSub}>
            {item.muscleGroup.replace(/_/g, ' ')} · {item.equipment.replace(/_/g, ' ')}
          </Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={[styles.diffDot, { backgroundColor: diffColor + '33', borderColor: diffColor }]}>
            <Text style={[styles.diffText, { color: diffColor }]}>{diff}</Text>
          </View>
          {item.media.length > 0 && (
            <View style={styles.mediaBadge}>
              <Ionicons name="image-outline" size={10} color={Colors.textMuted} />
              <Text style={styles.mediaBadgeText}>{item.media.length}</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyCloudExercises({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={{ fontSize: 52, marginBottom: Spacing.md }}>☁️</Text>
      <Text style={styles.emptyTitle}>No cloud exercises yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first custom exercise and it will sync{'\n'}across all your devices.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onCreate} activeOpacity={0.8}>
        <Ionicons name="add" size={18} color={Colors.bg} />
        <Text style={styles.emptyBtnText}>Create First Exercise</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MyCloudExercisesScreen() {
  const authUser = useStore((s) => s.authUser);
  const [search, setSearch] = useState('');

  const { data: exercises, isLoading, error, refetch, isRefetching } = useMyCustomExercises(
    authUser?.id ?? null
  );

  if (!authUser) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cloud Exercises</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🔒</Text>
          <Text style={styles.emptyTitle}>Sign in required</Text>
          <Text style={styles.emptySubtitle}>Sign in to access your cloud exercises.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={18} color={Colors.bg} />
            <Text style={styles.emptyBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Filter by search
  const filtered = (exercises ?? []).filter((ex) =>
    search.trim() === '' ||
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => router.push('/exercise/create');
  const handlePress = (id: string) => router.push({ pathname: '/exercise/[id]', params: { id } });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cloud Exercises</Text>
        <TouchableOpacity onPress={handleCreate} style={styles.createBtn}>
          <Ionicons name="add" size={24} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      {(exercises ?? []).length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{exercises?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="cloud-done-outline" size={16} color={Colors.accent} />
            <Text style={[styles.statLabel, { color: Colors.accent, marginLeft: 4 }]}>Synced</Text>
          </View>
        </View>
      )}

      {/* Search */}
      {(exercises ?? []).length > 0 && (
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={{ color: Colors.textMuted, marginTop: Spacing.md, fontSize: FontSize.sm }}>
            Loading your exercises…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={{ color: Colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' }}>
            Failed to load exercises
          </Text>
          <Text style={{
            color: Colors.textMuted,
            marginTop: Spacing.sm,
            fontSize: FontSize.xs,
            textAlign: 'center',
            paddingHorizontal: Spacing.lg,
          }}>
            {error instanceof Error ? error.message : String(error)}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={{ color: Colors.accent, fontSize: FontSize.sm }}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: Colors.textMuted, marginTop: Spacing.sm }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>Sign in again</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 && search.trim() !== '' ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={40} color={Colors.textMuted} />
          <Text style={{ color: Colors.textMuted, marginTop: Spacing.md }}>
            No results for &quot;{search}&quot;
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CloudExerciseRow item={item} onPress={() => handlePress(item.id)} />
          )}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : styles.list}
          ListEmptyComponent={<EmptyCloudExercises onCreate={handleCreate} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.accent}
              colors={[Colors.accent, Colors.accentDim]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.sm, width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.display,
    color: Colors.textPrimary,
  },
  createBtn: { padding: Spacing.sm, width: 40, alignItems: 'flex-end' },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statNum: { fontSize: FontSize.md, fontFamily: FontFamily.bodyBold, color: Colors.accent },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  statDivider: { width: 1, height: 16, backgroundColor: Colors.border, marginHorizontal: Spacing.md },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },

  list: { paddingVertical: Spacing.sm, paddingBottom: 40 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bg,
    gap: Spacing.md,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowInfo: { flex: 1 },
  rowName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowMeta: { marginBottom: 4 },
  rowSub: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'capitalize' },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },

  diffDot: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  diffText: { fontSize: 10, fontFamily: FontFamily.bodyBold, textTransform: 'capitalize' },

  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mediaBadgeText: { fontSize: 10, color: Colors.textMuted },

  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 44 + Spacing.lg + Spacing.md },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  emptyBtnText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bodyBold,
    color: Colors.bg,
  },

  retryBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
});
