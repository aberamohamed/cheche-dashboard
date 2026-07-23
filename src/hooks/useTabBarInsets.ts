import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_CONTENT_HEIGHT = 56;
const TAB_PADDING_TOP = 8;
const ANDROID_SIDE_NAV_PADDING = 8;
const ANDROID_BOTTOM_NAV_EXTRA = 8;
/** Classic 3-button nav bar height when safe-area bottom inset is not reported. */
export const ANDROID_BUTTON_NAV_BAR_HEIGHT = 48;
const SELL_BOTTOM_EXTRA_PADDING = 12;
const IOS_TAB_HEIGHT = 88;
const IOS_TAB_PADDING_BOTTOM = 28;

/**
 * Tab bar safe-area padding.
 * Android bottom gesture/3-button nav → full bottom inset.
 * Android side-button nav (no bottom inset) → small padding only.
 */
export function useTabBarInsets() {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'ios') {
    return {
      height: IOS_TAB_HEIGHT,
      paddingTop: TAB_PADDING_TOP,
      paddingBottom: IOS_TAB_PADDING_BOTTOM,
      hasBottomSystemNav: true,
    };
  }

  if (Platform.OS === 'android') {
    const hasBottomSystemNav = insets.bottom > 0;
    const paddingBottom = hasBottomSystemNav
      ? insets.bottom + ANDROID_BOTTOM_NAV_EXTRA
      : ANDROID_SIDE_NAV_PADDING;

    return {
      height: TAB_CONTENT_HEIGHT + TAB_PADDING_TOP + paddingBottom,
      paddingTop: TAB_PADDING_TOP,
      paddingBottom,
      hasBottomSystemNav,
    };
  }

  return {
    height: TAB_CONTENT_HEIGHT + TAB_PADDING_TOP + ANDROID_SIDE_NAV_PADDING,
    paddingTop: TAB_PADDING_TOP,
    paddingBottom: ANDROID_SIDE_NAV_PADDING,
    hasBottomSystemNav: false,
  };
}

export function getTabBarContentPaddingBottom(
  platform: typeof Platform.OS,
  bottomInset: number,
): number {
  if (platform === 'ios') {
    return 16;
  }

  if (platform === 'android') {
    const hasBottomSystemNav = bottomInset > 0;
    const tabBarPaddingBottom = hasBottomSystemNav
      ? bottomInset + ANDROID_BOTTOM_NAV_EXTRA
      : ANDROID_SIDE_NAV_PADDING;
    return TAB_CONTENT_HEIGHT + TAB_PADDING_TOP + tabBarPaddingBottom + 8;
  }

  return 16;
}

/** Bottom padding for Sell (tab bar hidden). Handles Android 3-button nav when inset is 0. */
export function getSellBottomPadding(
  platform: typeof Platform.OS,
  bottomInset: number,
): number {
  if (platform !== 'android') {
    return Math.max(bottomInset, 8);
  }

  if (bottomInset > 0) {
    return bottomInset + SELL_BOTTOM_EXTRA_PADDING;
  }

  return ANDROID_BUTTON_NAV_BAR_HEIGHT + SELL_BOTTOM_EXTRA_PADDING;
}

export function useSellBottomPadding(): number {
  const { bottom } = useSafeAreaInsets();
  return getSellBottomPadding(Platform.OS, bottom);
}
