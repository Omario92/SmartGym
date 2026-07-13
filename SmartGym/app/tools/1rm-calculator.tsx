import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useStore } from '@/store';

// Epley formula: 1RM = Weight * (1 + Reps/30)
// Brzycki formula: 1RM = Weight * (36 / (37 - Reps))
const calculate1RM = (weight: number, reps: number) => {
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
};

export default function OneRMCalculatorScreen() {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const settings = useStore(s => s.settings);
  
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  
  let oneRM = 0;
  if (!isNaN(w) && !isNaN(r) && r > 0 && w > 0) {
    oneRM = calculate1RM(w, r);
  }

  const percentages = [
    { percent: 100, reps: 1 },
    { percent: 95, reps: 2 },
    { percent: 90, reps: 3 },
    { percent: 85, reps: 5 },
    { percent: 80, reps: 8 },
    { percent: 75, reps: 10 },
    { percent: 70, reps: 12 },
    { percent: 65, reps: 15 },
    { percent: 60, reps: 20 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: '1RM Calculator', 
          headerShown: true,
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Icon
                name="chevron-back"
                size={24}
                color={Colors.textPrimary}
                style={{ padding: Spacing.sm, marginLeft: -Spacing.sm }}
              />
            </Pressable>
          ),
        }} 
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            
            <Card glowing style={styles.resultCard}>
              <Text color="secondary" style={styles.resultLabel}>Your Estimated 1RM</Text>
              <View style={styles.resultValueContainer}>
                <Text style={styles.resultValue}>
                  {oneRM > 0 ? oneRM.toFixed(1) : '---'}
                </Text>
                {oneRM > 0 && (
                  <Text style={styles.resultUnit}>{settings.weightUnit}</Text>
                )}
              </View>
            </Card>

            <View style={styles.inputContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight ({settings.weightUnit})</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                  maxLength={5}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={reps}
                  onChangeText={setReps}
                  maxLength={3}
                />
              </View>
            </View>

            {oneRM > 0 && (
              <View style={styles.percentagesContainer}>
                <Text variant="h3" style={styles.percentagesTitle}>Percentages</Text>
                <View style={styles.percentageTable}>
                  <View style={styles.percentageHeader}>
                    <Text style={[styles.headerCell, { flex: 1 }]}>% 1RM</Text>
                    <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'center' }]}>Weight</Text>
                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Reps</Text>
                  </View>
                  {percentages.map((item, index) => (
                    <View key={item.percent} style={[styles.percentageRow, index % 2 === 0 && styles.rowEven]}>
                      <Text style={[styles.cell, { flex: 1, color: Colors.accent }]}>{item.percent}%</Text>
                      <Text style={[styles.cell, { flex: 1.5, textAlign: 'center', fontFamily: FontFamily.bodyBold }]}>
                        {((oneRM * item.percent) / 100).toFixed(1)} {settings.weightUnit}
                      </Text>
                      <Text style={[styles.cell, { flex: 1, textAlign: 'right', color: Colors.textSecondary }]}>
                        {item.reps}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg },
  
  resultCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderColor: Colors.accent,
    borderWidth: 1,
  },
  resultLabel: {
    fontSize: FontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  resultValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  resultValue: {
    fontSize: 48,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textPrimary,
  },
  resultUnit: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  
  inputContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  percentagesContainer: {
    marginTop: Spacing.md,
  },
  percentagesTitle: {
    marginBottom: Spacing.md,
  },
  percentageTable: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  percentageHeader: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.bgCard2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCell: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: FontFamily.bodyBold,
    textTransform: 'uppercase',
  },
  percentageRow: {
    flexDirection: 'row',
    padding: Spacing.md,
  },
  rowEven: {
    backgroundColor: Colors.bgCard3,
  },
  cell: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
});
