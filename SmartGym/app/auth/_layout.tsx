/**
 * Auth layout — bare stack with no header.
 * Screens: login, register
 */
import { Stack } from 'expo-router';
import { Colors } from '@/lib/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />
  );
}
