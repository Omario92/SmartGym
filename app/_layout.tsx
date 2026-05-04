/**
 * Root layout — sets up providers, fonts, splash screen, and guided tour.
 * Waits for Zustand persist hydration before rendering screens.
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/lib/theme';
import { useStore } from '@/store';
import { GuidedTour } from '@/components/tour/GuidedTour';

const FIRST_LAUNCH_KEY = '@smartgym_first_launch';

export default function RootLayout() {
  const startTour = useStore(s => s.startTour);
  const setFirstLaunch = useStore(s => s.setFirstLaunch);
  const updateSettings = useStore(s => s.updateSettings);

  // Wait for zustand/persist to rehydrate from AsyncStorage before rendering tabs.
  // This prevents the empty-state flash that occurs when sessions/routines load asynchronously.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // useStore.persist.hasHydrated() may already be true if rehydration is fast
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

  // Splash-like loading screen while store rehydrates from AsyncStorage
  if (!hydrated) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
            }}
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

        {/* Guided tour overlay — sits on top of everything */}
        <GuidedTour />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingScreen: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
});
