/**
 * types/auth.ts
 *
 * Authentication domain types.
 */

export interface AuthUser {
  id: string;
  email: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  /** OAuth provider: 'email' | 'google' | 'apple' */
  provider?: string;
  /** ISO timestamp of account creation */
  createdAt?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  /** Unix timestamp (seconds) when token expires */
  expiresAt?: number;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}
