import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize } from '@/lib/theme';
import { healthService } from '@/lib/health/healthService';
import type { HealthPermissionStatus } from '@/lib/health/types';

const ALL_PERMISSIONS = ['workout', 'steps', 'heartRate', 'activeCalories', 'weight', 'bodyFat'] as const;

export function HealthSyncCard() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<HealthPermissionStatus>('notDetermined');
  const [loading, setLoading] = useState(true);

  const platformName = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';
  const iconName = Platform.OS === 'ios' ? 'heart' : 'fitness';

  useEffect(() => {
    async function init() {
      const avail = healthService.isAvailable();
      setIsAvailable(avail);
      if (avail) {
        const statuses = await healthService.checkPermissions([...ALL_PERMISSIONS]);
        const allGranted = Object.values(statuses).every((s) => s === 'granted');
        setPermissionStatus(allGranted ? 'granted' : 'notDetermined');
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleConnect = async () => {
    const result = await healthService.requestPermissions([...ALL_PERMISSIONS]);
    const allGranted = Object.values(result).every((s) => s === 'granted');
    setPermissionStatus(allGranted ? 'granted' : 'denied');
  };

  if (loading) return null;

  if (!isAvailable) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name={iconName as any} size={24} color={Colors.textMuted} />
          <Text style={styles.title}>{platformName}</Text>
        </View>
        <Text style={styles.description}>Health Sync is not available on this device.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={iconName as any} size={24} color={Colors.accent} />
        <Text style={styles.title}>{platformName}</Text>
      </View>

      <Text style={styles.description}>
        Sync your workout sessions and body measurements with {platformName}.
      </Text>

      {permissionStatus === 'granted' ? (
        <View style={styles.statusRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.statusText}>Connected</Text>
        </View>
      ) : (
        <Button
          title={`Connect ${platformName}`}
          onPress={handleConnect}
          variant="secondary"
          style={{ marginTop: Spacing.md }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  statusText: {
    color: Colors.success,
    fontWeight: '600',
  },
});
