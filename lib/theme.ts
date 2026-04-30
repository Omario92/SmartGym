/**
 * SmartGym Design System
 * Dark-mode premium fitness app theme
 */

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
} as const;
