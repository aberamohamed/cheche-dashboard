import { Brand, Colors, Typography } from '@/constants/theme';
import { Platform } from 'react-native';

/** Standard top padding below the safe area for screen headers with a back button. */
export const SCREEN_HEADER_PADDING_TOP = Platform.OS === 'android' ? 10 : 4;

export const SCREEN_HEADER_PADDING_BOTTOM = 12;

/** Invoice / Withholding title headers — room before tabs or search. */
export const TAB_TITLE_SCREEN_HEADER_PADDING_BOTTOM = Platform.OS === 'android' ? 24 : 18;

export const TAB_TITLE_SCREEN_HEADER_MIN_HEIGHT = Platform.OS === 'android' ? 88 : 80;

export const tabTitleScreenHeaderRowPadding = {
  paddingTop: SCREEN_HEADER_PADDING_TOP,
  paddingBottom: TAB_TITLE_SCREEN_HEADER_PADDING_BOTTOM,
} as const;

/** Minimum recommended touch target — Material 48dp on Android. */
export const SCREEN_HEADER_SIDE_SIZE = Platform.OS === 'android' ? 44 : 36;

export const SCREEN_HEADER_BACK_HIT_SLOP =
  Platform.OS === 'android'
    ? { top: 20, bottom: 20, left: 20, right: 20 }
    : 12;

export const SCREEN_HEADER_BACK_PRESS_RETENTION = {
  top: 28,
  bottom: 28,
  left: 28,
  right: 28,
} as const;

export const screenHeaderRowPadding = {
  paddingTop: SCREEN_HEADER_PADDING_TOP,
  paddingBottom: SCREEN_HEADER_PADDING_BOTTOM,
} as const;

/** Bottom sheets / modals — no extra top inset below the drag handle. */
export const MODAL_SHEET_PADDING_TOP = 0;

export const MODAL_SHEET_PADDING_BOTTOM = 12;

export const screenHeaderTitleText = {
  ...Typography.headline,
  fontWeight: '700' as const,
  textAlign: 'center' as const,
};

export const screenHeaderTitleTextLeft = {
  ...screenHeaderTitleText,
  textAlign: 'left' as const,
};

export const screenHeaderSubtitleText = {
  ...Typography.footnote,
  color: Brand.primary,
  textAlign: 'center' as const,
  marginTop: 2,
};

export const screenHeaderSubtitleTextLeft = {
  ...screenHeaderSubtitleText,
  textAlign: 'left' as const,
};

export const modalSheetHeaderTitleText = {
  ...screenHeaderTitleText,
  color: Colors.text,
};

export const modalSheetHeaderSubtitleText = {
  ...screenHeaderSubtitleText,
};

export const modalSheetHeaderTitleTextOnGradient = {
  ...screenHeaderTitleText,
  color: Colors.white,
};

export const modalSheetHeaderSubtitleTextOnGradient = {
  ...Typography.footnote,
  color: 'rgba(255, 255, 255, 0.82)',
  textAlign: 'center' as const,
  marginTop: 2,
};
