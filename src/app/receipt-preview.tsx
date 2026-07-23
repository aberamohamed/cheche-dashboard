import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useCheckoutTranslation } from '@/hooks/useCheckoutTranslation';
import {
  buildTaxDocumentUrl,
  downloadReceipt,
  printReceipt,
  type TaxDocumentKey,
} from '@/services/receiptService';
import { useReceiptStore } from '@/store/receiptStore';
import type { ReceiptData } from '@/types/receipt';
import { appAlert } from '@/utils/alert';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Download, Printer } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

type PreviewMode = 'download' | 'print';

function parsePreviewMode(value: unknown): PreviewMode | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'download' || raw === 'print') return raw;
  return undefined;
}

export default function ReceiptPreviewScreen() {
  const t = useCheckoutTranslation();
  const {
    irn: irnParam,
    rrn: rrnParam,
    invoiceNumber,
    mode: modeParam,
  } = useLocalSearchParams<{
    irn?: string;
    rrn?: string;
    invoiceNumber?: string;
    mode?: string | string[];
  }>();
  const storedReceipt = useReceiptStore((s) => s.receipt);
  const [actionLoading, setActionLoading] = useState<'print' | 'download' | null>(null);

  const previewMode = parsePreviewMode(modeParam);
  const showDownload = previewMode !== 'print';
  const showPrint = previewMode !== 'download';
  const singleAction = previewMode !== undefined;

  const resolvedRrn = rrnParam ?? storedReceipt?.rrn;
  const resolvedIrn = irnParam ?? storedReceipt?.irn;

  const documentKey: TaxDocumentKey | null = resolvedRrn ? 'rrn' : resolvedIrn ? 'irn' : null;
  const documentId = resolvedRrn ?? resolvedIrn ?? null;
  const documentUrl = documentKey && documentId ? buildTaxDocumentUrl(String(documentId), documentKey) : null;

  const receiptData = useMemo((): ReceiptData | null => {
    if (storedReceipt) {
      return {
        ...storedReceipt,
        ...(resolvedRrn ? { rrn: String(resolvedRrn) } : {}),
        ...(resolvedIrn ? { irn: String(resolvedIrn) } : {}),
      };
    }
    if (invoiceNumber && documentId) {
      return {
        invoiceNumber: String(invoiceNumber),
        ...(resolvedRrn ? { rrn: String(resolvedRrn) } : {}),
        ...(resolvedIrn ? { irn: String(resolvedIrn) } : {}),
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        paymentMethod: '',
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }, [storedReceipt, invoiceNumber, resolvedRrn, resolvedIrn, documentId]);

  const runAction = async (kind: 'print' | 'download') => {
    if (!receiptData?.rrn && !receiptData?.irn) {
      appAlert(
        t.documentUnavailable,
        documentKey === 'rrn'
          ? t.taxDocumentRrnMissing
          : t.taxDocumentIrnMissing,
        undefined,
        { variant: 'error' }
      );
      return;
    }

    try {
      setActionLoading(kind);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (kind === 'print') {
        await printReceipt(receiptData);
      } else {
        await downloadReceipt(receiptData);
        appAlert(t.downloaded, t.receiptSaved, undefined, { variant: 'success' });
      }
    } catch (error) {
      const detail =
        (error as { message?: string; code?: string } | undefined)?.message ??
        (error as { code?: string } | undefined)?.code ??
        String(error);
      const baseMessage = kind === 'print' ? t.unableToPrint : t.unableToDownload;
      appAlert(t.error, detail ? `${baseMessage}\n\n${detail}` : baseMessage, undefined, {
        variant: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={invoiceNumber ? String(invoiceNumber) : t.receiptPreview}
        onBack={() => router.back()}
      />

      <View style={styles.previewWrap}>
        {documentUrl ? (
          <WebView
            source={{ uri: documentUrl }}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoader}>
                <ActivityIndicator size="large" color={Brand.primary} />
              </View>
            )}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            title={t.receiptUnavailable}
            message={
              documentKey === 'rrn'
                ? t.receiptRrnNotFound
                : t.receiptIrnNotFound
            }
          />
        )}
      </View>

      {documentUrl && (showDownload || showPrint) ? (
        <SafeAreaView style={styles.footerSafe} edges={['bottom']}>
          <View style={styles.footer}>
            {showDownload ? (
              <Pressable
                style={({ pressed }) => [
                  styles.footerBtn,
                  styles.footerBtnSecondary,
                  singleAction && styles.footerBtnFull,
                  pressed && styles.footerBtnPressed,
                  actionLoading !== null && styles.footerBtnDisabled,
                ]}
                onPress={() => runAction('download')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'download' ? (
                  <ActivityIndicator color={Brand.primary} />
                ) : (
                  <Download size={18} color={Brand.primary} />
                )}
                <Text style={styles.footerBtnSecondaryText}>{t.download}</Text>
              </Pressable>
            ) : null}

            {showPrint ? (
              <Pressable
                style={({ pressed }) => [
                  styles.footerBtn,
                  styles.footerBtnPrimary,
                  singleAction && styles.footerBtnFull,
                  pressed && styles.footerBtnPressed,
                  actionLoading !== null && styles.footerBtnDisabled,
                ]}
                onPress={() => runAction('print')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'print' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Printer size={18} color="#fff" />
                )}
                <Text style={styles.footerBtnPrimaryText}>{t.print}</Text>
              </Pressable>
            ) : null}
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  previewWrap: { flex: 1, backgroundColor: Colors.white },
  webview: { flex: 1, backgroundColor: Colors.white },
  webviewLoader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  footerSafe: {
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerBtnFull: {
    flex: 1,
    width: '100%',
  },
  footerBtnPrimary: {
    backgroundColor: Brand.primary,
    ...Shadow.button,
  },
  footerBtnSecondary: {
    backgroundColor: Brand.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerBtnPressed: { opacity: 0.92 },
  footerBtnDisabled: { opacity: 0.65 },
  footerBtnPrimaryText: { ...Typography.subhead, color: '#fff', fontWeight: '700' },
  footerBtnSecondaryText: { ...Typography.subhead, color: Brand.primary, fontWeight: '700' },
});
