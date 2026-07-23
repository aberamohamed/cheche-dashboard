import { API_CONFIG } from '@/config/api';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface TaxDocumentHtmlPreviewProps {
  html?: string | null;
  uri?: string | null;
  loading?: boolean;
  error?: string | null;
  height?: number;
}

function prepareHtmlDocument(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return trimmed;
  if (/<html[\s>]/i.test(trimmed)) return trimmed;
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  </head>
  <body>${trimmed}</body>
</html>`;
}

export function TaxDocumentHtmlPreview({
  html,
  uri,
  loading = false,
  error,
  height = 280,
}: TaxDocumentHtmlPreviewProps) {
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState<string | null>(null);

  const preparedHtml = useMemo(
    () => (html ? prepareHtmlDocument(html) : null),
    [html]
  );
  const hasSource = !!(preparedHtml || uri);

  useEffect(() => {
    setWebViewError(null);
    setWebViewLoading(!!hasSource);
  }, [preparedHtml, uri, hasSource]);

  if (!hasSource) {
    if (loading) {
      return (
        <View style={[styles.wrap, { height }]}>
          <ActivityIndicator size="small" color={Brand.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.wrap, styles.errorWrap, { height }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.wrap, styles.errorWrap, { height }]}>
        <Text style={styles.errorText}>Preview unavailable.</Text>
      </View>
    );
  }

  const displayError = webViewError ?? error;

  return (
    <View style={[styles.wrap, { height }]} collapsable={false}>
      {displayError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{displayError}</Text>
        </View>
      ) : null}
      <WebView
        source={
          preparedHtml
            ? { html: preparedHtml, baseUrl: API_CONFIG.baseUrl }
            : { uri: uri! }
        }
        style={[styles.webview, { height }]}
        containerStyle={styles.webviewContainer}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={Brand.primary} />
          </View>
        )}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit={false}
        scrollEnabled
        nestedScrollEnabled
        showsVerticalScrollIndicator
        setSupportMultipleWindows={false}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        onLoadStart={() => {
          setWebViewLoading(true);
          setWebViewError(null);
        }}
        onLoadEnd={() => setWebViewLoading(false)}
        onError={() => setWebViewError('Unable to render preview.')}
        onHttpError={() => setWebViewError('Unable to load preview document.')}
      />
      {loading || webViewLoading ? (
        <View style={styles.refreshOverlay}>
          <ActivityIndicator size="small" color={Brand.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  errorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  webviewContainer: {
    flex: 1,
    width: '100%',
  },
  webview: {
    width: '100%',
    backgroundColor: Colors.white,
    opacity: 0.99,
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  refreshOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    zIndex: 1,
  },
});
