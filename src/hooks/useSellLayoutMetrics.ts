import { clamp } from '@/utils/layout';
import { useWindowDimensions } from 'react-native';

export function useSellLayoutMetrics() {
  const { height, width } = useWindowDimensions();

  const scannerHeight = Math.round(clamp(height * 0.19, 118, 178));
  const sheetOverlap = Math.round(clamp(scannerHeight * 0.14, 18, 34));
  const sheetTopRadius = Math.round(clamp(width * 0.06, 20, 28));

  const emptyIllustrationSize = Math.round(clamp(width * 0.28, 96, 128));
  const horizontalPadding = Math.round(clamp(width * 0.04, 14, 20));

  return {
    scannerHeight,
    sheetOverlap,
    sheetTopRadius,
    emptyIllustrationSize,
    horizontalPadding,
    windowHeight: height,
    windowWidth: width,
  };
}
