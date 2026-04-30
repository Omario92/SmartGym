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
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(' ');

  const lastX = ((values.length - 1) / (values.length - 1)) * W;
  const lastY = H - ((values[values.length - 1] - min) / range) * H;

  return (
    <Svg width={W} height={H + 4}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={lastX} cy={lastY} r={4} fill={color} />
    </Svg>
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

  const [showModal, setShowModal] = useState(false);

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
            <EmptyState
              icon="📏"
              title="No Measurements Yet"
              subtitle="Start tracking your body measurements to monitor your transformation over time."
              action={{ label: '+ Add Measurements', onPress: () => setShowModal(true) }}
            />

            {/* Info card */}
            <Card style={styles.infoCard}>
              <Text semibold style={{ marginBottom: Spacing.sm }}>
                📊 Why Track Measurements?
              </Text>
              <Text color="secondary" style={{ lineHeight: 20, marginBottom: Spacing.md }}>
                The scale doesn't tell the whole story. Body measurements give you a complete picture of your body composition changes.
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
              <View key={m.id} style={styles.logEntry}>
                <Text color="muted" style={{ fontSize: FontSize.sm }}>
                  {new Date(m.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <View style={styles.logValues}>
                  {m.weight && (
                    <Text style={{ fontSize: FontSize.sm }}>⚖️ {m.weight} kg</Text>
                  )}
                  {m.bodyFat && (
                    <Text style={{ fontSize: FontSize.sm }}>📊 {m.bodyFat}%</Text>
                  )}
                  {m.chest && (
                    <Text style={{ fontSize: FontSize.sm }}>💪 {m.chest} cm</Text>
                  )}
                </View>
              </View>
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
  logEntry: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
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
