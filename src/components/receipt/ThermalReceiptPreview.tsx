import { Colors } from '@/constants/theme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface ThermalReceiptPreviewProps {
  html: string;
}

const MEASURE_HEIGHT_SCRIPT = `
  (function () {
    function postHeight() {
      var height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
      window.ReactNativeWebView.postMessage(String(height));
    }
    postHeight();
    setTimeout(postHeight, 60);
    setTimeout(postHeight, 300);
  })();
  true;
`;

export function ThermalReceiptPreview({ html }: ThermalReceiptPreviewProps) {
  const [contentHeight, setContentHeight] = useState(0);
  const source = useMemo(() => ({ html }), [html]);

  useEffect(() => {
    setContentHeight(0);
  }, [html]);

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    const next = Number(event.nativeEvent.data);
    if (Number.isFinite(next) && next > 0) {
      setContentHeight((current) => (next > current ? next : current));
    }
  }, []);

  return (
    <View style={styles.wrap}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <View style={styles.paper}>
          <WebView
            source={source}
            style={[styles.webview, { height: Math.max(contentHeight, 1) }]}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            originWhitelist={['*']}
            javaScriptEnabled
            onMessage={onMessage}
            injectedJavaScript={MEASURE_HEIGHT_SCRIPT}
            scalesPageToFit={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  paper: {
    width: '100%',
    backgroundColor: Colors.white,
  },
  webview: {
    width: '100%',
    backgroundColor: Colors.white,
    opacity: 0.99,
  },
});
