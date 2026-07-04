/**
 * History Tab — Workout history with swipe-to-delete + Clear All
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, Alert, Modal, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { Colors, Spacing, Radius, FontSize, FontFamily, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { GlowOrb } from '@/components/ui/GlowOrb';
import { AWARD_SVG, STREAK_SVG } from '@/components/ui/designIcons';
import { useStore, selectExercisePRs, getExercise1RMHistory, selectCustomExercises } from '@/store';
import type { WorkoutSession } from '@/store';
import { findExerciseById } from '@/lib/exercises';
import { LineChart } from '@/components/ui/LineChart';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
};

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short' });

// ─── Toast ────────────────────────────────────────────────────────────────────

const useToast = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = useState('');

  const show = (msg: string) => {
    setMessage(msg);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const ToastComponent = () => (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={{ color: '#000', fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm }}>
        {message}
      </Text>
    </Animated.View>
  );

  return { show, ToastComponent };
};

// ─── Weekly Heatmap ───────────────────────────────────────────────────────────

const WeeklyBar: React.FC<{ sessions: WorkoutSession[] }> = ({ sessions }) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);

  const worked = days.map((_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    return sessions.some((s) => s.startedAt.startsWith(dateStr));
  });

  return (
    <View style={styles.weekBar}>
      {days.map((day, i) => (
        <View key={i} style={styles.weekDay}>
          <View style={[styles.weekDot, worked[i] && styles.weekDotActive]} />
          <Text style={{ fontSize: FontSize.xs, color: Colors.iconInactive }}>{day}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Swipeable Session Card ───────────────────────────────────────────────────

const SWIPE_THRESHOLD = 80;

const SwipeableSessionCard: React.FC<{
  session: WorkoutSession;
  color: string;
  onDelete: (id: string) => void;
}> = ({ session, color, onDelete }) => {
  const translateX = useSharedValue(0);
  const date = new Date(session.startedAt);
  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const timeLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const confirmDelete = () => {
    Alert.alert('Delete Session', 'Remove this workout from your history?', [
      { text: 'Cancel', style: 'cancel', onPress: () => { translateX.value = withSpring(0); } },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(session.id) },
    ]);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SWIPE_THRESHOLD);
        runOnJS(confirmDelete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    <View style={styles.swipeContainer}>
      {/* Delete button revealed on swipe */}
      <View style={styles.deleteReveal}>
        <Ionicons name="trash" size={22} color="#fff" />
      </View>

      <GestureDetector gesture={pan}>
        <Reanimated.View style={[styles.sessionCard, animStyle]}>
          <View style={[styles.sessionColorBar, { backgroundColor: color, shadowColor: color }]} />
          <View style={styles.sessionLeft}>
            <View style={styles.sessionDateBox}>
              <Text style={{ fontSize: FontSize.xl, fontFamily: FontFamily.bodyBlack, color: Colors.iconActive }}>
                {date.getDate()}
              </Text>
              <Text style={{ fontSize: FontSize.xs, color: Colors.iconInactive }}>{getMonthLabel(date)}</Text>
            </View>
          </View>
          <View style={styles.sessionRight}>
            <Text semibold style={{ marginBottom: 2, fontSize: FontSize.lg }}>{session.routineName}</Text>
            <Text style={{ fontSize: FontSize.xs, marginBottom: Spacing.sm, color: Colors.iconInactive }}>
              {timeLabel} • {dateLabel}
            </Text>
            <View style={styles.sessionStats}>
              {session.duration != null && (
                <View style={styles.sessionStat}>
                  <Ionicons name="time-outline" size={12} color={Colors.iconInactive} />
                  <Text style={{ fontSize: FontSize.xs, marginLeft: 3, color: Colors.iconInactive }}>
                    {formatDuration(session.duration)}
                  </Text>
                </View>
              )}
              {session.totalSets != null && (
                <View style={styles.sessionStat}>
                  <Ionicons name="layers-outline" size={12} color={Colors.iconInactive} />
                  <Text style={{ fontSize: FontSize.xs, marginLeft: 3, color: Colors.iconInactive }}>
                    {session.totalSets} sets
                  </Text>
                </View>
              )}
              {session.totalVolume != null && session.totalVolume > 0 && (
                <View style={styles.sessionStat}>
                  <Ionicons name="barbell-outline" size={12} color={Colors.iconInactive} />
                  <Text style={{ fontSize: FontSize.xs, marginLeft: 3, color: Colors.iconInactive }}>
                    {session.totalVolume.toLocaleString()} kg
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
};

// ─── Clear All Modal ──────────────────────────────────────────────────────────

const ClearAllModal: React.FC<{ visible: boolean; onConfirm: () => void; onCancel: () => void }> = ({
  visible, onConfirm, onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalBox}>
        <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: Spacing.md }}>🗑️</Text>
        <Text variant="h4" center style={{ marginBottom: Spacing.sm }}>Clear All History?</Text>
        <Text color="secondary" center style={{ marginBottom: Spacing.xl, lineHeight: 20 }}>
          This will permanently delete all your workout sessions. This action cannot be undone.
        </Text>
        <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
          <Text style={{ color: '#fff', fontFamily: FontFamily.bodyBold }}>Yes, Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel}>
          <Text color="secondary">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─── Awards ───────────────────────────────────────────────────────────────────

const AWARDS = [
  { id: 'first', emoji: '🥇', title: 'First Workout', desc: 'Completed your first workout' },
  { id: 'streak3', emoji: '🔥', title: '3-Day Streak', desc: 'Work out 3 days in a row' },
  { id: 'week', emoji: '📅', title: 'Full Week', desc: 'Complete 7 workouts in a week' },
  { id: 'volume', emoji: '⚡', title: 'Volume King', desc: 'Lift 10,000 kg total' },
  { id: 'century', emoji: '💯', title: 'Century', desc: 'Log 100 workouts' },
  { id: 'month', emoji: '🏆', title: '30-Day Champion', desc: 'Work out every day for 30 days' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Period = 'week' | 'month' | 'year';

export default function HistoryScreen() {
  const sessions = useStore((s) => s.sessions);
  const routines = useStore((s) => s.routines);
  const deleteSession = useStore((s) => s.deleteSession);
  const clearHistory = useStore((s) => s.clearHistory);
  const exercisePRs = useStore(selectExercisePRs);
  const customExercises = useStore(selectCustomExercises);
  const prExerciseIds = Object.keys(exercisePRs);

  const routineColorById = useMemo(() => {
    const map = new Map<string, string>();
    routines.forEach((r) => map.set(r.id, r.color || Colors.iconActive));
    return map;
  }, [routines]);
  const colorForSession = (session: WorkoutSession) =>
    (session.routineId && routineColorById.get(session.routineId)) || Colors.iconActive;

  const [period, setPeriod] = useState<Period>('week');
  const [tab, setTab] = useState<'log' | 'stats' | 'strength' | 'awards'>('log');
  const [selectedStrengthEx, setSelectedStrengthEx] = useState<string | null>(prExerciseIds[0] || null);
  const [showClearModal, setShowClearModal] = useState(false);
  const { show: showToast, ToastComponent } = useToast();

  const now = new Date();
  const periodSessions = useMemo(() => {
    const cutoff = new Date();
    if (period === 'week') cutoff.setDate(now.getDate() - 7);
    else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
    else cutoff.setFullYear(now.getFullYear() - 1);
    return sessions.filter((s) => new Date(s.startedAt) >= cutoff);
  }, [sessions, period]);

  const totalVolume = periodSessions.reduce((acc, s) => acc + (s.totalVolume ?? 0), 0);
  const totalDuration = periodSessions.reduce((acc, s) => acc + (s.duration ?? 0), 0);
  const workoutCount = periodSessions.length;
  const periodTarget = period === 'week' ? 5 : period === 'month' ? 20 : 200;
  const progress = Math.min(workoutCount / periodTarget, 1);

  const totalVolumeAll = sessions.reduce((acc, s) => acc + (s.totalVolume ?? 0), 0);

  const unlockedAwards = AWARDS.map((a) => ({
    ...a,
    unlocked:
      (a.id === 'first' && sessions.length >= 1) ||
      (a.id === 'week' && workoutCount >= 7) ||
      (a.id === 'volume' && totalVolumeAll >= 10000) ||
      (a.id === 'century' && sessions.length >= 100) ||
      false,
  }));

  const handleDelete = (id: string) => {
    deleteSession(id);
    showToast('Session deleted');
  };

  const handleClearAll = () => {
    setShowClearModal(false);
    clearHistory();
    showToast('History cleared');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.historyTitle}>History</Text>
        <View style={styles.headerActions}>
          {sessions.length > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowClearModal(true)}>
              <Ionicons name="trash-outline" size={18} color={Colors.iconInactive} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => Alert.alert('Calendar', 'The workout calendar and scheduling feature is coming soon!')}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.iconInactive} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Period selector */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'year'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodLabel, { color: period === p ? '#06070D' : Colors.iconInactive }]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overview */}
        <View style={styles.overviewCard}>
          <LinearGradient
            colors={['#1C1330', '#0A1F2B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <GlowOrb size={150} color="rgba(0,209,255,0.22)" style={{ top: -50, right: -40 }} />
          <View style={styles.overviewTop}>
            <ProgressRing size={86} strokeWidth={8} progress={progress}
              color={Colors.iconActive} bgColor="rgba(255,255,255,0.08)">
              <Text style={{ fontFamily: FontFamily.bodyBold, fontSize: 18, color: Colors.textPrimary, lineHeight: 20 }}>
                {workoutCount}
              </Text>
              <Text style={{ fontFamily: FontFamily.body, fontSize: 10, color: Colors.iconInactive, marginTop: 1 }}>
                / {periodTarget}
              </Text>
            </ProgressRing>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatNumber}>{workoutCount}</Text>
                <Text style={{ fontSize: FontSize.xs, color: Colors.iconInactive }}>Workouts</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={[styles.overviewStatNumber, { color: Colors.textPrimary }]}>{formatDuration(totalDuration)}</Text>
                <Text style={{ fontSize: FontSize.xs, color: Colors.iconInactive }}>Total Time</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={[styles.overviewStatNumber, { color: Colors.textPrimary }]}>{(totalVolume / 1000).toFixed(1)}t</Text>
                <Text style={{ fontSize: FontSize.xs, color: Colors.iconInactive }}>Volume</Text>
              </View>
            </View>
          </View>
          <WeeklyBar sessions={sessions} />
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {(['log', 'stats', 'strength', 'awards'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}>
              <Text style={{
                color: tab === t ? Colors.iconActive : Colors.iconInactive,
                fontFamily: tab === t ? FontFamily.bodyBold : FontFamily.body,
                fontSize: FontSize.md,
              }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Log tab */}
        {tab === 'log' && (
          <>
            {sessions.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: Spacing.md }}>📊</Text>
                <Text variant="h4" center style={{ marginBottom: Spacing.sm }}>No Workouts Yet</Text>
                <Text color="secondary" center>Complete your first workout to see your history here.</Text>
              </View>
            ) : (
              <>
                <Text color="muted" style={{ fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
                  ← Swipe left to delete
                </Text>
                {periodSessions.map((session) => (
                  <SwipeableSessionCard
                    key={session.id}
                    session={session}
                    color={colorForSession(session)}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            )}
            {sessions.length > 0 && periodSessions.length === 0 && (
              <View style={styles.emptyHistory}>
                <Text color="secondary" center>No workouts in this period</Text>
              </View>
            )}
          </>
        )}

        {/* Stats tab */}
        {tab === 'stats' && (
          <Card style={{ marginHorizontal: 0 }}>
            <Text semibold style={{ marginBottom: Spacing.md }}>Monthly Summary</Text>
            {[
              { label: 'Avg Duration', value: totalDuration > 0 ? formatDuration(Math.floor(totalDuration / Math.max(workoutCount, 1))) : '—', icon: '⏱' },
              { label: 'Longest Session', value: sessions.length > 0 ? formatDuration(Math.max(...sessions.map((s) => s.duration ?? 0))) : '—', icon: '🏆' },
              { label: 'Total Exercises', value: `${sessions.reduce((acc, s) => acc + s.exercises.length, 0)}`, icon: '🏋️' },
              { label: 'Total Volume', value: `${(totalVolumeAll / 1000).toFixed(1)}t`, icon: '⚡' },
            ].map((stat) => (
              <View key={stat.label} style={styles.summaryRow}>
                <Text style={{ fontSize: 20, marginRight: Spacing.md }}>{stat.icon}</Text>
                <Text color="secondary" style={{ flex: 1 }}>{stat.label}</Text>
                <Text semibold>{stat.value}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Strength tab */}
        {tab === 'strength' && (
          <Card style={{ marginHorizontal: 0 }}>
            <Text semibold style={{ marginBottom: Spacing.md }}>Strength Progress (1RM)</Text>
            {prExerciseIds.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text color="secondary" center>Complete a workout to track your 1RM progression.</Text>
              </View>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                  {prExerciseIds.map(id => {
                    const exInfo = findExerciseById(id, customExercises);
                    const name = exInfo ? exInfo.name : id;
                    const isActive = selectedStrengthEx === id;
                    return (
                      <TouchableOpacity 
                        key={id} 
                        onPress={() => setSelectedStrengthEx(id)}
                        style={[styles.exercisePill, isActive && styles.exercisePillActive]}
                      >
                        <Text style={{ color: isActive ? '#000' : Colors.textPrimary, fontSize: FontSize.sm, fontFamily: isActive ? FontFamily.bodyBold : FontFamily.bodyMedium }}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                
                {selectedStrengthEx && (
                  <View>
                    <View style={styles.prHeader}>
                      <Text color="muted">Current 1RM PR</Text>
                      <Text variant="h3" color="accent">{exercisePRs[selectedStrengthEx].oneRM} kg</Text>
                      <Text color="muted" style={{ fontSize: FontSize.xs }}>
                        Best Set: {exercisePRs[selectedStrengthEx].weight}kg × {exercisePRs[selectedStrengthEx].reps}
                      </Text>
                    </View>
                    <LineChart 
                      data={getExercise1RMHistory(useStore.getState(), selectedStrengthEx)} 
                      unit="kg"
                    />
                  </View>
                )}
              </>
            )}
          </Card>
        )}

        {/* Awards tab */}
        {tab === 'awards' && (
          <View style={styles.awardsGrid}>
            {unlockedAwards.map((award) => {
              const glowColor = award.id === 'first' ? Colors.iconPremiumGold
                : award.id === 'streak3' ? Colors.iconActive
                : null;
              return (
                <View
                  key={award.id}
                  style={[
                    styles.awardCard,
                    !award.unlocked && styles.awardLocked,
                    award.unlocked && glowColor && {
                      borderColor: `${glowColor}4D`,
                      shadowColor: glowColor,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 14,
                      elevation: 4,
                    },
                  ]}
                >
                  {award.id === 'first' ? (
                    <SvgXml xml={AWARD_SVG} width={36} height={36} style={{ marginBottom: Spacing.sm, opacity: award.unlocked ? 1 : 0.3 }} />
                  ) : award.id === 'streak3' ? (
                    <SvgXml xml={STREAK_SVG} width={36} height={36} style={{ marginBottom: Spacing.sm, opacity: award.unlocked ? 1 : 0.3 }} />
                  ) : (
                    <Text style={[styles.awardEmoji, !award.unlocked && { opacity: 0.3 }]}>{award.emoji}</Text>
                  )}
                  <Text semibold style={[styles.awardTitle, { color: award.unlocked ? Colors.textPrimary : Colors.iconInactive }]}>
                    {award.title}
                  </Text>
                  <Text style={[styles.awardDesc, { color: award.unlocked ? Colors.iconInactive : Colors.textDisabled }]}>
                    {award.desc}
                  </Text>
                  {!award.unlocked && (
                    <Ionicons name="lock-closed" size={14} color={Colors.iconInactive} style={{ marginTop: Spacing.xs }} />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Toast */}
      <ToastComponent />

      {/* Clear All Modal */}
      <ClearAllModal
        visible={showClearModal}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  historyTitle: {
    fontSize: 34,
    fontFamily: FontFamily.display,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.iconPanel,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(150,151,190,0.2)',
  },
  periodSelector: {
    flexDirection: 'row', marginHorizontal: Spacing.lg, backgroundColor: Colors.iconPanel,
    borderRadius: Radius.md, padding: 4, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(150,151,190,0.2)',
  },
  periodBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.sm, alignItems: 'center' },
  periodBtnActive: { backgroundColor: Colors.iconActive },
  periodLabel: { fontSize: FontSize.md, fontFamily: FontFamily.bodyBold },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['6xl'] },
  overviewCard: {
    marginBottom: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.3)',
    shadowColor: Colors.iconActive,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  overviewTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, marginBottom: Spacing.md },
  overviewStats: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  overviewStat: { alignItems: 'center' },
  overviewStatNumber: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 22,
    color: Colors.iconActive,
  },
  overviewDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  weekBar: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: { alignItems: 'center', gap: 4 },
  weekDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)' },
  weekDotActive: {
    backgroundColor: Colors.iconActive,
    shadowColor: Colors.iconActive,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.iconPanel, borderRadius: Radius.md,
    padding: 3, marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(150,151,190,0.2)',
  },
  tabBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center' },
  tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.06)' },

  // Swipeable card
  swipeContainer: { marginBottom: Spacing.sm, borderRadius: Radius.lg, overflow: 'hidden' },
  deleteReveal: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: SWIPE_THRESHOLD,
    backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  sessionCard: {
    flexDirection: 'row', alignItems: 'stretch', backgroundColor: Colors.iconPanel,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  sessionColorBar: {
    width: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  sessionLeft: {
    padding: Spacing.md,
    alignItems: 'center', justifyContent: 'center', minWidth: 60,
  },
  sessionDateBox: { alignItems: 'center' },
  sessionRight: { flex: 1, padding: Spacing.md },
  sessionStats: { flexDirection: 'row', gap: Spacing.md },
  sessionStat: { flexDirection: 'row', alignItems: 'center' },

  emptyHistory: { paddingVertical: Spacing['4xl'], alignItems: 'center' },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  awardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  awardCard: {
    flex: 1, minWidth: (SCREEN_W - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.iconPanel, borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(150,151,190,0.15)', alignItems: 'center',
  },
  awardLocked: { opacity: 0.45 },
  awardEmoji: { fontSize: 36, marginBottom: Spacing.sm },
  awardTitle: { fontSize: FontSize.sm, fontFamily: FontFamily.bodyBold, textAlign: 'center', marginBottom: 4 },
  awardDesc: { fontSize: FontSize.xs, textAlign: 'center', lineHeight: 16 },

  // Toast
  toast: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    backgroundColor: Colors.accent, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderRadius: Radius.full, ...Shadow.accentGlow,
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  modalBox: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.xl, width: '100%', borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  modalConfirmBtn: {
    backgroundColor: '#FF3B30', paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl, borderRadius: Radius.md,
    width: '100%', alignItems: 'center', marginBottom: Spacing.md,
  },
  modalCancelBtn: {
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md, width: '100%', alignItems: 'center',
  },
  exercisePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard2,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exercisePillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  prHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard2,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
});
