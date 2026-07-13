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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { TAB_BAR_HEIGHT } from './_layout';
import { Icon } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import Svg, { Polyline, Line, Circle, SvgXml } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, { useAnimatedStyle, withSpring, useSharedValue, runOnJS } from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontFamily, withAlpha } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Button } from '@/components/ui/Button';
import { FadeInView } from '@/components/ui/FadeInView';
import { EMPTY_STATE_SVG } from '@/components/ui/designIcons';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import type { BodyMeasure } from '@/store';
import { getDisplayWeight, getInputWeightInKg } from '@/lib/unit';
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
  const weightUnit = useStore((s) => s.settings.weightUnit);

  const handleSave = () => {
    const measure: Omit<BodyMeasure, 'id'> = {
      date: new Date().toISOString(),
      unit: 'metric',
    };

    MEASURE_FIELDS.forEach(({ key }) => {
      let v = parseFloat(values[key as string] ?? '');
      if (!isNaN(v) && v > 0) {
        if (key === 'weight') {
          v = getInputWeightInKg(v, weightUnit);
        }
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
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Icon name="close" size={24} color={Colors.textSecondary} />
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
                      {key === 'weight' ? weightUnit : unit}
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

const LOG_REVEAL_WIDTH = 84;

const MeasureLogItem: React.FC<{
  m: BodyMeasure;
  isOpen: boolean;
  haptics?: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
}> = ({ m, isOpen, haptics, onOpen, onClose, onDelete }) => {
  const weightUnit = useStore((s) => s.settings.weightUnit);
  const tx = useSharedValue(0);
  const startX = useSharedValue(0);

  React.useEffect(() => {
    tx.value = withSpring(isOpen ? -LOG_REVEAL_WIDTH : 0, { damping: 18, stiffness: 220 });
  }, [isOpen]);

  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      startX.value = tx.value;
    })
    .onUpdate((e) => {
      tx.value = Math.min(0, Math.max(-LOG_REVEAL_WIDTH, startX.value + e.translationX));
    })
    .onEnd(() => {
      if (tx.value < -LOG_REVEAL_WIDTH / 2) {
        tx.value = withSpring(-LOG_REVEAL_WIDTH, { damping: 18, stiffness: 220 });
        runOnJS(onOpen)();
      } else {
        tx.value = withSpring(0, { damping: 18, stiffness: 220 });
        runOnJS(onClose)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  const handleLongPress = () => {
    if (haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onOpen();
  };

  const handleDelete = () => {
    if (haptics) {
      Haptics.selectionAsync().catch(() => {});
    }
    onDelete();
  };

  return (
    <View style={styles.logEntryContainer}>
      <View style={styles.logEntryDeleteBg}>
        <TouchableOpacity style={styles.logEntryDeleteBtn} onPress={handleDelete} hitSlop={8}>
          <Icon name="trash" size={20} color={Colors.textOnDark} />
          <Text style={styles.logEntryDeleteLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={pan}>
        <Reanimated.View style={[styles.logEntryForeground, animatedStyle]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={handleLongPress}
            delayLongPress={280}
            onPress={() => {
              if (isOpen) onClose();
            }}
            style={{ padding: Spacing.md }}
          >
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
                const displayVal = field.key === 'weight' ? getDisplayWeight(val, weightUnit) : val;
                const displayUnit = field.key === 'weight' ? weightUnit : field.unit;
                return (
                  <Text key={field.key} style={{ fontSize: FontSize.sm }}>
                    {field.icon} {displayVal} {displayUnit}
                  </Text>
                );
              }
              return null;
            })}
          </View>
          </TouchableOpacity>
        </Reanimated.View>
      </GestureDetector>
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
  const weightUnit = useStore((s) => s.settings.weightUnit);

  const convertedValues = React.useMemo(() => {
    if (label.toLowerCase() === 'weight') {
      return values.map(v => getDisplayWeight(v, weightUnit));
    }
    return values;
  }, [values, label, weightUnit]);

  if (values.length === 0) return null;

  const latest = convertedValues[convertedValues.length - 1];
  const previous = convertedValues[convertedValues.length - 2];
  const change = previous != null ? latest - previous : null;
  const isPositive = change != null && change > 0;
  const displayUnit = label.toLowerCase() === 'weight' ? weightUnit : unit;

  return (
    <View style={styles.measureRow}>
      <Text style={{ fontSize: 22, marginRight: Spacing.md }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary }}>{label}</Text>
        <View style={styles.measureValueRow}>
          <Text semibold style={{ fontSize: FontSize.lg }}>
            {latest} {displayUnit}
          </Text>
          {change != null && (
            <Text
              style={{
                fontSize: FontSize.xs,
                color: isPositive ? Colors.warning : Colors.success,
                marginLeft: Spacing.sm,
              }}
            >
              {isPositive ? '+' : ''}{change.toFixed(1)} {displayUnit}
            </Text>
          )}
        </View>
      </View>
      {convertedValues.length >= 2 && <MiniLineChart values={convertedValues} color={color} />}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MeasuresScreen() {
  const insets = useSafeAreaInsets();
  const measures = useStore(useShallow(s => s.measures.filter((m) => !m.deletedAt)));
  const addMeasure = useStore(s => s.addMeasure);
  const deleteMeasure = useStore(s => s.deleteMeasure);
  const hapticsEnabled = useStore(s => s.settings.hapticFeedback);
  const weightUnit = useStore(s => s.settings.weightUnit);

  const [showModal, setShowModal] = useState(false);
  const [openLogId, setOpenLogId] = useState<string | null>(null);

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
  const convertedWeightSeries = React.useMemo(() => {
    return weightSeries.map(w => getDisplayWeight(w, weightUnit));
  }, [weightSeries, weightUnit]);
  const hasData = measures.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">Measures</Text>
        <GlassSurface
          radius={20}
          accent
          strong
          onPress={() => setShowModal(true)}
          style={styles.addBtn}
        >
          <Icon name="add" size={22} color={Colors.accent} />
        </GlassSurface>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + Spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!hasData ? (
          <>
            <FadeInView style={styles.emptyState}>
              <Reanimated.View style={styles.emptyIconBadge}>
                <LinearGradient
                  colors={[withAlpha(Colors.iconActive, 0.12), withAlpha(Colors.iconCinematicViolet, 0.1)]}
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
            </FadeInView>

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
            </View>

            {/* Weight trend card */}
            {convertedWeightSeries.length > 0 && (
              <GradientCard style={styles.weightCard}>
                <View style={styles.weightHeader}>
                  <Text semibold>Weight</Text>
                  <Text variant="h3" color="accent">
                    {convertedWeightSeries[convertedWeightSeries.length - 1]} {weightUnit}
                  </Text>
                </View>
                {convertedWeightSeries.length > 1 && (
                  <View style={{ marginTop: Spacing.sm }}>
                    <Text color="muted" style={{ fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
                      Progress chart
                    </Text>
                    {/* Simple bar representation */}
                    <View style={styles.miniChartWrap}>
                      <MiniLineChart values={convertedWeightSeries} />
                    </View>
                  </View>
                )}
              </GradientCard>
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
                isOpen={openLogId === m.id}
                haptics={hapticsEnabled}
                onOpen={() => setOpenLogId(m.id)}
                onClose={() => setOpenLogId((cur) => (cur === m.id ? null : cur))}
                onDelete={() => {
                  deleteMeasure(m.id);
                  setOpenLogId(null);
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
    borderColor: withAlpha(Colors.iconActive, 0.3),
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
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: Colors.error,
    overflow: 'hidden',
  },
  logEntryDeleteBg: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  logEntryDeleteBtn: {
    width: LOG_REVEAL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 2,
  },
  logEntryDeleteLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textOnDark,
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
