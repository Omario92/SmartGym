/**
 * More Tab — v2.0
 * My Exercises hub, Favorites quick-access, Settings, Premium upsell.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Switch,
  Alert,
  Linking,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from './_layout';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { Colors, Spacing, Radius, FontSize, FontFamily, Gradients, withAlpha, elevate } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import { Badge } from '@/components/ui/Badge';
import { PREMIUM_SVG, FAVORITE_SVG } from '@/components/ui/designIcons';
import { CustomExerciseManager } from '@/components/exercise/CustomExerciseManager';
import { GlobalExerciseSearch } from '@/components/exercise/GlobalExerciseSearch';
import { useStore, selectCustomExercises, selectFavoriteIds } from '@/store';
import { supabase } from '@/lib/supabase';
import { HealthSyncCard } from '@/components/health/HealthSyncCard';
import { isAdminEmail } from '@/lib/admin';
import { exerciseRepository } from '@/lib/repositories/exerciseRepository';
import { routineRepository } from '@/lib/repositories/routineRepository';
import { cacheInvalidateAll } from '@/lib/cache/cacheManager';

// ─── Row Components ───────────────────────────────────────────────────────────

const SettingRow: React.FC<{
  icon: string;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  badge?: string;
  badgeVariant?: 'accent' | 'premium' | 'error' | 'info';
  destructive?: boolean;
}> = ({
  icon,
  label,
  value,
  toggle,
  toggleValue,
  onToggle,
  onPress,
  badge,
  badgeVariant,
  destructive,
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    disabled={toggle && !onPress}
    activeOpacity={onPress ? 0.75 : 1}
  >
    <View style={styles.settingIcon}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
    </View>
    <Text
      style={[
        styles.settingLabel,
        { color: destructive ? Colors.error : Colors.textPrimary },
      ]}
    >
      {label}
    </Text>
    {badge && (
      <Badge label={badge} variant={badgeVariant ?? 'accent'} style={{ marginRight: Spacing.sm }} />
    )}
    {toggle ? (
      <Switch
        value={toggleValue}
        onValueChange={onToggle}
        trackColor={{ false: Colors.bgCard3, true: Colors.accent }}
        thumbColor={toggleValue ? Colors.bg : Colors.textMuted}
        ios_backgroundColor={Colors.bgCard3}
      />
    ) : value ? (
      <Text color="muted" style={styles.settingValue}>
        {value}
      </Text>
    ) : (
      <Ionicons
        name="chevron-forward"
        size={16}
        color={destructive ? Colors.error : Colors.textMuted}
      />
    )}
  </TouchableOpacity>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text color="muted" style={styles.sectionTitle}>
    {title.toUpperCase()}
  </Text>
);

// ─── Premium Card ─────────────────────────────────────────────────────────────

const PremiumCard: React.FC<{ isPremium: boolean; onUpgrade: () => void }> = ({
  isPremium,
  onUpgrade,
}) => {
  if (isPremium) {
    return (
      <GradientCard style={styles.premiumActiveCard}>
        <View style={styles.premiumInner}>
          <Text style={{ fontSize: 36 }}>⭐</Text>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text variant="h4" style={{ marginBottom: 4 }}>
              Smart Gym Plus Pro
            </Text>
            <Text color="accent" style={{ fontSize: FontSize.sm }}>
              Premium Member
            </Text>
          </View>
          <Badge label="ACTIVE" variant="accent" />
        </View>
      </GradientCard>
    );
  }

  return (
    <View style={styles.premiumCard}>
      <LinearGradient
        colors={Gradients.aiExplore}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.premiumContent}>
        <View style={styles.premiumHeader}>
          <SvgXml xml={PREMIUM_SVG} width={40} height={40} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text variant="h4" style={{ marginBottom: 4 }}>
              Smart Gym Plus Pro
            </Text>
            <Text style={{ fontSize: FontSize.sm, lineHeight: 18, color: Colors.textCoach }}>
              Unlock AI trainer, unlimited routines, advanced analytics &amp; more
            </Text>
          </View>
        </View>

        <View style={styles.premiumFeatures}>
          {[
            '🤖 AI Workout Generator',
            '📊 Advanced Analytics',
            '🎯 Custom Programs',
            '👨‍💼 Personal Trainer Access',
            '🔓 Unlimited Routines',
            '📈 Body Composition Tracking',
          ].map((f) => (
            <View key={f} style={styles.premiumFeature}>
              <Text style={{ fontSize: FontSize.sm, color: Colors.textPrimary }}>{f}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.premiumUpgradeBtn} onPress={onUpgrade}>
          <LinearGradient
            colors={Gradients.gold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.premiumUpgradeBtnText}>Upgrade to Pro — $9.99/mo</Text>
        </Pressable>
        <Text style={styles.premiumDisclaimer}>
          7-day free trial • Cancel anytime
        </Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const settings = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
  const updateOneRmFormula = useStore(s => s.updateOneRmFormula);
  const startTour = useStore(s => s.startTour);
  const customExercises = useStore(selectCustomExercises);
  const favoriteIds = useStore(selectFavoriteIds);
  const authUser = useStore(s => s.authUser);
  const clearAuthUser = useStore(s => s.clearAuthUser);

  const [myExercisesVisible, setMyExercisesVisible] = useState(false);
  const [favSearchVisible, setFavSearchVisible] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);

  // Prefer the server-controlled profiles.is_admin flag; fall back to the env allowlist.
  const isAdmin = !!authUser?.isAdmin || isAdminEmail(authUser?.email);

  const handleUpgrade = () => {
    Alert.alert(
      '👑 SmartGym Pro',
      'Start your 7-day free trial today!\n\n✅ AI Workout Generator\n✅ Advanced Analytics\n✅ Unlimited Routines\n✅ Personal Trainer Access',
      [
        { text: 'Start Free Trial', onPress: () => updateSettings({ isPremium: true }) },
        { text: 'Maybe Later', style: 'cancel' },
      ]
    );
  };

  const handleResetTour = () => {
    Alert.alert('Restart Tour?', 'This will show the app guided tour again.', [
      { text: 'Restart', onPress: () => startTour() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRestoreUnit = () => {
    Alert.alert('Weight Unit', 'Choose your preferred unit', [
      { text: 'Kilograms (kg)', onPress: () => updateSettings({ weightUnit: 'kg' }) },
      { text: 'Pounds (lbs)', onPress: () => updateSettings({ weightUnit: 'lbs' }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          clearAuthUser();
        },
      },
    ]);
  };

  // ── Admin tools ───────────────────────────────────────────────────────────
  const handleRefreshCatalog = async () => {
    if (adminBusy) return;
    setAdminBusy(true);
    try {
      const list = await exerciseRepository.refresh();
      Alert.alert('Catalog refreshed', `${list.length} exercises loaded from the server.`);
    } catch (e) {
      Alert.alert('Refresh failed', e instanceof Error ? e.message : 'Could not refresh the catalog.');
    } finally {
      setAdminBusy(false);
    }
  };

  const handleRefreshExplore = async () => {
    if (adminBusy) return;
    setAdminBusy(true);
    try {
      const list = await routineRepository.refresh();
      Alert.alert('Explore refreshed', `${list.length} programs loaded from the server.`);
    } catch (e) {
      Alert.alert('Refresh failed', e instanceof Error ? e.message : 'Could not refresh Explore programs.');
    } finally {
      setAdminBusy(false);
    }
  };

  const handleClearCaches = () => {
    Alert.alert(
      'Clear all caches?',
      'Removes cached exercises, routines and Explore data. They re-download on next open. User data is untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await cacheInvalidateAll();
            Alert.alert('Done', 'All caches cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">More</Text>
      </View>

      {/* My Exercises full-screen modal */}
      <Modal
        visible={myExercisesVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgModal }} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text variant="h3">My Custom Exercises</Text>
            <TouchableOpacity onPress={() => setMyExercisesVisible(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <CustomExerciseManager
            standalone
            onCreateNew={() => {
              setMyExercisesVisible(false);
              setTimeout(() => router.push('/routine/add-custom-exercise'), 300);
            }}
            onEdit={(ex) => {
              setMyExercisesVisible(false);
              setTimeout(() => router.push(`/routine/add-custom-exercise?editId=${ex.id}`), 300);
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Favorites search modal */}
      <GlobalExerciseSearch
        visible={favSearchVisible}
        onClose={() => setFavSearchVisible(false)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + Spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Card */}
        <PremiumCard isPremium={settings.isPremium} onUpgrade={handleUpgrade} />

        {/* My Exercises Hub */}
        <SectionHeader title="Exercise Library" />
        <Card style={styles.section} noPadding>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setMyExercisesVisible(true)}
            activeOpacity={0.75}
          >
            <View style={styles.settingIcon}>
              <Text style={{ fontSize: 18 }}>🏗️</Text>
            </View>
            <Text style={styles.settingLabel}>My Custom Exercises</Text>
            {customExercises.length > 0 ? (
              <View style={styles.countBadge}>
                <Text style={{ color: Colors.accent, fontSize: FontSize.xs, fontFamily: FontFamily.bodyBold }}>
                  {customExercises.length}
                </Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setFavSearchVisible(true)}
            activeOpacity={0.75}
          >
            <View style={styles.settingIcon}>
              <SvgXml xml={FAVORITE_SVG} width={18} height={18} />
            </View>
            <Text style={styles.settingLabel}>Favorite Exercises</Text>
            {favoriteIds.length > 0 ? (
              <View style={[styles.countBadge, { backgroundColor: withAlpha(Colors.error, 0.13), borderColor: withAlpha(Colors.error, 0.27) }]}>
                <Text style={{ color: Colors.error, fontSize: FontSize.xs, fontFamily: FontFamily.bodyBold }}>
                  {favoriteIds.length}
                </Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/routine/add-custom-exercise')}
            activeOpacity={0.75}
          >
            <View style={styles.settingIcon}>
              <Text style={{ fontSize: 18 }}>✨</Text>
            </View>
            <Text style={styles.settingLabel}>Create New Exercise</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.accent} />
          </TouchableOpacity>
        </Card>

        {/* Account Section */}
        <SectionHeader title="Account" />
        <Card style={styles.section} noPadding>
          {authUser ? (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingIcon}>
                  <Text style={{ fontSize: 18 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>{authUser.displayName ?? 'My Account'}</Text>
                  <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted }}>{authUser.email}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <SettingRow
                icon="☁️"
                label="My Cloud Exercises"
                onPress={() => router.push('/exercise/my-exercises' as never)}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="🚪"
                label="Sign Out"
                destructive
                onPress={handleSignOut}
              />
            </>
          ) : (
            <SettingRow
              icon="🔑"
              label="Sign In / Create Account"
              onPress={() => router.push('/auth/login')}
            />
          )}
        </Card>

        {/* Profile Section */}
        <SectionHeader title="Profile" />
        <Card style={styles.section} noPadding>
          <SettingRow
            icon="👤"
            label="Personal Profile"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing coming soon!')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🎯"
            label="Fitness Goals"
            onPress={() => Alert.alert('Coming Soon', 'Goal setting coming soon!')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="👨‍💼"
            label="Personal Trainer"
            badge="PRO"
            badgeVariant="premium"
            onPress={handleUpgrade}
          />
        </Card>

        {/* Workout Settings */}
        <SectionHeader title="Workout" />
        <Card style={styles.section} noPadding>
          <SettingRow
            icon="⚖️"
            label="Weight Unit"
            value={settings.weightUnit === 'kg' ? 'Kilograms' : 'Pounds'}
            onPress={handleRestoreUnit}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="⏱"
            label="Default Rest Timer"
            value={`${settings.restTimerDefault}s`}
            onPress={() =>
              Alert.alert('Rest Timer', 'Set default rest duration', [
                { text: '60s', onPress: () => updateSettings({ restTimerDefault: 60 }) },
                { text: '90s', onPress: () => updateSettings({ restTimerDefault: 90 }) },
                { text: '2 min', onPress: () => updateSettings({ restTimerDefault: 120 }) },
                { text: '3 min', onPress: () => updateSettings({ restTimerDefault: 180 }) },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📚"
            label="Exercise Library"
            onPress={() => Alert.alert('Coming Soon', 'Full exercise library coming soon!')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📊"
            label="1RM Calculator"
            onPress={() => router.push('/tools/1rm-calculator')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🧮"
            label="1RM Formula"
            value={
              settings.oneRmFormula === 'epley' ? 'Epley' :
              settings.oneRmFormula === 'brzycki' ? 'Brzycki' : 'Lombardi'
            }
            onPress={() =>
              Alert.alert('1RM Formula', 'Choose the formula for estimating your 1-Rep Max.\n\n• Epley (Default): Best for general use.\n• Brzycki: Best for < 10 reps.\n• Lombardi: Focuses on pure strength.', [
                { text: 'Epley', onPress: () => updateOneRmFormula('epley') },
                { text: 'Brzycki', onPress: () => updateOneRmFormula('brzycki') },
                { text: 'Lombardi', onPress: () => updateOneRmFormula('lombardi') },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          />
        </Card>

        {/* App Settings */}
        <SectionHeader title="App Settings" />
        <Card style={styles.section} noPadding>
          <SettingRow
            icon="📳"
            label="Haptic Feedback"
            toggle
            toggleValue={settings.hapticFeedback}
            onToggle={(v) => updateSettings({ hapticFeedback: v })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🔔"
            label="Notifications"
            toggle
            toggleValue={settings.notifications}
            onToggle={(v) => updateSettings({ notifications: v })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🔊"
            label="Sound Effects"
            toggle
            toggleValue={settings.soundEnabled}
            onToggle={(v) => updateSettings({ soundEnabled: v })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="💡"
            label="Keep Screen On"
            toggle
            toggleValue={settings.keepScreenOn}
            onToggle={(v) => updateSettings({ keepScreenOn: v })}
          />
        </Card>

        {/* Help */}
        <SectionHeader title="Help & Support" />
        <Card style={styles.section} noPadding>
          <SettingRow
            icon="🗺️"
            label="App Guided Tour"
            onPress={handleResetTour}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="❓"
            label="Help Center"
            onPress={() => Linking.openURL('https://smartgym.app/help')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="⭐"
            label="Rate SmartGym"
            onPress={() => Alert.alert('Thank you!', "Rating helps us grow — thank you! 🙏")}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="💬"
            label="Send Feedback"
            onPress={() => Linking.openURL('mailto:support@smartgym.app')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🔒"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://smartgym.app/privacy')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📋"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://smartgym.app/terms')}
          />
        </Card>

        {/* Health Sync */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <HealthSyncCard />
        </View>

        {/* Danger Zone */}
        <SectionHeader title="Data" />
        <Card style={styles.section} noPadding>
          <SettingRow
            icon="📤"
            label="Export Data"
            onPress={() => Alert.alert('Export', 'Data export coming soon!')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🗑"
            label="Delete All Data"
            destructive
            onPress={() =>
              Alert.alert(
                'Delete All Data',
                'This will permanently delete all your workouts, routines, and measurements. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: () =>
                      Alert.alert(
                        'Not available yet',
                        'Bulk data deletion isn’t enabled yet. To clear your workout history now, use "Clear all" on the History tab.'
                      ),
                  },
                ]
              )
            }
          />
        </Card>

        {/* Admin Tools — visible only to allow-listed admin accounts */}
        {isAdmin && (
          <>
            <SectionHeader title="Admin Tools" />
            <Card style={styles.section} noPadding>
              <SettingRow
                icon="🔄"
                label="Refresh Exercise Catalog"
                value={adminBusy ? 'Working…' : undefined}
                onPress={handleRefreshCatalog}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="🧭"
                label="Refresh Explore Programs"
                value={adminBusy ? 'Working…' : undefined}
                onPress={handleRefreshExplore}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="🧹"
                label="Clear All Caches"
                destructive
                onPress={handleClearCaches}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="⭐"
                label="Premium Mode"
                badge="ADVANCED"
                badgeVariant="premium"
                toggle
                toggleValue={settings.isPremium}
                onToggle={(v) => updateSettings({ isPremium: v })}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="🤖"
                label="AI Smart Trainer"
                value={settings.geminiApiKey ? 'Enabled' : 'No API key'}
              />
            </Card>
          </>
        )}

        {/* App info */}
        <View style={styles.appInfo}>
          <Image
            source={require('@/assets/logo/logo-smart-gym-plus-2.png')}
            style={styles.appLogoImg}
            resizeMode="contain"
          />
          <Text variant="h4" center>
            SmartGym
          </Text>
          <Text color="muted" style={{ fontSize: FontSize.xs, marginTop: 4 }}>
            Version 2.0.0 • Made with ❤️
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing['6xl'] },

  // Premium card
  premiumActiveCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  premiumCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(Colors.iconPremiumGold, 0.35),
    ...elevate(3, Colors.iconPremiumGold),
  },
  premiumContent: { gap: Spacing.sm, padding: Spacing.lg },
  premiumHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  premiumFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  premiumFeature: {
    backgroundColor: withAlpha(Colors.iconPremiumGold, 0.14),
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  premiumUpgradeBtn: {
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    ...elevate(3, Colors.iconPremiumGold),
  },
  premiumUpgradeBtnText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bodyBold,
    color: Colors.textOnAccent,
  },
  premiumDisclaimer: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.sm,
    color: Colors.textMuted,
  },
  premiumInner: { flexDirection: 'row', alignItems: 'center' },

  // Section header
  sectionTitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },

  // Settings card
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: 0,
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 50,
  },
  settingIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingLabel: {
    flex: 1,
    fontSize: FontSize.md,
  },
  settingValue: {
    fontSize: FontSize.sm,
    marginRight: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },

  // App info
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  appLogo: { fontSize: 48, marginBottom: Spacing.sm },
  appLogoImg: { width: 40, height: 40, marginBottom: Spacing.sm },

  // Modal header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  // Count badge
  countBadge: {
    backgroundColor: Colors.accentGlow2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginRight: Spacing.sm,
    minWidth: 24,
    alignItems: 'center',
  },
});
