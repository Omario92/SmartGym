/**
 * Login Screen
 * Supports: Email/Password, Google OAuth, Apple Sign In, Guest mode.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const setAuthUser = useStore((s) => s.setAuthUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
            <Text style={styles.logoIcon}>💪</Text>
            <Text style={styles.logoTitle}>SmartGym</Text>
            <Text style={styles.logoSubtitle}>Track. Lift. Evolve.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            {/* Email input */}
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Sign In button */}
            <Button
              title={loading ? 'Signing in…' : 'Sign In'}
              variant="primary"
              fullWidth
              onPress={handleEmailLogin}
              style={{ marginTop: Spacing.sm }}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin} disabled={googleLoading}>
                {googleLoading
                  ? <ActivityIndicator size="small" color={Colors.textPrimary} />
                  : <>
                      <Text style={styles.socialIcon}>G</Text>
                      <Text style={styles.socialLabel}>Google</Text>
                    </>
                }
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.socialBtn} onPress={handleAppleLogin}>
                  <Ionicons name="logo-apple" size={20} color={Colors.textPrimary} />
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
                <Text style={{ color: Colors.accent, fontWeight: FontWeight.semibold }}>
                  Sign Up
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Guest mode */}
          <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
            <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },

  logoWrap: { alignItems: 'center', marginBottom: Spacing.xl * 1.5 },
  logoIcon: { fontSize: 56, marginBottom: Spacing.sm },
  logoTitle: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 1.5,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 50,
    marginBottom: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.xs, color: Colors.textMuted, paddingHorizontal: 4 },

  socialRow: { flexDirection: 'row', gap: Spacing.md },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.bgCard2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
  },
  socialIcon: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  socialLabel: { fontSize: FontSize.sm, color: Colors.textPrimary },

  linkRow: { alignItems: 'center', marginTop: Spacing.lg },
  linkText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },
  guestText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
