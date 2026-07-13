/**
 * AI Exercise Fill Button — Feature 2
 * Drop-in button for exercise creation forms.
 * On press, calls Gemini to auto-fill description, instructions, tips, etc.
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { Colors, Spacing, Radius, FontSize, FontFamily, Shadow } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/store';
import { generateExerciseFill } from '@/services/ai/aiService';
import type { AIExerciseFill, AIServiceError } from '@/services/ai/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AIExerciseFillButtonProps {
  exerciseName: string;
  muscleGroup: string;
  equipment: string;
  onFill: (data: AIExerciseFill) => void;
  disabled?: boolean;
}

// ─── Result Preview Modal ─────────────────────────────────────────────────────

const FillPreviewModal: React.FC<{
  visible: boolean;
  data: AIExerciseFill | null;
  onApply: () => void;
  onClose: () => void;
}> = ({ visible, data, onApply, onClose }) => {
  if (!data) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 14 }}>✦</Text>
            </View>
            <Text semibold style={{ fontSize: FontSize.lg }}>AI Generated Content</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.previewScroll}>
          <Badge label="AI Generated" variant="accent" style={{ alignSelf: 'flex-start', marginBottom: Spacing.lg }} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text color="secondary" style={styles.sectionText}>{data.description}</Text>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Step-by-Step Instructions</Text>
            {data.instructions.map((step, i) => (
              <View key={i} style={styles.listRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <Text color="secondary" style={styles.listText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pro Tips</Text>
            {data.tips.map((tip, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={{ color: Colors.accent, marginRight: Spacing.sm, marginTop: 2 }}>✓</Text>
                <Text color="secondary" style={styles.listText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Common mistakes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Common Mistakes</Text>
            {data.common_mistakes.map((m, i) => (
              <View key={i} style={styles.listRow}>
                <Icon name="warning-outline" size={14} color={Colors.warning} style={{ marginRight: Spacing.sm, marginTop: 2 }} />
                <Text color="secondary" style={styles.listText}>{m}</Text>
              </View>
            ))}
          </View>

          {/* Breathing */}
          {data.breathing ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Breathing</Text>
              <View style={styles.breathingCard}>
                <Icon name="fitness-outline" size={16} color={Colors.info} />
                <Text color="secondary" style={[styles.sectionText, { marginLeft: Spacing.sm, flex: 1 }]}>
                  {data.breathing}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Variations */}
          {data.variations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Variations</Text>
              <View style={styles.variationsRow}>
                {data.variations.map((v, i) => (
                  <View key={i} style={styles.variationChip}>
                    <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary }}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.modalFooter}>
          <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
          <Button
            title="Apply to Form"
            variant="primary"
            onPress={onApply}
            style={{ flex: 2 }}
            icon={<Icon name="checkmark" size={16} color="#000" />}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Main Button ──────────────────────────────────────────────────────────────

export const AIExerciseFillButton: React.FC<AIExerciseFillButtonProps> = ({
  exerciseName,
  muscleGroup,
  equipment,
  onFill,
  disabled,
}) => {
  const settings = useStore((s) => s.settings);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<AIExerciseFill | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handlePress = async () => {
    if (!settings.isPremium) {
      Alert.alert(
        '✦ Pro Feature',
        'AI Exercise Auto-Fill is available for SmartGym Pro members.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!settings.geminiApiKey) {
      Alert.alert(
        'API Key Required',
        'Please add your Gemini API key in Settings → AI to use this feature.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!exerciseName?.trim()) {
      Alert.alert('Name Required', 'Please enter an exercise name first.');
      return;
    }

    setLoading(true);
    try {
      const result = await generateExerciseFill(
        settings.geminiApiKey,
        exerciseName,
        muscleGroup || 'full_body',
        equipment || 'bodyweight'
      );
      setPreviewData(result);
      setPreviewVisible(true);
    } catch (err) {
      const aiErr = err as AIServiceError;
      Alert.alert('AI Error', aiErr.message ?? 'Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (previewData) {
      onFill(previewData);
      setPreviewVisible(false);
    }
  };

  const isDisabled = disabled || loading;

  return (
    <>
      <TouchableOpacity
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={handlePress}
        activeOpacity={0.75}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.accent} />
        ) : (
          <Text style={{ fontSize: 12 }}>✦</Text>
        )}
        <Text style={styles.buttonText}>
          {loading ? 'Generating...' : 'Auto-Fill with AI'}
        </Text>
        {!loading && <Badge label="PRO" variant="premium" />}
      </TouchableOpacity>

      <FillPreviewModal
        visible={previewVisible}
        data={previewData}
        onApply={handleApply}
        onClose={() => setPreviewVisible(false)}
      />
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accentGlow2,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontFamily: FontFamily.bodyBold,
  },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.bgModal },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accentGlow,
  },

  previewScroll: { padding: Spacing.xl, paddingBottom: Spacing['6xl'] },

  section: { marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: { fontSize: FontSize.sm, lineHeight: 20 },

  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accentGlow,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 1,
  },
  stepNum: { fontSize: 11, fontFamily: FontFamily.bodyBold, color: Colors.accent },
  listText: { fontSize: FontSize.sm, lineHeight: 20, flex: 1 },

  breathingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.info + '15',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },

  variationsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  variationChip: {
    backgroundColor: Colors.bgCard2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },

  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
