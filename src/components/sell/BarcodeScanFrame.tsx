import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const CORNER = 28;
const THICK = 3;
const ORANGE = '#FF9500';
const SCAN_LINE = '#FF3B30';
const LINE_HEIGHT = 2;
const LINE_PADDING = 10;

interface BarcodeScanFrameProps {
  width?: number;
  height?: number;
  animate?: boolean;
}

export function BarcodeScanFrame({
  width = 240,
  height = 100,
  animate = true,
}: BarcodeScanFrameProps) {
  const lineAnim = useRef(new Animated.Value(0)).current;
  const travel = Math.max(0, height - LINE_PADDING * 2 - LINE_HEIGHT);

  useEffect(() => {
    if (!animate || travel <= 0) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: travel,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [animate, lineAnim, travel]);

  return (
    <View style={[styles.frame, { width, height }]}>
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />

      <Animated.View
        style={[
          styles.scanLine,
          {
            top: LINE_PADDING,
            transform: [{ translateY: lineAnim }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    zIndex: 1,
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: THICK,
    borderLeftWidth: THICK,
    borderColor: ORANGE,
    borderTopLeftRadius: 6,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: THICK,
    borderRightWidth: THICK,
    borderColor: ORANGE,
    borderTopRightRadius: 6,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: THICK,
    borderLeftWidth: THICK,
    borderColor: ORANGE,
    borderBottomLeftRadius: 6,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: THICK,
    borderRightWidth: THICK,
    borderColor: ORANGE,
    borderBottomRightRadius: 6,
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: LINE_HEIGHT,
    backgroundColor: SCAN_LINE,
    borderRadius: 1,
    shadowColor: SCAN_LINE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 6,
    elevation: 4,
  },
});
