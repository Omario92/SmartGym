/**
 * Root layout — sets up providers, fonts, splash screen, and guided tour.
 * Waits for Zustand persist hydration before rendering screens.
 * v2.1: Added QueryClientProvider + Supabase auth session listener.
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/lib/theme';
import { useStore } from '@/store';
import { GuidedTour } from '@/components/tour/GuidedTour';
import { supabase } from '@/lib/supabase';
import { SyncProvider } from '@/components/sync/SyncProvider';

const FIRST_LAUNCH_KEY = '@smartgym_first_launch';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
  },
});

export default function RootLayout() {
  const startTour = useStore(s => s.startTour);
  const setFirstLaunch = useStore(s => s.setFirstLaunch);
  const updateSettings = useStore(s => s.updateSettings);
  const setAuthUser = useStore(s => s.setAuthUser);
  const clearAuthUser = useStore(s => s.clearAuthUser);

  const [hydrated, setHydrated] = useState(false);

  // ── Zustand hydration ────────────────────────────────────────────────────────
  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
      checkFirstLaunch();
    } else {
      const unsub = useStore.persist.onFinishHydration(() => {
        setHydrated(true);
        checkFirstLaunch();
      });
      return () => unsub();
    }
  }, []);

  // ── Supabase auth state listener ─────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser({
          id: session.user.id,
          email: session.user.email ?? null,
          displayName: session.user.user_metadata?.full_name ?? null,
          avatarUrl: session.user.user_metadata?.avatar_url ?? null,
          provider: session.user.app_metadata?.provider ?? 'email',
        });
      } else {
        clearAuthUser();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const value = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      if (value === null) {
        await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'done');
        setFirstLaunch(true);
        setTimeout(() => startTour(), 800);
      } else {
        setFirstLaunch(false);
        updateSettings({ showTour: false });
      }
    } catch (e) {
      console.log('AsyncStorage error:', e);
    }
  };

  if (!hydrated) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor={Colors.bg} />
          <SyncProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen
              name="exercise/my-exercises"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="exercise/create"
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="exercise/[id]"
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="routine/create"
              options={{
                headerShown: true,
                headerTitle: 'New Routine',
                headerStyle: { backgroundColor: Colors.bgCard },
                headerTintColor: Colors.textPrimary,
                headerTitleStyle: { color: Colors.textPrimary, fontWeight: '600' },
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="routine/[id]"
              options={{
                headerShown: true,
                headerTitle: 'Routine',
                headerStyle: { backgroundColor: Colors.bgCard },
                headerTintColor: Colors.textPrimary,
                headerTitleStyle: { color: Colors.textPrimary, fontWeight: '600' },
              }}
            />
            <Stack.Screen
              name="workout/active"
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="routine/add-custom-exercise"
              options={{
                headerShown: true,
                headerTitle: 'Custom Exercise',
                headerStyle: { backgroundColor: Colors.bgCard },
                headerTintColor: Colors.textPrimary,
                headerTitleStyle: { color: Colors.textPrimary, fontWeight: '600' },
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="workout/all-exercises"
              options={{
                headerShown: true,
                headerTitle: 'All Exercises',
                headerStyle: { backgroundColor: Colors.bg },
                headerTintColor: Colors.textPrimary,
                headerTitleStyle: { color: Colors.textPrimary, fontWeight: '600' },
                presentation: 'modal',
              }}
            />
          </Stack>
          </SyncProvider>

          {/* Guided tour overlay */}
          <GuidedTour />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingScreen: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
});
