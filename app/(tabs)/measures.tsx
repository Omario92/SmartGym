/**
 * Measures Tab — Track body measurements, weight, body fat
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Line, Circle, SvgXml } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, { useAnimatedStyle, withTiming, useSharedValue, FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EMPTY_STATE_SVG } from '@/components/ui/designIcons';
import { useStore } from '@/store';
import type { BodyMeasure } from '@/store';
import { Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Add Measure Modal ────────────────────────────────────────────────────────

const MEASURE_FIELDS: { key: keyof BodyMeasure; label: string; unit: string; icon: string }[] = [
  { key: 'weight', label: 'Weight', unit: 'kg', icon: '⚖️' },
  { key: 'bodyFat', label: 'Body Fat', unit: '%', icon: '📊' },
  { key: 'chest', label: 'Chest', unit: 'cm', icon: '💪' },
  { key: 'waist', label: 'Waist', unit: 'cm', icon: '📏' },
  { key: 'hips', label: 'Hips', unit: 'cm', icon: '🍑' },
  { key: 'arms', label: 'Arms', unit: 'cm', icon: '💪' },
  { key: 'thighs', label: 'Thighs', unit: 'cm', icon: '🦵' },
  { key: 'calves', label: 'Calves', unit: 'cm', icon: '🦵' },
  { key: 'shoulders', label: 'Shoulders', unit: 'cm', icon: '🦾' },
];

const AddMeasureModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSave: (measure: Omit<BodyMeasure, 'id'>) => void;
}> = ({ visible, onClose, onSave }) => {
  const [values, setValues] = useState<Partial<Record<string, string>>>({});

  const handleSave = () => {
    const measure: Omit<BodyMeasure, 'id'> = {
      date: new Date().toISOString(),
      unit: 'metric',
    };

    MEASURE_FIELDS.forEach(({ key }) => {
      const v = parseFloat(values[key as string] ?? '');
      if (!isNaN(v) && v > 0) {
        (measure as any)[key] = v;
      }
    });

    const hasData = MEASURE_FIELDS.some(({ key }) => (measure as any)[key] != null);
    if (!hasData) {
      Alert.alert('No Data', 'Please enter at least one measurement.');
      return;
    }

    onSave(measure);
    setValues({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.bgModal }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text variant="h4">Add Measurements</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text color="secondary" style={{ marginBottom: Spacing.xl }}>
              Enter any measurements you want to track today.
            </Text>

            {MEASURE_FIELDS.map(({ key, label, unit, icon }) => (
              <View key={key as string} style={styles.fieldRow}>
                <Text style={{ fontSize: 22, marginRight: Spacing.md }}>{icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 }}>
                    {label}
                  </Text>
                  <View style={styles.fieldInput}>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                      value={values[key as string] ?? ''}
                      onChangeText={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
                    />
                    <Text color="muted" style={{ fontSize: FontSize.sm }}>
                      {unit}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Save" variant="primary" onPress={handleSave} style={{ flex: 2 }} />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Mini Line Chart ──────────────────────────────────────────────────────────

const MiniLineChart: React.FC<{ values: number[]; color?: string }> = ({
  values,
  color = Colors.accent,
}) => {
  if (values.length < 2) return null;
  const W = SCREEN_W - Spacing.lg * 4 - Spacing.xl * 2 - 80;
  const H = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xMaxIndex = Math.max(9, values.length - 1);

  const points = values
    .map((v, i) => {
      const x = (i / xMaxIndex) * W;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(' ');

  const lastX = ((values.length - 1) / xMaxIndex) * W;
  const lastY = H - ((values[values.length - 1] - min) / range) * H;

  return (
    <Svg width={W} height={H + 4}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={lastX} cy={lastY} r={4} fill={color} />
    </Svg>
  );
};

// ─── Measure Log Item ──────────────────────────────────────────────────────────

const MeasureLogItem: React.FC<{
  m: BodyMeasure;
  isDeleting: boolean;
  onLongPress: () => void;
  onPress: () => void;
  onDelete: () => void;
}> = ({ m, isDeleting, onLongPress, onPress, onDelete }) => {
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    translateX.value = withTiming(isDeleting ? -80 : 0, { duration: 250 });
  }, [isDeleting]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.logEntryContainer}>
      <View style={styles.logEntryDeleteBg}>
        <TouchableOpacity style={styles.logEntryDeleteBtn} onPress={onDelete}>
          <Ionicons name="trash" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Reanimated.View style={[styles.logEntryForeground, animatedStyle]}>
        <TouchableOpacity activeOpacity={1} onLongPress={onLongPress} onPress={onPress} style={{ padding: Spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text color="muted" style={{ fontSize: FontSize.sm }}>
              {new Date(m.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.logValues}>
            {MEASURE_FIELDS.map((field) => {
              const val = (m as any)[field.key];
              if (val != null) {
                return (
                  <Text key={field.key} style={{ fontSize: FontSize.sm }}>
                    {field.icon} {val} {field.unit}
                  </Text>
                );
              }
              return null;
            })}
          </View>
        </TouchableOpacity>
      </Reanimated.View>
    </View>
  );
};

// ─── Measure Row ──────────────────────────────────────────────────────────────

const MeasureRow: React.FC<{
  label: string;
  icon: string;
  values: number[];
  unit: string;
  color?: string;
}> = ({ label, icon, values, unit, color }) => {
  if (values.length === 0) return null;
  const latest = values[values.length - 1];
  const previous = values[values.length - 2];
  const change = previous != null ? latest - previous : null;
  const isPositive = change != null && change > 0;

  return (
    <View style={styles.measureRow}>
      <Text style={{ fontSize: 22, marginRight: Spacing.md }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary }}>{label}</Text>
        <View style={styles.measureValueRow}>
          <Text semibold style={{ fontSize: FontSize.lg }}>
            {latest} {unit}
          </Text>
          {change != null && (
            <Text
              style={{
                fontSize: FontSize.xs,
                color: isPositive ? Colors.warning : Colors.success,
                marginLeft: Spacing.sm,
              }}
            >
              {isPositive ? '+' : ''}{change.toFixed(1)} {unit}
            </Text>
          )}
        </View>
      </View>
      {values.length >= 2 && <MiniLineChart values={values} color={color} />}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MeasuresScreen() {
  const measures = useStore(s => s.measures);
  const addMeasure = useStore(s => s.addMeasure);
  const deleteMeasure = useStore(s => s.deleteMeasure);

  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = (measure: Omit<BodyMeasure, 'id'>) => {
    addMeasure({ ...measure, id: Date.now().toString() });
  };

  // Build time series for each measurement
  const buildSeries = (key: keyof BodyMeasure) =>
    measures
      .slice()
      .reverse()
      .map((m) => (m as any)[key] as number | undefined)
      .filter((v): v is number => v != null);

  const weightSeries = buildSeries('weight');
  const hasData = measures.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">Measures</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasData ? (
          <>
            <Reanimated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
              <Reanimated.View entering={FadeInDown.duration(400).delay(50)} style={styles.emptyIconBadge}>
                <LinearGradient
                  colors={['rgba(0,245,160,0.12)', 'rgba(139,92,255,0.10)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <SvgXml xml={EMPTY_STATE_SVG} width={56} height={56} />
              </Reanimated.View>
              <Text variant="h4" center style={styles.emptyTitle}>No Measurements Yet</Text>
              <Text color="secondary" center style={styles.emptySubtitle}>
                Start tracking your body measurements to monitor your transformation over time.
              </Text>
              <Button
                title="+ Add Measurements"
                variant="outline"
                onPress={() => setShowModal(true)}
              />
            </Reanimated.View>

            {/* Info card */}
            <Card style={styles.infoCard}>
              <Text semibold style={{ marginBottom: Spacing.sm }}>
                📊 Why Track Measurements?
              </Text>
              <Text color="secondary" style={{ lineHeight: 20, marginBottom: Spacing.md }}>
                The scale doesn&apos;t tell the whole story. Body measurements give you a complete picture of your body composition changes.
              </Text>
              {[
                '⚖️ Weight progress over time',
                '📏 Circumference measurements',
                '💪 Body fat percentage',
                '📈 Visual progress charts',
              ].map((f) => (
                <Text key={f} color="secondary" style={{ fontSize: FontSize.sm, marginBottom: 4 }}>
                  {f}
                </Text>
              ))}
            </Card>
          </>
        ) : (
          <>
            {/* Latest date */}
            <View style={styles.latestRow}>
              <Text color="muted" style={{ fontSize: FontSize.sm }}>
                Latest:{' '}
                {new Date(measures[0].date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Button
                title="+ Add"
                variant="outline"
                size="sm"
                onPress={() => setShowModal(true)}
              />
            </View>

            {/* Weight trend card */}
            {weightSeries.length > 0 && (
              <Card style={styles.weightCard} glowing>
                <View style={styles.weightHeader}>
                  <Text semibold>Weight</Text>
                  <Text variant="h3" color="accent">
                    {weightSeries[weightSeries.length - 1]} kg
                  </Text>
                </View>
                {weightSeries.length > 1 && (
                  <View style={{ marginTop: Spacing.sm }}>
                    <Text color="muted" style={{ fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
                      Progress chart
                    </Text>
                    {/* Simple bar representation */}
                    <View style={styles.miniChartWrap}>
                      <MiniLineChart values={weightSeries} />
                    </View>
                  </View>
                )}
              </Card>
            )}

            {/* All measurements */}
            <Card style={styles.measureList}>
              <Text semibold style={{ marginBottom: Spacing.md }}>
                Body Measurements
              </Text>
              {MEASURE_FIELDS.map(({ key, label, unit, icon }) => {
                const series = buildSeries(key);
                return (
                  <MeasureRow
                    key={key as string}
                    label={label}
                    icon={icon}
                    values={series}
                    unit={unit}
                    color={Colors.accent}
                  />
                );
              })}
            </Card>

            {/* Measurement log */}
            <View style={styles.sectionHeader}>
              <Text semibold>Log</Text>
            </View>
            {measures.slice(0, 10).map((m) => (
              <MeasureLogItem
                key={m.id}
                m={m}
                isDeleting={deletingId === m.id}
                onLongPress={() => setDeletingId(m.id)}
                onPress={() => {
                  if (deletingId) setDeletingId(null);
                }}
                onDelete={() => {
                  deleteMeasure(m.id);
                  setDeletingId(null);
                }}
              />
            ))}
          </>
        )}
      </ScrollView>

      <AddMeasureModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing['4xl'],
  },
  emptyIconBadge: {
    width: 96,
    height: 96,
    borderRadius: Radius.xxl + 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.3)',
    shadowColor: Colors.iconActive,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  emptyTitle: { marginBottom: Spacing.sm },
  emptySubtitle: { lineHeight: 22, maxWidth: 280, marginBottom: Spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentGlow2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accentGlow,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['6xl'] },

  infoCard: { marginTop: Spacing.md },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },

  weightCard: { marginBottom: Spacing.md },
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniChartWrap: { height: 50 },

  measureList: { marginBottom: Spacing.md },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  measureValueRow: { flexDirection: 'row', alignItems: 'center' },

  sectionHeader: { marginBottom: Spacing.sm },
  logEntryContainer: {
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: '#FF453A',
    overflow: 'hidden',
  },
  logEntryDeleteBg: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  logEntryDeleteBtn: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  logEntryForeground: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logValues: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.xs },

  // Modal
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalScroll: { padding: Spacing.xl },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
