/**
 * Login Screen — "Hero photo + gold glow mark" (Login.dc.html, variant 1a)
 * Supports: Email/Password, Google OAuth, Apple Sign In, Guest mode.
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Colors, Spacing, Radius, FontSize, FontFamily, Gradients } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { GlowOrb } from '@/components/ui/GlowOrb';
import { GOOGLE_SVG } from '@/components/ui/designIcons';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

WebBrowser.maybeCompleteAuthSession();

const GOLD = Colors.iconPremiumGold;

export default function LoginScreen() {
  const setAuthUser = useStore((s) => s.setAuthUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ─── Email / Password ──────────────────────────────────────────────────────

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (data.user) {
        setAuthUser({
          id: data.user.id,
          email: data.user.email ?? null,
          displayName: data.user.user_metadata?.full_name ?? null,
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
          provider: 'email',
        });
        router.replace('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Google OAuth ──────────────────────────────────────────────────────────

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const redirectUrl = makeRedirectUri({ scheme: 'smartgym', path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');
          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
            if (sessionData.user) {
              setAuthUser({
                id: sessionData.user.id,
                email: sessionData.user.email ?? null,
                displayName: sessionData.user.user_metadata?.full_name ?? null,
                avatarUrl: sessionData.user.user_metadata?.avatar_url ?? null,
                provider: 'google',
              });
              router.replace('/');
            }
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed.';
      Alert.alert('Google Login Failed', message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Apple Sign In ─────────────────────────────────────────────────────────

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (error) throw error;
        if (data.user) {
          const fullName = credential.fullName
            ? [credential.fullName.givenName, credential.fullName.familyName]
                .filter(Boolean)
                .join(' ')
            : null;
          setAuthUser({
            id: data.user.id,
            email: data.user.email ?? credential.email ?? null,
            displayName: fullName,
            provider: 'apple',
          });
          router.replace('/');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('ERR_CANCELED')) return;
      const message = err instanceof Error ? err.message : 'Apple Sign In failed.';
      Alert.alert('Apple Sign In Failed', message);
    }
  };

  // ─── Guest ─────────────────────────────────────────────────────────────────

  const handleGuest = () => {
    router.replace('/');
  };

  // ─── Render ────────────────────────────────────────────────────────────────

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
                <Text style={styles.cardEyebrow}>Welcome back</Text>
                <Text style={styles.cardTitle}>Sign In</Text>

                {/* Email input */}
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={Colors.accent} style={styles.inputIcon} />
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

                {/* Password input */}
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.accent} style={styles.inputIcon} />
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
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Remember me / Forgot password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Ionicons name="checkmark" size={12} color="#000" />}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In button */}
                <Pressable style={styles.ctaBtn} onPress={handleEmailLogin} disabled={loading}>
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
                      <Text style={styles.ctaText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={16} color={Colors.textOnAccent} />
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
                  <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                  <LinearGradient
                    colors={['transparent', GOLD, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.dividerLine}
                  />
                </View>

                {/* Social buttons */}
                <View style={styles.socialRow}>
                  <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin} disabled={googleLoading}>
                    {googleLoading ? (
                      <ActivityIndicator size="small" color={Colors.textPrimary} />
                    ) : (
                      <>
                        <SvgXml xml={GOOGLE_SVG} width={16} height={16} />
                        <Text style={styles.socialLabel}>Google</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={[styles.socialBtn, styles.socialBtnApple]} onPress={handleAppleLogin}>
                      <Ionicons name="logo-apple" size={18} color={Colors.textPrimary} />
                      <Text style={styles.socialLabel}>Apple</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Register link */}
                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => router.push('/auth/register')}
                >
                  <Text style={styles.linkText}>
                    Don&apos;t have an account?{' '}
                    <Text style={{ color: Colors.accent, fontFamily: FontFamily.bodyBold }}>
                      Sign Up
                    </Text>
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
              </LinearGradient>
            </View>

            {/* Guest mode */}
            <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
              <Ionicons name="person-outline" size={16} color={Colors.accent} />
              <Text style={styles.guestText}>Continue as Guest</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const HERO_HEIGHT = 420;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05060a' },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT },
  heroFade: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT },
  safe: { flex: 1 },
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

  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.accent },
  rememberText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  forgotText: { fontSize: FontSize.sm, color: Colors.accent, fontFamily: FontFamily.bodyBold },

  ctaBtn: {
    marginTop: Spacing.md,
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

  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  guestText: { fontSize: FontSize.sm, color: Colors.accent },
});
