/**
 * History Tab — Workout history, stats, progress charts, awards
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/store';
import type { WorkoutSession } from '@/store';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Date helpers ──────────────────────────────────────────────────────────────

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
};

const getDayLabel = (date: Date) =>
  date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short' });

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
          <Text color="muted" style={{ fontSize: FontSize.xs }}>
            {day}
          </Text>
        </View>
      ))}
    </View>
  );
};

// ─── Volume Bar Chart ─────────────────────────────────────────────────────────

const VolumeChart: React.FC<{ sessions: WorkoutSession[] }> = ({ sessions }) => {
  const W = SCREEN_W - Spacing.lg * 2 - Spacing.xl * 2;
  const H = 100;
  const BAR_COUNT = 7;

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (BAR_COUNT - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    const daySessions = sessions.filter((s) => s.startedAt.startsWith(dateStr));
    const volume = daySessions.reduce((acc, s) => acc + (s.totalVolume ?? 0), 0);
    return { label: getDayLabel(date), volume };
  });

  const maxVol = Math.max(...bars.map((b) => b.volume), 1);
  const barW = W / BAR_COUNT - 8;

  return (
    <View style={{ marginTop: Spacing.md }}>
      <Svg width={W} height={H + 20}>
        {bars.map((bar, i) => {
          const barH = Math.max((bar.volume / maxVol) * H, bar.volume > 0 ? 4 : 0);
          const x = i * (W / BAR_COUNT) + 4;
          const y = H - barH;
          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, 0)}
                rx={4}
                fill={bar.volume > 0 ? Colors.accent : Colors.bgCard2}
                opacity={bar.volume > 0 ? 0.9 : 0.5}
              />
              <SvgText
                x={x + barW / 2}
                y={H + 15}
                textAnchor="middle"
                fill={Colors.textMuted}
                fontSize={10}
              >
                {bar.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

// ─── Session Card ─────────────────────────────────────────────────────────────

const SessionCard: React.FC<{ session: WorkoutSession }> = ({ session }) => {
  const date = new Date(session.startedAt);
  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionLeft}>
        <View style={styles.sessionDateBox}>
          <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.accent }}>
            {date.getDate()}
          </Text>
          <Text color="muted" style={{ fontSize: FontSize.xs }}>
            {getMonthLabel(date)}
          </Text>
        </View>
      </View>
      <View style={styles.sessionRight}>
        <Text semibold style={{ marginBottom: 2 }}>
          {session.routineName}
        </Text>
        <Text color="muted" style={{ fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
          {timeLabel} • {dateLabel}
        </Text>
        <View style={styles.sessionStats}>
          {session.duration != null && (
            <View style={styles.sessionStat}>
              <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
              <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 3 }}>
                {formatDuration(session.duration)}
              </Text>
            </View>
          )}
          {session.totalSets != null && (
            <View style={styles.sessionStat}>
              <Ionicons name="layers-outline" size={12} color={Colors.textMuted} />
              <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 3 }}>
                {session.totalSets} sets
              </Text>
            </View>
          )}
          {session.totalVolume != null && session.totalVolume > 0 && (
            <View style={styles.sessionStat}>
              <Ionicons name="barbell-outline" size={12} color={Colors.textMuted} />
              <Text color="muted" style={{ fontSize: FontSize.xs, marginLeft: 3 }}>
                {session.totalVolume.toLocaleString()} kg
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// ─── Awards ───────────────────────────────────────────────────────────────────

const AWARDS = [
  { id: 'first', emoji: '🥇', title: 'First Workout', desc: 'Completed your first workout', unlocked: false },
  { id: 'streak3', emoji: '🔥', title: '3-Day Streak', desc: 'Work out 3 days in a row', unlocked: false },
  { id: 'week', emoji: '📅', title: 'Full Week', desc: 'Complete 7 workouts in a week', unlocked: false },
  { id: 'volume', emoji: '⚡', title: 'Volume King', desc: 'Lift 10,000 kg total', unlocked: false },
  { id: 'century', emoji: '💯', title: 'Century', desc: 'Log 100 workouts', unlocked: false },
  { id: 'month', emoji: '🏆', title: '30-Day Champion', desc: 'Work out every day for 30 days', unlocked: false },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Period = 'week' | 'month' | 'year';

export default function HistoryScreen() {
  const sessions = useStore((s) => s.sessions);
  const [period, setPeriod] = useState<Period>('week');
  const [tab, setTab] = useState<'log' | 'stats' | 'awards'>('log');

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

  const unlockedAwards = [
    ...AWARDS.map((a) => ({
      ...a,
      unlocked:
        (a.id === 'first' && sessions.length >= 1) ||
        (a.id === 'week' && workoutCount >= 7) ||
        false,
    })),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">History</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Period selector */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'year'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodLabel,
                { color: period === p ? '#000' : Colors.textSecondary },
              ]}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress overview */}
        <Card style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <ProgressRing
              size={100}
              strokeWidth={9}
              progress={progress}
              label={`${workoutCount}`}
              sublabel={`/ ${periodTarget}`}
            />
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text variant="h3" color="accent">
                  {workoutCount}
                </Text>
                <Text color="muted" style={{ fontSize: FontSize.xs }}>
                  Workouts
                </Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text variant="h3">{formatDuration(totalDuration)}</Text>
                <Text color="muted" style={{ fontSize: FontSize.xs }}>
                  Total Time
                </Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text variant="h3">{(totalVolume / 1000).toFixed(1)}t</Text>
                <Text color="muted" style={{ fontSize: FontSize.xs }}>
                  Volume
                </Text>
              </View>
            </View>
          </View>

          {/* This week heatmap */}
          <WeeklyBar sessions={sessions} />
        </Card>

        {/* Volume chart */}
        {sessions.length > 0 && (
          <Card style={styles.chartCard}>
            <Text semibold style={{ marginBottom: 4 }}>
              Volume (Last 7 Days)
            </Text>
            <Text color="muted" style={{ fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
              Total weight lifted per day
            </Text>
            <VolumeChart sessions={sessions} />
          </Card>
        )}

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {(['log', 'stats', 'awards'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            >
              <Text
                style={{
                  color: tab === t ? Colors.accent : Colors.textSecondary,
                  fontWeight: tab === t ? FontWeight.semibold : FontWeight.regular,
                  fontSize: FontSize.sm,
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {tab === 'log' && (
          <>
            {sessions.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: Spacing.md }}>
                  📊
                </Text>
                <Text variant="h4" center style={{ marginBottom: Spacing.sm }}>
                  No Workouts Yet
                </Text>
                <Text color="secondary" center>
                  Complete your first workout to see your history here.
                </Text>
              </View>
            ) : (
              periodSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            )}
            {sessions.length > 0 && periodSessions.length === 0 && (
              <View style={styles.emptyHistory}>
                <Text color="secondary" center>
                  No workouts in this period
                </Text>
              </View>
            )}
          </>
        )}

        {tab === 'stats' && (
          <Card style={{ marginHorizontal: 0 }}>
            <Text semibold style={{ marginBottom: Spacing.md }}>
              Monthly Summary
            </Text>
            {[
              { label: 'Best Day', value: 'Monday', icon: '🌟' },
              { label: 'Avg Duration', value: totalDuration > 0 ? formatDuration(Math.floor(totalDuration / Math.max(workoutCount, 1))) : '—', icon: '⏱' },
              { label: 'Longest Session', value: sessions.length > 0 ? formatDuration(Math.max(...sessions.map((s) => s.duration ?? 0))) : '—', icon: '🏆' },
              { label: 'Total Exercises', value: `${sessions.reduce((acc, s) => acc + s.exercises.length, 0)}`, icon: '🏋️' },
            ].map((stat) => (
              <View key={stat.label} style={styles.summaryRow}>
                <Text style={{ fontSize: 20, marginRight: Spacing.md }}>{stat.icon}</Text>
                <Text color="secondary" style={{ flex: 1 }}>
                  {stat.label}
                </Text>
                <Text semibold>{stat.value}</Text>
              </View>
            ))}
          </Card>
        )}

        {tab === 'awards' && (
          <View style={styles.awardsGrid}>
            {unlockedAwards.map((award) => (
              <View
                key={award.id}
                style={[styles.awardCard, !award.unlocked && styles.awardLocked]}
              >
                <Text style={[styles.awardEmoji, !award.unlocked && { opacity: 0.3 }]}>
                  {award.emoji}
                </Text>
                <Text
                  semibold
                  style={[
                    styles.awardTitle,
                    { color: award.unlocked ? Colors.textPrimary : Colors.textDisabled },
                  ]}
                >
                  {award.title}
                </Text>
                <Text
                  style={[
                    styles.awardDesc,
                    { color: award.unlocked ? Colors.textSecondary : Colors.textDisabled },
                  ]}
                >
                  {award.desc}
                </Text>
                {!award.unlocked && (
                  <Ionicons
                    name="lock-closed"
                    size={14}
                    color={Colors.textDisabled}
                    style={{ marginTop: Spacing.xs }}
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: Colors.accent },
  periodLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['6xl'] },

  // Overview card
  overviewCard: { marginBottom: Spacing.md },
  overviewTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, marginBottom: Spacing.md },
  overviewStats: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  overviewStat: { alignItems: 'center' },
  overviewDivider: { width: 1, height: 36, backgroundColor: Colors.border },

  // Week heatmap
  weekBar: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: { alignItems: 'center', gap: 4 },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.bgCard2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekDotActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    ...Shadow.accentGlow,
  },

  // Chart card
  chartCard: { marginBottom: Spacing.md },

  // Tab row
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.bgCard2 },

  // Session cards
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sessionLeft: {
    padding: Spacing.md,
    backgroundColor: Colors.bgCard2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  sessionDateBox: { alignItems: 'center' },
  sessionRight: { flex: 1, padding: Spacing.md },
  sessionStats: { flexDirection: 'row', gap: Spacing.md },
  sessionStat: { flexDirection: 'row', alignItems: 'center' },

  // Empty
  emptyHistory: {
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
  },

  // Stats
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },

  // Awards
  awardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  awardCard: {
    flex: 1,
    minWidth: (SCREEN_W - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  awardLocked: { borderColor: Colors.bgCard3 },
  awardEmoji: { fontSize: 36, marginBottom: Spacing.sm },
  awardTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'center', marginBottom: 4 },
  awardDesc: { fontSize: FontSize.xs, textAlign: 'center', lineHeight: 16 },
});
