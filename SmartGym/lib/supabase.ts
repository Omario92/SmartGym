/**
 * Supabase client — configured for React Native.
 * Uses EXPO_PUBLIC_ prefixed env vars so they are safe to bundle in the client.
 *
 * Auth session (access + refresh tokens) is persisted in the device Keychain /
 * Keystore via a chunked expo-secure-store adapter (see ./secureStoreAdapter),
 * not plaintext AsyncStorage. The adapter migrates any pre-existing AsyncStorage
 * session into SecureStore on first read.
 */

import { createClient } from '@supabase/supabase-js';
import { SecureStoreAdapter } from './secureStoreAdapter';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[SmartGym] Missing Supabase env vars. ' +
    'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Convenience re-export of the auth helper */
export const supabaseAuth = supabase.auth;
