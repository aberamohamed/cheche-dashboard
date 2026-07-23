import {
  clearPendingThermalBitmapCapture,
  getPendingThermalBitmapCapture,
  setThermalBitmapCaptureListener,
  stripDataUrlBase64,
  THERMAL_BITMAP_WIDTH_PX,
} from '@/utils/thermalReceiptBitmap';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { WebView } from 'react-native-webview';

type ActiveJob = {
  html: string;
  widthPx: number;
  resolve: (base64: string) => void;
  reject: (error: Error) => void;
};

const MEASURE_SCRIPT = `
  (function () {
    function post() {
      var height = Math.max(
        document.body ? document.body.scrollHeight : 0,
        document.documentElement ? document.documentElement.scrollHeight : 0
      );
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
    }
    post();
    setTimeout(post, 80);
    setTimeout(post, 250);
    setTimeout(post, 500);
  })();
  true;
`;

/**
 * Off-screen host that turns thermal receipt HTML into a PNG for Ge'ez (Amharic) bitmap print.
 * Mount once near the app root.
 */
export function ThermalReceiptBitmapCaptureHost() {
  const captureWrapRef = useRef<View>(null);
  const [job, setJob] = useState<ActiveJob | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const capturingRef = useRef(false);

  const pullJob = useCallback(() => {
    const pending = getPendingThermalBitmapCapture();
    if (!pending) return;
    setJob((current) => {
      if (current) return current;
      setContentHeight(0);
      capturingRef.current = false;
      return {
        html: pending.html,
        widthPx: pending.widthPx || THERMAL_BITMAP_WIDTH_PX,
        resolve: pending.resolve,
        reject: pending.reject,
      };
    });
  }, []);

  useEffect(() => {
    setThermalBitmapCaptureListener(pullJob);
    pullJob();
    return () => {
      setThermalBitmapCaptureListener(null);
    };
  }, [pullJob]);

  const finishSuccess = useCallback((base64: string, active: ActiveJob) => {
    const clean = stripDataUrlBase64(base64);
    active.resolve(clean);
    clearPendingThermalBitmapCapture();
    setJob(null);
    setContentHeight(0);
    capturingRef.current = false;
  }, []);

  const finishError = useCallback((error: Error, active: ActiveJob) => {
    active.reject(error);
    clearPendingThermalBitmapCapture();
    setJob(null);
    setContentHeight(0);
    capturingRef.current = false;
  }, []);

  useEffect(() => {
    if (!job || contentHeight < 24 || capturingRef.current) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (cancelled || !captureWrapRef.current || capturingRef.current) return;
        capturingRef.current = true;
        try {
          const base64 = await captureRef(captureWrapRef, {
            format: 'png',
            quality: 1,
            result: 'base64',
            width: job.widthPx,
          });
          if (!base64) {
            throw new Error('Failed to capture receipt bitmap');
          }
          finishSuccess(String(base64), job);
        } catch (error) {
          finishError(error instanceof Error ? error : new Error(String(error)), job);
        }
      })();
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [contentHeight, finishError, finishSuccess, job]);

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        height?: number;
      };
      if (payload.type === 'height' && typeof payload.height === 'number' && payload.height > 0) {
        setContentHeight((current) => (payload.height! > current ? payload.height! : current));
      }
    } catch {
      // Ignore non-JSON messages.
    }
  }, []);

  if (!job) return null;

  const width = job.widthPx;
  const height = Math.max(contentHeight, 8);

  return (
    <View pointerEvents="none" style={styles.host} collapsable={false}>
      <View
        ref={captureWrapRef}
        collapsable={false}
        style={[styles.capture, { width, height }]}
      >
        <WebView
          source={{ html: job.html }}
          style={{ width, height, backgroundColor: '#FFFFFF', opacity: 0.99 }}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={['*']}
          javaScriptEnabled
          onMessage={onMessage}
          injectedJavaScript={MEASURE_SCRIPT}
          onError={() => finishError(new Error('Failed to render receipt for bitmap print'), job)}
          onHttpError={() =>
            finishError(new Error('Failed to render receipt for bitmap print'), job)
          }
          setBuiltInZoomControls={false}
          scalesPageToFit={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: -4000,
    top: 0,
    opacity: 1,
    zIndex: -1,
  },
  capture: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
});
