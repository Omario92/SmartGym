/**
 * SecureStoreAdapter — a Supabase `auth.storage` adapter that keeps the session
 * (access + refresh tokens) in the device Keychain / Keystore via
 * `expo-secure-store` instead of AsyncStorage.
 *
 * Why:
 *  - AsyncStorage is plaintext; auth tokens should live in secure storage.
 *  - SecureStore rejects/ warns on values over ~2 KB, and a Supabase session
 *    (JWT access token + refresh token + user metadata) can exceed that — so we
 *    transparently CHUNK the value across multiple secured keys.
 *
 * Resilience:
 *  - `expo-secure-store` is loaded defensively. If the native module is missing
 *    (Expo Go without it, or a dev/prod build made before the package was added)
 *    the adapter transparently FALLS BACK to AsyncStorage instead of throwing at
 *    import time — so a missing module never crashes app startup.
 *  - Web has no SecureStore, so it also uses AsyncStorage (localStorage).
 *  - One-time migration: a value found only in the legacy AsyncStorage key is
 *    copied into SecureStore and the old key removed.
 *  - Every operation is wrapped; failures resolve to null / no-op.
 *
 * To actually use SecureStore: `npx expo install expo-secure-store`, then create
 * a fresh dev/prod build (adding a native module requires a rebuild — it won't
 * appear in an existing binary or a mismatched Expo Go).
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

// Load the native module defensively — `requireNativeModule` throws
// synchronously if the native side is absent, which would otherwise crash the
// whole app at import time (Supabase → this adapter → import).
let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
} catch {
  SecureStore = null;
  console.warn(
    '[secureStore] expo-secure-store native module unavailable — ' +
      'falling back to AsyncStorage. Install it and rebuild to enable secure token storage.'
  );
}

const canUseSecureStore = !isWeb && SecureStore != null;

// SecureStore warns above 2048 bytes; keep headroom for multi-byte chars.
const CHUNK_SIZE = 1800;

// SecureStore keys may only contain [A-Za-z0-9._-]. Supabase keys already
// satisfy this, but sanitize defensively so we never throw on a bad key.
const sanitize = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');
const countKey = (base: string) => `${base}.__n`;
const chunkKey = (base: string, i: number) => `${base}.${i}`;

// ─── Plain AsyncStorage fallback (web + missing native module) ─────────────────

async function asyncGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}
async function asyncSet(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.warn('[secureStore] async set failed for', key, e);
  }
}
async function asyncRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('[secureStore] async remove failed for', key, e);
  }
}

// ─── Native (chunked SecureStore) ──────────────────────────────────────────────

async function nativeRemove(key: string): Promise<void> {
  const store = SecureStore!;
  const base = sanitize(key);
  try {
    const meta = await store.getItemAsync(countKey(base));
    if (meta != null) {
      const count = parseInt(meta, 10) || 0;
      for (let i = 0; i < count; i++) {
        await store.deleteItemAsync(chunkKey(base, i));
      }
      await store.deleteItemAsync(countKey(base));
    }
    // Also clear any non-chunked legacy value written directly under the key.
    await store.deleteItemAsync(base);
  } catch (e) {
    console.warn('[secureStore] remove failed for', key, e);
  }
}

async function nativeSet(key: string, value: string): Promise<void> {
  const store = SecureStore!;
  const base = sanitize(key);
  // Tokens must stay readable after backgrounding (for autoRefresh), so use
  // AFTER_FIRST_UNLOCK rather than the WHEN_UNLOCKED default. iOS-only.
  const options = { keychainAccessible: store.AFTER_FIRST_UNLOCK };
  try {
    // Clear previous chunks first so a shorter value doesn't leave stragglers.
    await nativeRemove(key);

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    for (let i = 0; i < chunks.length; i++) {
      await store.setItemAsync(chunkKey(base, i), chunks[i], options);
    }
    await store.setItemAsync(countKey(base), String(chunks.length), options);
  } catch (e) {
    console.warn('[secureStore] set failed for', key, e);
  }
}

async function nativeGet(key: string): Promise<string | null> {
  const store = SecureStore!;
  const base = sanitize(key);
  try {
    const meta = await store.getItemAsync(countKey(base));
    if (meta == null) {
      // No chunked value — try a non-chunked legacy value under the raw key.
      return await store.getItemAsync(base);
    }
    const count = parseInt(meta, 10);
    if (!Number.isFinite(count) || count <= 0) return null;

    let result = '';
    for (let i = 0; i < count; i++) {
      const part = await store.getItemAsync(chunkKey(base, i));
      if (part == null) {
        // Partial/corrupted write — treat as absent so Supabase re-auths cleanly.
        return null;
      }
      result += part;
    }
    return result;
  } catch (e) {
    console.warn('[secureStore] get failed for', key, e);
    return null;
  }
}

/** One-time migration from the legacy AsyncStorage key into SecureStore. */
async function migrateFromAsyncStorage(key: string): Promise<string | null> {
  try {
    const legacy = await AsyncStorage.getItem(key);
    if (legacy == null) return null;
    await nativeSet(key, legacy);
    // Only remove the old key if the value is now readable from SecureStore.
    const verify = await nativeGet(key);
    if (verify === legacy) {
      await AsyncStorage.removeItem(key);
    }
    return legacy;
  } catch (e) {
    console.warn('[secureStore] migration failed for', key, e);
    return null;
  }
}

// ─── Public adapter (Supabase auth.storage shape) ──────────────────────────────

export const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (!canUseSecureStore) return asyncGet(key);
    const existing = await nativeGet(key);
    if (existing != null) return existing;
    return migrateFromAsyncStorage(key);
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (!canUseSecureStore) return asyncSet(key, value);
    await nativeSet(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    if (!canUseSecureStore) return asyncRemove(key);
    await nativeRemove(key);
  },
};
