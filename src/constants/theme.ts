import { Platform, type ViewStyle } from 'react-native';

export const Brand = {
  primary: '#E30074',
  primaryLight: '#FF1A8C',
  primaryDark: '#B8005C',
  primaryMuted: '#FDF2F8',
  secondary: '#9D174D',
  /** Full-screen background gradient (Home, filter modal, etc.) */
  primaryGradient: ['#E30074', '#49011f', '#081023', '#020617'] as const,
  /** Compact header gradient — primary tones only */
  headerGradient: ['#E30074', '#B8005C', '#9D174D'] as const,
  /** Home light-mode header — pink left, subtle dark pink/black right */
  homeHeaderGradient: ['#E30074', '#C40068', '#9D174D', '#6C1838'] as const,
} as const;

export const Colors = {
  white: '#FFFFFF',
  background: '#F5F5F7',
  surface: '#FFFFFF',
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#AEAEB2',
  success: '#34C759',
  successBg: '#E8F9ED',
  warning: '#FF9500',
  warningBg: '#FFF4E5',
  danger: '#FF3B30',
  dangerBg: '#FFEBEA',
  shadow: 'rgba(0, 0, 0, 0.08)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, lineHeight: 41 },
  title1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  title3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 25 },
  headline: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
  callout: { fontSize: 16, fontWeight: '400' as const, lineHeight: 21 },
  subhead: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption1: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  caption2: { fontSize: 11, fontWeight: '400' as const, lineHeight: 13 },
} as const;

/** Screen/content cards — flat on Android (no elevation or shadow). */
function platformCardShadow(style: ViewStyle): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation: 0 };
  }
  return style;
}

export const Shadow = {
  card: platformCardShadow({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  }),
  iosCard: platformCardShadow({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  }),
  button: {
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 0 : 4,
  },
} as const;
