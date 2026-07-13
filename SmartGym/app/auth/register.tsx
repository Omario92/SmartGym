/**
 * Register Screen — "Sign Up" (Login.dc.html, variant 1c)
 * Email/Password signup with full name, terms consent, social buttons.
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
import { SvgXml } from 'react-native-svg';
import { Colors, Spacing, Radius, FontSize, FontFamily, Gradients } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { GlowOrb } from '@/components/ui/GlowOrb';
import { GOOGLE_SVG } from '@/components/ui/designIcons';
import { supabase } from '@/lib/supabase';

const GOLD = Colors.iconPremiumGold;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) throw error;
      if (data.user && !data.session) {
        // Email confirmation required
        Alert.alert(
          'Verify Your Email',
          'We sent a confirmation link to your email. Please verify to continue.',
          [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
        );
      } else if (data.session) {
        // Auto-confirmed (rare)
        router.replace('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      Alert.alert('Registration Failed', message);
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
                <Text style={styles.cardEyebrow}>Get started</Text>
                <Text style={styles.cardTitle}>Sign Up</Text>

                {/* Full name */}
                <View style={styles.inputWrap}>
                  <Icon name="person-outline" size={18} color={Colors.accent} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full name"
                    placeholderTextColor={Colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>

                {/* Email */}
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

                {/* Password */}
                <View style={styles.inputWrap}>
                  <Icon name="lock-closed-outline" size={18} color={Colors.accent} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ padding: 4 }}
                    hitSlop={10}
                  >
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputWrap}>
                  <Icon name="lock-closed-outline" size={18} color={Colors.accent} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>

                {/* Terms */}
                <TouchableOpacity style={styles.termsRow} onPress={() => setAgreeTerms(!agreeTerms)}>
                  <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                    {agreeTerms && <Icon name="checkmark" size={12} color={Colors.textOnAccent} />}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the <Text style={{ color: Colors.accent }}>Terms of Service</Text> and{' '}
                    <Text style={{ color: Colors.accent }}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                {/* Submit */}
                <Pressable style={styles.ctaBtn} onPress={handleRegister} disabled={loading}>
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
                      <Text style={styles.ctaText}>Create Account</Text>
                      <Icon name="arrow-forward" size={16} color={Colors.textOnAccent} />
                    </>
                  )}
                </Pressable>

                {/* Divider */}
                <View style={styles.divider}>
                  <LinearGradient
                    colors={['transparent', GOLD, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.dividerLine}
                  />
                  <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
                  <LinearGradient
                    colors={['transparent', GOLD, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.dividerLine}
                  />
                </View>

                {/* Social buttons */}
                <View style={styles.socialRow}>
                  <TouchableOpacity style={styles.socialBtn}>
                    <SvgXml xml={GOOGLE_SVG} width={16} height={16} />
                    <Text style={styles.socialLabel}>Google</Text>
                  </TouchableOpacity>

                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={[styles.socialBtn, styles.socialBtnApple]}>
                      <Icon name="logo-apple" size={18} color={Colors.textPrimary} />
                      <Text style={styles.socialLabel}>Apple</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Login link */}
                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => router.replace('/auth/login')}
                >
                  <Text style={styles.linkText}>
                    Already have an account?{' '}
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
    marginBottom: Spacing.lg,
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

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.accent },
  termsText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },

  ctaBtn: {
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  ctaText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.lg, color: Colors.textOnAccent },

  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: FontSize.xs, letterSpacing: 1, color: Colors.textMuted },

  socialRow: { flexDirection: 'row', gap: Spacing.md },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,255,157,0.3)',
    paddingVertical: 12,
  },
  socialBtnApple: { borderColor: 'rgba(139,92,255,0.4)' },
  socialLabel: { fontSize: FontSize.sm, color: Colors.textPrimary },

  linkRow: { alignItems: 'center', marginTop: Spacing.lg },
  linkText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
