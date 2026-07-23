import { BarcodeScanFrame } from '@/components/sell/BarcodeScanFrame';
import { Brand, Typography } from '@/constants/theme';
import { useSellTranslation } from '@/hooks/useSellTranslation';
import { getScanFrameSize } from '@/utils/layout';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from 'expo-router';
import { Flashlight, FlashlightOff } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

const SCAN_COOLDOWN_MS = 1800;

interface BarcodeScannerViewProps {
  height?: number;
  fill?: boolean;
  /** Unobstructed camera height above the cart sheet overlap */
  visibleCameraHeight?: number;
  flash: boolean;
  onFlashToggle?: () => void;
  onBarcodeScanned: (barcode: string) => void | Promise<void>;
  /** When set, overrides route focus for camera activation (e.g. in a modal). */
  active?: boolean;
  showTorch?: boolean;
}

export function BarcodeScannerView({
  height,
  fill = false,
  visibleCameraHeight,
  flash,
  onFlashToggle,
  onBarcodeScanned,
  active,
  showTorch = true,
}: BarcodeScannerViewProps) {
  const t = useSellTranslation();
  const isFocused = useIsFocused();
  const cameraActive = active ?? isFocused;
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [scanLocked, setScanLocked] = useState(false);
  const lastBarcodeRef = useRef<string | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layoutHeight = layout.height;
  const layoutWidth = layout.width;

  const { frameWidth, frameHeight } =
    layoutWidth > 0 && layoutHeight > 0
      ? getScanFrameSize(layoutWidth, layoutHeight)
      : { frameWidth: 210, frameHeight: 72 };

  const hintGap = 10;
  const hintHeight = 18;
  const blockHeight = frameHeight + hintGap + hintHeight;
  const frameTop =
    layoutHeight > 0 ? Math.max(0, Math.round((layoutHeight - blockHeight) / 2)) : 0;
  const frameLeft = layoutWidth > 0 ? (layoutWidth - frameWidth) / 2 : 0;

  const scanningEnabled = cameraActive && !scanLocked;
  const torchFabTop = 16;

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  useEffect(() => {
    if (!cameraActive) {
      setScanLocked(false);
      lastBarcodeRef.current = null;
    }
  }, [cameraActive]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height: measuredHeight } = event.nativeEvent.layout;
    setLayout({ width, height: measuredHeight });
  };

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      const data = result.data?.trim();
      if (!data || scanLocked || data === lastBarcodeRef.current) return;

      lastBarcodeRef.current = data;
      setScanLocked(true);

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await onBarcodeScanned(data);
      } finally {
        cooldownRef.current = setTimeout(() => {
          setScanLocked(false);
          lastBarcodeRef.current = null;
        }, SCAN_COOLDOWN_MS);
      }
    },
    [onBarcodeScanned, scanLocked]
  );

  return (
    <View
      style={[styles.wrap, fill ? styles.wrapFill : height != null ? { height } : null]}
      onLayout={handleLayout}
    >
      {cameraActive ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flash}
          onBarcodeScanned={scanningEnabled ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
          }}
        />
      ) : (
        <View style={styles.cameraPaused} />
      )}

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {layoutWidth > 0 && layoutHeight > 0 && (
          <>
            <View style={[styles.dim, { top: 0, left: 0, right: 0, height: frameTop }]} />
            <View
              style={[
                styles.dim,
                { top: frameTop + frameHeight, left: 0, right: 0, bottom: 0 },
              ]}
            />
            <View
              style={[
                styles.dim,
                { top: frameTop, left: 0, width: frameLeft, height: frameHeight },
              ]}
            />
            <View
              style={[
                styles.dim,
                { top: frameTop, right: 0, width: frameLeft, height: frameHeight },
              ]}
            />
          </>
        )}

        <View
          style={[
            styles.scanBlock,
            layoutHeight > 0
              ? {
                  top: frameTop,
                  left: frameLeft,
                  width: frameWidth,
                }
              : styles.scanBlockCentered,
          ]}
        >
          <BarcodeScanFrame width={frameWidth} height={frameHeight} animate={scanningEnabled} />
          <Text style={styles.scanHint}>{t.scanHint}</Text>
        </View>
      </View>

      {showTorch && onFlashToggle ? (
        <Pressable
          onPress={onFlashToggle}
          hitSlop={8}
          style={({ pressed }) => [
            styles.torchFab,
            { top: torchFabTop },
            flash && styles.torchFabActive,
            pressed && styles.torchFabPressed,
          ]}
        >
          {flash ? (
            <FlashlightOff size={22} color="#fff" />
          ) : (
            <Flashlight size={22} color="#fff" />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  wrapFill: {
    flex: 1,
  },
  cameraPaused: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#141414',
  },
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scanBlock: {
    position: 'absolute',
    alignItems: 'center',
  },
  scanBlockCentered: {
    top: '50%',
    left: '50%',
    transform: [{ translateX: -105 }, { translateY: -50 }],
  },
  scanHint: {
    ...Typography.caption1,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 10,
    textAlign: 'center',
  },
  torchFab: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchFabActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  torchFabPressed: {
    opacity: 0.88,
  },
});
