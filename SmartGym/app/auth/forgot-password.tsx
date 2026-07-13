/**
 * Forgot Password Screen (Login.dc.html, variant 1b)
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, FontFamily, Gradients } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { GlowOrb } from '@/components/ui/GlowOrb';
import { supabase } from '@/lib/supabase';

const GOLD = Colors.iconPremiumGold;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter the email linked to your account.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      Alert.alert(
        'Check Your Email',
        'We sent a password reset link to your email address.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not send reset link.';
      Alert.alert('Reset Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Hero background */}
      <ExpoImage
        source={require('@/assets/auth/login-background.jpg')}
        style={styles.hero}
        contentFit="cover"
        contentPosition="top"
      />
      <LinearGradient
        colors={['rgba(5,6,10,0.1)', 'rgba(5,6,10,0.88)', '#05060a']}
        locations={[0, 0.78, 1]}
        style={styles.heroFade}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Back button */}
        <TouchableOpacity style={[styles.backBtn, { top: insets.top + Spacing.xs }]} onPress={() => router.back()} hitSlop={10}>
          <Icon name="chevron-back" size={20} color={Colors.accent} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={styles.logoGlow}>
                <GlowOrb
                  size={150}
                  color="#FFD36A"
                  opacity={0.55}
                  falloff={0.62}
                  style={{ top: 0, left: 0 }}
                />
                <Image
                  source={require('@/assets/auth/login-icon-2.png')}
                  style={styles.logoIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.logoTitle}>
                Smart Gym <Text style={{ color: Colors.accent }}>Plus</Text>
              </Text>
              <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text style={styles.taglineText}>TRACK. LIFT. EVOLVE.</Text>
                <View style={styles.taglineLine} />
              </View>
            </View>

            {/* Card */}
            <View style={styles.cardShadow}>
              <LinearGradient
                colors={[Colors.accent, Colors.iconEnergyCyan, Colors.iconCinematicViolet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardBorder}
              >
              <LinearGradient
                colors={['#12362F', '#142433', '#171D34', '#241D45', '#351A55']}
                locations={[0, 0.28, 0.55, 0.78, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardInner}
              >
                <Text style={styles.cardEyebrow}>Reset your password</Text>
                <Text style={styles.cardTitle}>Forgot Password?</Text>
                <Text style={styles.cardDesc}>
                  No worries — enter the email linked to your account and we&apos;ll send a reset link.
                </Text>

                <View style={styles.inputWrap}>
                  <Icon name="mail-outline" size={18} color={Colors.accent} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Pressable style={styles.ctaBtn} onPress={handleSendReset} disabled={loading}>
                  <LinearGradient
                    colors={Gradients.accentButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.textOnAccent} />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>Send Reset Link</Text>
                      <Icon name="arrow-forward" size={16} color={Colors.textOnAccent} />
                    </>
                  )}
                </Pressable>

                <TouchableOpacity style={styles.linkRow} onPress={() => router.back()}>
                  <Text style={styles.linkText}>
                    Remember your password?{' '}
                    <Text style={{ color: Colors.accent, fontFamily: FontFamily.bodyBold }}>
                      Sign In
                    </Text>
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
              </LinearGradient>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const HERO_HEIGHT = 360;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05060a' },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT },
  heroFade: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT },
  safe: { flex: 1 },
  backBtn: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.lg,
    zIndex: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,15,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,157,0.35)',
  },
  container: { flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing.xxl, justifyContent: 'center' },

  logoWrap: { alignItems: 'center', marginBottom: Spacing.md },
  logoGlow: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoIcon: {
    width: 110,
    height: 110,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  logoTitle: {
    fontFamily: FontFamily.display,
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 10,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.xxl,
  },
  taglineLine: { width: 24, height: 1, backgroundColor: GOLD },
  taglineText: { fontSize: FontSize.xs, letterSpacing: 2, color: '#e8e8f0' },

  cardShadow: {
    borderRadius: Radius.xl,
    marginTop: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 10,
  },
  cardBorder: {
    borderRadius: Radius.xl,
    padding: 1,
    overflow: 'hidden',
  },
  cardInner: {
    borderRadius: Radius.xl - 1,
    padding: Spacing.xl,
    overflow: 'hidden',
    backgroundColor: '#141824',
  },
  cardEyebrow: { color: Colors.accent, fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs },
  cardTitle: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: Spacing.xl,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,15,0.6)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,255,157,0.35)',
    paddingHorizontal: Spacing.md,
    height: 50,
    marginBottom: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },

  ctaBtn: {
    marginTop: 4,
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  ctaText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.lg, color: Colors.textOnAccent },

  linkRow: { alignItems: 'center', marginTop: Spacing.lg },
  linkText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
