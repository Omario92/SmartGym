/**
 * Admin gate — decides whether the signed-in user sees the Admin Tools.
 *
 * This is a UI-only gate: it controls visibility of maintenance buttons
 * (cache refresh, feature flags) that are themselves harmless. Real data
 * privileges are enforced by Supabase RLS + service-role, NOT by this check —
 * so a spoofed email here can't do anything a normal user couldn't.
 *
 * Configure via .env (comma-separated, case-insensitive):
 *   EXPO_PUBLIC_ADMIN_EMAILS=you@example.com,teammate@example.com
 * If unset, no one is treated as admin (the section stays hidden).
 */
const ADMIN_EMAILS = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
