import { ShareChannelRow } from '@/components/receipt/ShareChannelRow';
import { ThermalReceiptPreview } from '@/components/receipt/ThermalReceiptPreview';
import { LanguageDropdown } from '@/components/settings/LanguageDropdown';
import { Modal } from '@/components/ui/Modal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SCREEN_HEADER_SIDE_SIZE } from '@/constants/screenHeader';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useCheckoutTranslation } from '@/hooks/useCheckoutTranslation';
import { getThermalReceiptStrings } from '@/i18n/thermalReceipt';
import {
  downloadThermalReceipt,
  hasTaxDocumentReference,
  printThermalReceipt,
  ReceiptSaveCancelledError,
} from '@/services/receiptService';
import { useAuthStore } from '@/store/authStore';
import { useReceiptStore } from '@/store/receiptStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { ReceiptData } from '@/types/receipt';
import { appAlert } from '@/utils/alert';
import { enrichReceiptWithOrganization, buildThermalReceiptHtmlAsync } from '@/utils/thermalReceiptHtml';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Download, Plus, Printer, Share2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PreviewMode = 'download' | 'print';

function parsePreviewMode(value: unknown): PreviewMode | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'download' || raw === 'print') return raw;
  return undefined;
}

export default function ThermalReceiptPreviewScreen() {
  const t = useCheckoutTranslation();
  const { invoiceNumber, mode: modeParam } = useLocalSearchParams<{
    invoiceNumber?: string;
    mode?: string | string[];
  }>();
  const storedReceipt = useReceiptStore((s) => s.receipt);
  const thermalPreviewReceipt = useReceiptStore((s) => s.thermalPreviewReceipt);
  const clearThermalPreviewReceipt = useReceiptStore((s) => s.clearThermalPreviewReceipt);
  const business = useAuthStore((s) => s.business);
  const user = useAuthStore((s) => s.user);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const [actionLoading, setActionLoading] = useState<'print' | 'download' | null>(null);
  // A fiscal receipt should only be printed once; disable Print after a successful print.
  const [hasPrinted, setHasPrinted] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  const previewMode = parsePreviewMode(modeParam);
  const showDownload = previewMode !== 'print';
  const showPrint = previewMode !== 'download';
  const singleAction = previewMode !== undefined;
  // Post-checkout screen (no explicit mode): download moves to the header icon
  // and the footer offers "New Sale" + Print instead of "Download" + Print.
  const showHeaderDownload = !singleAction && showDownload;
  const showFooterDownload = singleAction && showDownload;
  const showNewSale = !singleAction;

  const sourceReceipt = thermalPreviewReceipt ?? storedReceipt;

  const receiptData = useMemo((): ReceiptData | null => {
    if (!sourceReceipt) return null;
    return enrichReceiptWithOrganization(sourceReceipt, business, user);
  }, [business, sourceReceipt, user]);

  const [thermalHtml, setThermalHtml] = useState('');
  const [htmlLoading, setHtmlLoading] = useState(false);

  useEffect(() => {
    if (!receiptData) {
      setThermalHtml('');
      return;
    }
    let cancelled = false;
    setHtmlLoading(true);
    void buildThermalReceiptHtmlAsync(receiptData, {
      variant: 'preview',
      languageId: language,
      strings: getThermalReceiptStrings(language),
    })
      .then((html) => {
        if (!cancelled) setThermalHtml(html);
      })
      .finally(() => {
        if (!cancelled) setHtmlLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [receiptData, language]);

  const handleBack = () => {
    clearThermalPreviewReceipt();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/sell');
  };

  const handleNewSale = () => {
    clearThermalPreviewReceipt();
    router.replace('/(tabs)/sell');
  };

  const openShare = () => {
    if (!receiptData || !hasTaxDocumentReference(receiptData)) {
      appAlert(t.documentUnavailable, t.taxDocumentReferenceMissing, undefined, {
        variant: 'error',
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareVisible(true);
  };

  const runAction = async (kind: 'print' | 'download') => {
    if (!receiptData) {
      appAlert(t.receiptUnavailable, t.receiptIrnNotFound, undefined, { variant: 'error' });
      return;
    }

    try {
      setActionLoading(kind);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (kind === 'print') {
        await printThermalReceipt(receiptData);
        setHasPrinted(true);
      } else {
        await downloadThermalReceipt(receiptData);
        appAlert(t.downloaded, t.receiptSaved, undefined, { variant: 'success' });
      }
    } catch (error) {
      if (error instanceof ReceiptSaveCancelledError) {
        return;
      }
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
        onBack={handleBack}
        right={
          receiptData ? (
            <View style={styles.headerRight}>
              <LanguageDropdown
                selectedId={language}
                onSelect={(id) => void setLanguage(id)}
                variant="default"
              />
              {showHeaderDownload ? (
                <Pressable
                  style={({ pressed }) => [styles.headerIconBtn, pressed && styles.footerBtnPressed]}
                  onPress={() => runAction('download')}
                  disabled={actionLoading !== null}
                  accessibilityRole="button"
                  accessibilityLabel={t.download}
                  hitSlop={8}
                >
                  {actionLoading === 'download' ? (
                    <ActivityIndicator color={Brand.primary} size="small" />
                  ) : (
                    <Download size={18} color={Brand.primary} />
                  )}
                </Pressable>
              ) : null}
            </View>
          ) : undefined
        }
      />

      {sourceReceipt?.provisional ? (
        <View style={styles.provisionalBanner}>
          <Text style={styles.provisionalText}>
            Provisional receipt — saved offline. A fiscal receipt with IRN will be issued once this
            sale syncs.
          </Text>
        </View>
      ) : null}

      {receiptData && thermalHtml ? (
        <View style={styles.previewWrap}>
          <ThermalReceiptPreview html={thermalHtml} />
        </View>
      ) : receiptData && htmlLoading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t.receiptUnavailable}</Text>
        </View>
      )}

      {receiptData && (showFooterDownload || showNewSale || showPrint) ? (
        <SafeAreaView style={styles.footerSafe} edges={['bottom']}>
          <View style={styles.footer}>
            {showNewSale ? (
              <Pressable
                style={({ pressed }) => [
                  styles.footerBtn,
                  styles.footerBtnSecondary,
                  pressed && styles.footerBtnPressed,
                  actionLoading !== null && styles.footerBtnDisabled,
                ]}
                onPress={handleNewSale}
                disabled={actionLoading !== null}
              >
                <Plus size={18} color={Brand.primary} />
                <Text style={styles.footerBtnSecondaryText}>{t.newSale}</Text>
              </Pressable>
            ) : null}

            {showFooterDownload ? (
              <Pressable
                style={({ pressed }) => [
                  styles.footerBtn,
                  styles.footerBtnSecondary,
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

            <Pressable
              style={({ pressed }) => [
                styles.footerBtn,
                styles.footerBtnSecondary,
                pressed && styles.footerBtnPressed,
                actionLoading !== null && styles.footerBtnDisabled,
              ]}
              onPress={openShare}
              disabled={actionLoading !== null}
              accessibilityRole="button"
              accessibilityLabel={t.share}
            >
              <Share2 size={18} color={Brand.primary} />
              <Text style={styles.footerBtnSecondaryText}>{t.share}</Text>
            </Pressable>

            {showPrint ? (
              <Pressable
                style={({ pressed }) => [
                  styles.footerBtn,
                  styles.footerBtnPrimary,
                  pressed && styles.footerBtnPressed,
                  (actionLoading !== null || hasPrinted) && styles.footerBtnDisabled,
                ]}
                onPress={() => runAction('print')}
                disabled={actionLoading !== null || hasPrinted}
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

      <Modal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        title={t.share}
        keyboardAvoiding
        fitContent
      >
        {receiptData ? (
          <ShareChannelRow
            data={receiptData}
            onError={(message) => appAlert(t.error, message, undefined, { variant: 'error' })}
          />
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  headerIconBtn: {
    width: SCREEN_HEADER_SIDE_SIZE,
    height: SCREEN_HEADER_SIDE_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.primaryMuted,
  },
  provisionalBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  provisionalText: {
    ...Typography.caption1,
    color: '#C2410C',
  },
  previewWrap: {
    flex: 1,
    minHeight: 0,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
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
