import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Pressable, ScrollView, Platform } from 'react-native';
import { Icon } from './Icon';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/lib/theme';
import { Text } from './Text';
import type { OneRMFormula } from '@/lib/1rm';

interface OneRMFormulaModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFormula: OneRMFormula;
  onSelect: (formula: OneRMFormula) => void;
}

const FORMULAS: { id: OneRMFormula; name: string; equation: string; desc: string; tip: string }[] = [
  {
    id: 'epley',
    name: 'Epley (Default)',
    equation: '1RM = w × (1 + r / 30)',
    desc: 'Best for general fitness. The industry standard that scales nicely across low and high reps.',
    tip: '💡 Standard recommendation for most users.',
  },
  {
    id: 'brzycki',
    name: 'Brzycki',
    equation: '1RM = w × (36 / (37 - r))',
    desc: 'Highly accurate for low-reps training. Commonly used for heavy sets under 10 reps.',
    tip: '⚠️ Breaks down if reps exceed 10+.',
  },
  {
    id: 'lombardi',
    name: 'Lombardi',
    equation: '1RM = w × r ^ 0.1',
    desc: 'Conservative estimate. Great for powerlifting, pure strength work, and testing max output.',
    tip: '💡 Favored by raw strength practitioners.',
  },
];

export const OneRMFormulaModal: React.FC<OneRMFormulaModalProps> = ({
  visible,
  onClose,
  selectedFormula,
  onSelect,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <View style={styles.wrapper}>
          <Pressable style={styles.card} pointerEvents="box-none">
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text variant="h4" semibold>1RM Estimate Formula</Text>
                <Text color="secondary" style={styles.subtitle}>
                  Choose the formula to estimate your 1-Rep Max.
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <Icon name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content list */}
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <View style={styles.list}>
                {FORMULAS.map((f) => {
                  const active = selectedFormula === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      activeOpacity={0.85}
                      style={[
                        styles.optionCard,
                        active && styles.optionCardActive,
                      ]}
                      onPress={() => onSelect(f.id)}
                    >
                      <View style={styles.optionHeader}>
                        <View style={styles.radioRow}>
                          <View style={[styles.radioCircle, active && styles.radioCircleActive]}>
                            {active && <View style={styles.radioInner} />}
                          </View>
                          <Text style={[styles.formulaName, active && styles.formulaNameActive]} semibold>
                            {f.name}
                          </Text>
                        </View>
                        <Text style={styles.equation} color={active ? 'accent' : 'secondary'}>
                          {f.equation}
                        </Text>
                      </View>
                      
                      <Text style={styles.desc} color="secondary">
                        {f.desc}
                      </Text>

                      <View style={[styles.tipContainer, active && styles.tipContainerActive]}>
                        <Text style={styles.tipText} color={f.tip.startsWith('⚠️') ? 'warning' : 'secondary'}>
                          {f.tip}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  wrapper: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
    paddingBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: Colors.bgCard2,
    borderRadius: 99,
  },
  scroll: {
    maxHeight: 480,
  },
  list: {
    gap: Spacing.md,
    paddingVertical: 4,
  },
  optionCard: {
    backgroundColor: Colors.bgCard2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  optionCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentGlow2,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  formulaName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  formulaNameActive: {
    color: Colors.textPrimary,
  },
  equation: {
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontSize: FontSize.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.bgCard3,
    borderRadius: Radius.xs,
    overflow: 'hidden',
  },
  desc: {
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginBottom: 10,
  },
  tipContainer: {
    backgroundColor: Colors.bgCard3,
    padding: 8,
    borderRadius: Radius.xs,
  },
  tipContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  tipText: {
    fontSize: FontSize.xs,
  },
});
