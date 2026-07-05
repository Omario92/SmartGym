/**
 * SmartGym Design System
 * Dark-mode premium fitness app theme
 */

import { Platform } from 'react-native';

export const Colors = {
  // Primary neon green accent
  accent: '#00FF9D',
  accentDim: '#00CC7E',
  accentGlow: 'rgba(0, 255, 157, 0.15)',
  accentGlow2: 'rgba(0, 255, 157, 0.08)',

  // Backgrounds
  bg: '#0A0A0F',
  bgCard: '#13131A',
  bgCard2: '#1A1A24',
  bgCard3: '#1E1E2A',
  bgModal: '#16161F',
  bgInput: '#1E1E2A',

  // Surfaces / borders
  border: '#2A2A3A',
  borderLight: '#333344',
  divider: 'rgba(255,255,255,0.06)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9999BB',
  textMuted: '#55556A',
  textDisabled: '#3A3A50',

  // Status
  success: '#00FF9D',
  warning: '#FFB547',
  error: '#FF4D6D',
  info: '#4DA6FF',

  // Tab bar
  tabActive: '#00FF9D',
  tabInactive: '#555570',
  tabBg: '#0F0F17',

  // Premium gradient (purple-ish)
  premiumStart: '#7B2FFF',
  premiumEnd: '#C044FF',
  premiumGlow: 'rgba(123, 47, 255, 0.2)',

  // Chart colors
  chartLine: '#00FF9D',
  chartFill: 'rgba(0, 255, 157, 0.12)',
  chartGrid: 'rgba(255,255,255,0.05)',

  // Muscle group colors
  chest: '#FF6B6B',
  back: '#4DA6FF',
  legs: '#FFB547',
  shoulders: '#9B59B6',
  arms: '#00FF9D',
  core: '#FF8C42',

  // Transparent overlays
  overlay: 'rgba(0,0,0,0.75)',
  overlayLight: 'rgba(0,0,0,0.4)',
  spotlightBorder: 'rgba(0, 255, 157, 0.6)',

  // Icon system — "Option 02 / Premium Cinematic" palette (deliberately
  // distinct from the core brand accent, used for the Coach AI card,
  // panels and streak dots on the Routines screen).
  iconPanel: '#0C0E18',
  iconInactive: '#9697BE',
  iconActive: '#00F5A0',
  iconPremiumGold: '#FFD36A',
  iconCinematicViolet: '#8B5CFF',
  iconEnergyCyan: '#00D1FF',

  // Liquid glass surfaces
  glassBg: 'rgba(255,255,255,0.045)',
  glassBgStrong: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassBorderAccent: 'rgba(0, 255, 157, 0.45)',
  glassSheenTop: 'rgba(255,255,255,0.10)',
  glassSheenBottom: 'rgba(255,255,255,0.0)',
  glassHighlight: 'rgba(255,255,255,0.22)',

  // ── Semantic aliases (v2.1 UX pass) ──────────────────────────────────────
  // Prefer these over raw bgCard*/hex in screens so hierarchy stays consistent.
  surface: '#13131A',        // = bgCard   (default card)
  surfaceElevated: '#1A1A24', // = bgCard2  (raised / header rows)
  surfaceHigh: '#1E1E2A',    // = bgCard3  (highest surface / inputs)
  surfaceSunken: '#0C0E18',  // = iconPanel (recessed panels, search)

  // Text on filled surfaces
  textOnAccent: '#06070D',   // near-black for neon-green / cyan fills
  textOnDark: '#FFFFFF',
  textCoach: '#C8C8E0',      // muted lavender used on AI/coach gradient cards

  // Borders
  borderSubtle: 'rgba(150,151,190,0.20)', // search fields, week strip, sunken panels
  borderViolet: 'rgba(139,92,255,0.35)',  // coach / AI card outline

  // Scrims / overlays
  scrim: 'rgba(0,0,0,0.6)',
  scrimStrong: 'rgba(0,0,0,0.78)',
} as const;

/**
 * Gradient token tuples. Kept separate from `Colors` so they stay typed as
 * readonly string tuples (LinearGradient's `colors` prop). Always spread or
 * pass directly, e.g. `colors={Gradients.coach}`.
 */
export const Gradients = {
  /** Coach AI hero card (Routines tab) */
  coach: ['#2A1A4D', '#0E2A3A'] as const,
  /** Smart Trainer AI card (Explore tab) */
  aiExplore: ['#241238', '#0C2432'] as const,
  /** History overview card */
  history: ['#1C1330', '#0A1F2B'] as const,
  /** Violet→cyan pill used for AI CTAs */
  aiButton: [Colors.iconCinematicViolet, Colors.iconEnergyCyan] as const,
  /** Neon green→cyan primary CTA (auth, hero actions) */
  accentButton: [Colors.accent, Colors.iconEnergyCyan] as const,
  /** Gold premium CTA (upgrade button) */
  gold: [Colors.iconPremiumGold, '#F5B942'] as const,
  /** Tab bar background */
  tabBar: [Colors.bgCard3, Colors.tabBg] as const,
} as const;

export const Glass = {
  intensityCard: 32,
  intensityPanel: 45,
  intensityPill: 26,
  tint: 'dark' as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 56,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 40,
} as const;

export const FontFamily = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  displayRegular: 'SpaceGrotesk_400Regular',
  body: 'Satoshi-Regular',
  bodyMedium: 'Satoshi-Medium',
  bodyBold: 'Satoshi-Bold',
  bodyBlack: 'Satoshi-Black',
  bodyLight: 'Satoshi-Light',
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const Shadow = {
  accentGlow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumGlow: {
    shadowColor: Colors.premiumStart,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  /** Soft neutral lift for cards — cheaper than accentGlow, safe on Android */
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

// ─── Platform-safe helpers (v2.1 UX pass) ────────────────────────────────────

/**
 * Add alpha to a #RRGGBB hex. Returns an rgba() string.
 * `withAlpha('#00FF9D', 0.12)` → 'rgba(0,255,157,0.12)'.
 */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Platform-safe elevation. On iOS returns a soft colored shadow; on Android
 * colored shadows band and are unreliable, so we drop opacity/radius and lean
 * on `elevation` + the surface's own border instead. Use for cards that should
 * feel lifted without the heavy glow.
 */
export function elevate(
  level: 1 | 2 | 3 = 2,
  color: string = '#000'
): {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
} {
  const map = {
    1: { radius: 4, opacity: 0.18, offset: 1, elevation: 1 },
    2: { radius: 8, opacity: 0.28, offset: 3, elevation: 3 },
    3: { radius: 16, opacity: 0.4, offset: 6, elevation: 6 },
  } as const;
  const s = map[level];
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: s.offset },
      shadowOpacity: s.opacity,
      shadowRadius: s.radius,
      elevation: s.elevation,
    },
    default: {
      // Android: neutral shadow only; colored glows band badly.
      shadowColor: '#000',
      shadowOffset: { width: 0, height: s.offset },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: s.elevation,
    },
  }) as {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

/** Screen-level layout constants shared across tabs. */
export const Layout = {
  screenPaddingX: Spacing.xl,
  headerPaddingTop: Spacing.lg,
  sectionGap: Spacing.xl,
  minTapTarget: 44,
} as const;
