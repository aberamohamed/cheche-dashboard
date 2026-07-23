import { CancelEimsModal } from '@/components/invoicing/CancelEimsModal';
import { GenerateReceiptModal } from '@/components/invoicing/GenerateReceiptModal';
import {
  InvoiceMoreActionsSheet,
  type InvoiceMoreAction,
} from '@/components/invoicing/InvoiceMoreActionsSheet';
import { InvoiceMemoModal } from '@/components/invoicing/InvoiceMemoModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TransactionStatusBadges } from '@/components/invoicing/TransactionStatusBadges';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useCheckoutTranslation } from '@/hooks/useCheckoutTranslation';
import { getInvoiceStrings } from '@/i18n/invoice';
import { useSettingsStore } from '@/store/settingsStore';
import { ShareChannelRow } from '@/components/receipt/ShareChannelRow';
import { retryInvoiceEims, mapDetailToMemoLines } from '@/services/invoiceAdjustmentService';
import { transactionDetailToReceiptData, hasTaxDocumentReference } from '@/services/receiptService';
import { useReceiptStore } from '@/store/receiptStore';
import type { ReceiptData } from '@/types/receipt';
import type { TransactionDetail } from '@/types/transactionDetail';
import { appAlert } from '@/utils/alert';
import { copyToClipboard } from '@/utils/clipboard';
import { formatCurrency } from '@/utils/format';
import { isInvoicePayable } from '@/utils/invoicePayment';
import { areInvoicingDocumentActionsDisabled, isCancelledDocumentStatus, isFailedEirmsStatus } from '@/utils/transactionStatus';
import { resolveInvoicingApiId, resolveInvoicingRetryId } from '@/utils/invoicingIds';
import { format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Download, Copy, MoreVertical, Printer, RefreshCw, Share2, Wallet, Calendar, FileCheck, FileText, ShoppingBag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ReceiptDetail, WithholdingDetail } from '@/types/transactionDetail';

interface TransactionDetailModalProps {
  visible: boolean;
  detail: TransactionDetail | null;
  onClose: () => void;
  receiptData?: ReceiptData | null;
  onNewSale?: () => void;
  actionMode?: 'invoice' | 'receipt' | 'withholding';
  onInvoiceUpdated?: () => void;
  presentation?: 'modal' | 'screen';
}

function resolveDocumentData(
  detail: TransactionDetail | null,
  receiptData: ReceiptData | null | undefined
): ReceiptData | null {
  if (receiptData) return receiptData;
  if (!detail) return null;
  return transactionDetailToReceiptData(detail);
}

function resolvePreviewParams(
  detail: TransactionDetail | null,
  receiptData: ReceiptData | null | undefined,
  actionMode?: 'invoice' | 'receipt' | 'withholding'
): { invoiceNumber: string; irn?: string; rrn?: string } | null {
  const data = resolveDocumentData(detail, receiptData);
  if (!data || !hasTaxDocumentReference(data)) return null;

  const documentType: 'invoice' | 'receipt' =
    actionMode === 'receipt' || !!detail?.receipt ? 'receipt' : 'invoice';

  return {
    invoiceNumber: data.invoiceNumber,
    ...(documentType === 'receipt' && data.rrn ? { rrn: data.rrn } : {}),
    ...(documentType === 'invoice' && data.irn ? { irn: data.irn } : {}),
  };
}

function navigateToThermalReceiptPreview(params: {
  invoiceNumber: string;
  mode: 'download' | 'print';
}) {
  router.push(
    {
      pathname: '/thermal-receipt-preview',
      params: {
        invoiceNumber: params.invoiceNumber,
        mode: params.mode,
      },
    } as unknown as Href
  );
}

function navigateToReceiptPreview(params: {
  invoiceNumber: string;
  irn?: string;
  rrn?: string;
  mode: 'download' | 'print';
}) {
  router.push({
    pathname: '/receipt-preview',
    params: {
      invoiceNumber: params.invoiceNumber,
      mode: params.mode,
      ...(params.rrn ? { rrn: params.rrn } : {}),
      ...(params.irn ? { irn: params.irn } : {}),
    },
  });
}
const SUMMARY_CHAR_WIDTH = 7;
const SUMMARY_HORIZONTAL_INSET = 80;
const DETAIL_TOAST_DURATION_MS = 2000;

const DetailToastContext = createContext<((message: string) => void) | null>(null);

function shouldStackSummary(label: string, value: string, screenWidth: number): boolean {
  const available = screenWidth - SUMMARY_HORIZONTAL_INSET;
  const estimatedWidth =
    label.length * SUMMARY_CHAR_WIDTH + 12 + value.length * SUMMARY_CHAR_WIDTH;
  return estimatedWidth > available;
}

function CopyIconButton({ value }: { value: string }) {
  const t = useCheckoutTranslation();
  const showDetailToast = useContext(DetailToastContext);

  const handleCopy = async () => {
    try {
      await copyToClipboard(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDetailToast?.(t.copiedToClipboard);
    } catch {
      appAlert('Error', 'Unable to copy to clipboard.', undefined, { variant: 'error' });
    }
  };

  return (
    <Pressable
      onPress={handleCopy}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t.copy}
      style={styles.copyBtn}
    >
      <Copy size={16} color={Brand.primary} />
    </Pressable>
  );
}

function ListingRow({
  label,
  value,
  bold,
  accent,
  copyable,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
  copyable?: boolean;
}) {
  const canCopy = copyable && value !== '—';

  return (
    <View style={styles.listingRow}>
      <Text style={[styles.listingLabel, bold && styles.bold]}>{label}</Text>
      <View style={styles.listingValueRow}>
        <Text
          style={[
            styles.listingValue,
            bold && styles.bold,
            accent && styles.accent,
            canCopy && styles.summaryValueId,
          ]}
        >
          {value}
        </Text>
        {canCopy ? <CopyIconButton value={value} /> : null}
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  accent,
  copyable,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
  copyable?: boolean;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const canCopy = copyable && value !== '—';
  const heuristicStack = useMemo(
    () => shouldStackSummary(label, value, screenWidth) || canCopy,
    [label, value, screenWidth, canCopy]
  );
  const [wrapStack, setWrapStack] = useState(false);
  const stacked = heuristicStack || wrapStack;
  const valueStyles = [
    stacked ? styles.summaryValueStack : styles.summaryValue,
    bold && styles.bold,
    accent && styles.accent,
    canCopy && styles.summaryValueId,
  ];

  useEffect(() => {
    setWrapStack(false);
  }, [label, value, screenWidth]);

  if (stacked) {
    return (
      <View style={styles.summaryStack}>
        <Text style={[styles.summaryLabelStack, bold && styles.bold]}>{label}</Text>
        <View style={styles.summaryValueRow}>
          <Text style={valueStyles}>{value}</Text>
          {canCopy ? <CopyIconButton value={value} /> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.summaryRow}>
      <Text
        style={[styles.summaryLabel, bold && styles.bold]}
        numberOfLines={1}
        onTextLayout={(event) => {
          if (event.nativeEvent.lines.length > 1) setWrapStack(true);
        }}
      >
        {label}
      </Text>
      <View style={styles.summaryValueRow}>
        <Text
          style={valueStyles}
          onTextLayout={(event) => {
            if (event.nativeEvent.lines.length > 1) setWrapStack(true);
          }}
        >
          {value}
        </Text>
        {canCopy ? <CopyIconButton value={value} /> : null}
      </View>
    </View>
  );
}

function DetailSection({
  title,
  icon: Icon,
  children,
  footer,
}: {
  title: string;
  icon?: typeof FileText;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCardElevated}>
      <View style={styles.sectionHeaderRow}>
        {Icon ? (
          <View style={styles.sectionIconWrap}>
            <Icon size={16} color={Brand.primary} />
          </View>
        ) : null}
        <Text style={styles.sectionTitleAccent}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
      {footer}
    </View>
  );
}

function TransactionHeroCard({
  invoiceNumber,
  createdAt,
  total,
}: {
  invoiceNumber: string;
  createdAt: string;
  total: number;
}) {
  const t = useCheckoutTranslation();
  return (
    <LinearGradient
      colors={['#FDF2F8', '#FFF7FB', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      <View style={styles.heroIconRing}>
        <FileCheck size={30} color={Brand.primary} strokeWidth={2.25} />
      </View>
      <Text style={styles.heroEyebrow}>{t.invoiceNumberLabel}</Text>
      <Text style={styles.heroInvoice} numberOfLines={2}>
        {invoiceNumber}
      </Text>
      <View style={styles.heroDateRow}>
        <Calendar size={14} color={Colors.textSecondary} />
        <Text style={styles.heroDate}>{format(parseISO(createdAt), 'PPpp')}</Text>
      </View>
      <View style={styles.heroDivider} />
      <Text style={styles.heroEyebrow}>{t.totalAmount}</Text>
      <Text style={styles.heroTotal}>{formatCurrency(total)}</Text>
    </LinearGradient>
  );
}

function formatDetailValue(value?: string | number | null, fallback = '—'): string {
  if (value == null || value === '') return fallback;
  return String(value);
}

function formatRate(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value}%`;
}

function WithholdingReceiptInformationSection({
  withholding,
}: {
  withholding: WithholdingDetail;
}) {
  return (
    <DetailSection title="Receipt Information">
      <ListingRow label="Reason" value={formatDetailValue(withholding.reason)} />
      <ListingRow label="Receipt Counter" value={formatDetailValue(withholding.receiptCounter)} />
      <ListingRow
        label="Manual Receipt Number"
        value={formatDetailValue(withholding.manualReceiptNumber)}
      />
      <ListingRow
        label="Source System Type"
        value={formatDetailValue(withholding.sourceSystemType)}
      />
      <ListingRow
        label="Source System Number"
        value={formatDetailValue(withholding.sourceSystemNumber)}
        copyable
      />
      {withholding.updatedAt ? (
        <ListingRow
          label="Last Updated"
          value={format(parseISO(withholding.updatedAt), 'PPpp')}
        />
      ) : null}
    </DetailSection>
  );
}

function WithholdingDetailSections({ withholding }: { withholding: WithholdingDetail }) {
  const qrUri = withholding.qrBase64
    ? `data:image/png;base64,${withholding.qrBase64}`
    : null;

  return (
    <>
      <DetailSection title="Withholding Details">
        <SummaryRow label="Category" value={formatDetailValue(withholding.withholdingCategory)} />
        <SummaryRow label="Withhold Type" value={formatDetailValue(withholding.withholdType)} />
        <SummaryRow label="Withhold Rate" value={formatRate(withholding.withholdRate)} />
        <SummaryRow label="Currency" value={formatDetailValue(withholding.currency)} />
        <SummaryRow
          label="Exchange Rate"
          value={
            withholding.exchangeRate == null
              ? '—'
              : String(withholding.exchangeRate)
          }
        />
        <SummaryRow
          label="Invoice IRN"
          value={formatDetailValue(withholding.invoiceIrn)}
          copyable
        />
      </DetailSection>

      <DetailSection title="Supplier Information">
        <SummaryRow label="Name" value={formatDetailValue(withholding.supplierName)} />
        <SummaryRow label="Email" value={formatDetailValue(withholding.supplierEmail)} />
        <SummaryRow label="Phone" value={formatDetailValue(withholding.supplierPhone)} />
        <SummaryRow label="Tax ID" value={formatDetailValue(withholding.supplierTaxId)} />
        <SummaryRow
          label="Transaction Type"
          value={formatDetailValue(withholding.supplierTransactionType)}
        />
        <SummaryRow label="Address" value={formatDetailValue(withholding.supplierAddress)} />
      </DetailSection>

      {withholding.organizationName ? (
        <DetailSection title="Organization">
          <SummaryRow label="Name" value={withholding.organizationName} />
        </DetailSection>
      ) : null}

      {qrUri ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>QR Code</Text>
          <View style={styles.qrWrap}>
            <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
          </View>
        </View>
      ) : null}

      <DetailSection title="Summary">
        <SummaryRow
          label="Pre-tax Amount"
          value={formatCurrency(withholding.preTaxAmount ?? 0)}
        />
        <SummaryRow label="Withhold Rate" value={formatRate(withholding.withholdRate)} />
        <View style={styles.totalDivider} />
        <SummaryRow
          label="Withholding Amount"
          value={formatCurrency(withholding.withholdingAmount ?? 0)}
          bold
          accent
        />
      </DetailSection>
    </>
  );
}

function ReceiptDetailSections({ receipt }: { receipt: ReceiptDetail }) {
  const qrUri = receipt.qrBase64 ? `data:image/png;base64,${receipt.qrBase64}` : null;

  return (
    <>
      <DetailSection title="Receipt Information">
        <SummaryRow label="Reason" value={formatDetailValue(receipt.reason)} />
        <SummaryRow label="Receipt Counter" value={formatDetailValue(receipt.receiptCounter)} />
        <SummaryRow label="Payment Coverage" value={formatDetailValue(receipt.paymentCoverage)} />
        <SummaryRow label="Mode of Payment" value={formatDetailValue(receipt.modeOfPayment)} />
        <SummaryRow label="Collector" value={formatDetailValue(receipt.collectorName)} />
        {receipt.updatedAt ? (
          <SummaryRow label="Last Updated" value={format(parseISO(receipt.updatedAt), 'PPpp')} />
        ) : null}
      </DetailSection>

      <DetailSection title="EIRMS">
        <SummaryRow label="Receipt IRN" value={formatDetailValue(receipt.eirmsIrn)} copyable />
        <SummaryRow label="Receipt RRN" value={formatDetailValue(receipt.eirmsRrn)} copyable />
        <SummaryRow
          label="Document Number"
          value={formatDetailValue(receipt.eirmsDocumentNumber)}
        />
        {receipt.eirmsAckDate ? (
          <SummaryRow label="Ack Date" value={format(parseISO(receipt.eirmsAckDate), 'PPpp')} />
        ) : null}
        <SummaryRow label="Error Message" value={formatDetailValue(receipt.eimsErrorMessage)} />
      </DetailSection>

      <DetailSection title="Linked Invoice">
        <SummaryRow label="Invoice Number" value={formatDetailValue(receipt.invoiceNumber)} />
        <SummaryRow label="Invoice Status" value={formatDetailValue(receipt.invoiceStatus)} />
        <SummaryRow label="Total Value" value={formatCurrency(receipt.invoiceTotal ?? 0)} />
        <SummaryRow label="Paid Amount" value={formatCurrency(receipt.invoicePaidAmount ?? 0)} />
        <SummaryRow
          label="Withheld Amount"
          value={formatCurrency(receipt.invoiceWithheldAmount ?? 0)}
        />
        <SummaryRow label="Invoice IRN" value={formatDetailValue(receipt.invoiceEirmsIrn)} copyable />
        {receipt.invoiceEirmsAckDate ? (
          <SummaryRow
            label="Invoice Ack Date"
            value={format(parseISO(receipt.invoiceEirmsAckDate), 'PPpp')}
          />
        ) : null}
      </DetailSection>

      <DetailSection title="Sales Order">
        <SummaryRow label="Order Number" value={formatDetailValue(receipt.orderNumber)} />
        <SummaryRow label="Status" value={formatDetailValue(receipt.salesOrderStatus)} />
        <SummaryRow label="Currency" value={formatDetailValue(receipt.currency)} />
        <SummaryRow
          label="Mode of Payment"
          value={formatDetailValue(receipt.salesOrderModeOfPayment)}
        />
        <SummaryRow label="Subtotal" value={formatCurrency(receipt.salesOrderSubtotal ?? 0)} />
        <SummaryRow label="Tax Amount" value={formatCurrency(receipt.salesOrderTaxAmount ?? 0)} />
        <SummaryRow label="Excise Amount" value={formatCurrency(receipt.salesOrderExciseAmount ?? 0)} />
        <SummaryRow
          label="Discount Amount"
          value={formatCurrency(receipt.salesOrderDiscountAmount ?? 0)}
        />
        <SummaryRow label="Order Total" value={formatCurrency(receipt.salesOrderTotal ?? 0)} />
      </DetailSection>

      <DetailSection title="Customer Information">
        <SummaryRow label="Name" value={formatDetailValue(receipt.customerName)} />
        <SummaryRow label="Email" value={formatDetailValue(receipt.customerEmail)} />
        <SummaryRow label="Phone" value={formatDetailValue(receipt.customerPhone)} />
        <SummaryRow label="Tax ID" value={formatDetailValue(receipt.customerTaxId)} />
        <SummaryRow label="VAT Number" value={formatDetailValue(receipt.customerVatNumber)} />
        <SummaryRow
          label="Transaction Type"
          value={formatDetailValue(receipt.customerTransactionType)}
        />
        <SummaryRow label="City" value={formatDetailValue(receipt.customerCity)} />
        <SummaryRow label="Country" value={formatDetailValue(receipt.customerCountry)} />
        <SummaryRow label="Region" value={formatDetailValue(receipt.customerRegion)} />
        <SummaryRow label="Zone" value={formatDetailValue(receipt.customerZone)} />
        <SummaryRow label="Wereda" value={formatDetailValue(receipt.customerWereda)} />
        <SummaryRow label="Kebele" value={formatDetailValue(receipt.customerKebele)} />
        <SummaryRow label="Street" value={formatDetailValue(receipt.customerStreet)} />
        <SummaryRow label="House Number" value={formatDetailValue(receipt.customerHouseNumber)} />
        <SummaryRow label="Sub City" value={formatDetailValue(receipt.customerSubCity)} />
      </DetailSection>

      {qrUri ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>QR Code</Text>
          <View style={styles.qrWrap}>
            <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
          </View>
        </View>
      ) : null}

      <DetailSection title="Summary">
        <SummaryRow label="Collected Amount" value={formatCurrency(receipt.collectedAmount ?? 0)} bold accent />
      </DetailSection>
    </>
  );
}

export function TransactionDetailModal({
  visible,
  detail,
  onClose,
  receiptData,
  onNewSale,
  actionMode,
  onInvoiceUpdated,
  presentation = 'modal',
}: TransactionDetailModalProps) {
  const t = useCheckoutTranslation();
  const language = useSettingsStore((s) => s.language);
  const invoiceStrings = getInvoiceStrings(language);
  const queryClient = useQueryClient();
  const [shareOptionsVisible, setShareOptionsVisible] = useState(false);
  const [moreActionsVisible, setMoreActionsVisible] = useState(false);
  const [memoType, setMemoType] = useState<'CRE' | 'DEB' | null>(null);
  const [cancelEimsVisible, setCancelEimsVisible] = useState(false);
  const [generateReceiptVisible, setGenerateReceiptVisible] = useState(false);
  const [retryingEims, setRetryingEims] = useState(false);
  const [inlineToast, setInlineToast] = useState<string | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreAnchorRef = useRef<View>(null);
  const showCheckoutActions = !!receiptData && !!onNewSale;
  const documentData = resolveDocumentData(detail, receiptData);
  const memoLines = useMemo(
    () => (detail ? mapDetailToMemoLines(detail) : null),
    [detail]
  );
  const canUseTaxDocument = !!documentData && hasTaxDocumentReference(documentData);
  const showInvoicingActions = !!actionMode && canUseTaxDocument;
  const invoicingDocumentActionsDisabled =
    showInvoicingActions &&
    areInvoicingDocumentActionsDisabled(detail?.status, detail?.eirmsStatus);
  const showDocumentActions = showCheckoutActions || showInvoicingActions;
  const showShareAction = showDocumentActions;
  const showDownloadAction = showDocumentActions;
  const showPrintAction = showDocumentActions;
  const showPayAction = actionMode === 'invoice' && isInvoicePayable(detail);

  useEffect(() => {
    if (!visible) {
      setShareOptionsVisible(false);
      setMoreActionsVisible(false);
      setMemoType(null);
      setCancelEimsVisible(false);
      setGenerateReceiptVisible(false);
      setRetryingEims(false);
    }
  }, [visible]);

  const refreshInvoices = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['invoices'] }),
      queryClient.invalidateQueries({ queryKey: ['receipts'] }),
    ]);
    onInvoiceUpdated?.();
  }, [onInvoiceUpdated, queryClient]);

  const handleMoreAction = (action: InvoiceMoreAction) => {
    const invoicingApiId = resolveInvoicingApiId(detail);
    if (!invoicingApiId) {
      appAlert('Unavailable', 'Invoice UUID is missing for this document.', undefined, {
        variant: 'error',
      });
      return;
    }

    if (action === 'credit') {
      setMemoType('CRE');
      return;
    }

    if (action === 'debit') {
      setMemoType('DEB');
      return;
    }

    setCancelEimsVisible(true);
  };

  useEffect(() => {
    if (invoicingDocumentActionsDisabled) setShareOptionsVisible(false);
  }, [invoicingDocumentActionsDisabled]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) setKeyboardInset(0);
  }, [visible]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showDetailToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setInlineToast(message);
    toastTimerRef.current = setTimeout(() => {
      setInlineToast(null);
      toastTimerRef.current = null;
    }, DETAIL_TOAST_DURATION_MS);
  }, []);

  const handleRetryEims = useCallback(async () => {
    const invoicingApiId = resolveInvoicingRetryId(detail);
    if (!invoicingApiId || retryingEims) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRetryingEims(true);
    try {
      await retryInvoiceEims(invoicingApiId);
      await refreshInvoices();
      showDetailToast('EIRMS retry submitted.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to retry EIRMS submission.';
      appAlert('Retry Failed', message, undefined, { variant: 'error' });
    } finally {
      setRetryingEims(false);
    }
  }, [detail, refreshInvoices, retryingEims, showDetailToast]);

  const openPreviewAndClose = (mode: 'download' | 'print') => {
    if (invoicingDocumentActionsDisabled) return;

    if (showCheckoutActions && documentData) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      useReceiptStore.getState().setThermalPreviewReceipt(documentData);
      onClose();
      navigateToThermalReceiptPreview({
        invoiceNumber: documentData.invoiceNumber,
        mode,
      });
      return;
    }

    const params = resolvePreviewParams(detail, receiptData, actionMode);
    if (!params) {
      appAlert(t.documentUnavailable, t.taxDocumentReferenceMissing, undefined, {
        variant: 'error',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => navigateToReceiptPreview({ ...params, mode }), 0);
  };

  const toggleShareOptions = () => {
    if (invoicingDocumentActionsDisabled) return;
    if (!documentData || !hasTaxDocumentReference(documentData)) {
      appAlert(t.documentUnavailable, t.taxDocumentReferenceMissing, undefined, {
        variant: 'error',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareOptionsVisible((current) => !current);
  };

  const documentActions = showDocumentActions ? (
    <View style={styles.actionBarCard}>
      <View style={styles.actionBarRow}>
        {showPayAction ? (
          <>
            <ActionButton
              icon={<Wallet size={22} color={Brand.primary} />}
              label="Pay"
              onPress={() => {
                setShareOptionsVisible(false);
                setGenerateReceiptVisible(true);
              }}
            />
            <View style={styles.actionBarDivider} />
          </>
        ) : null}
        {showShareAction ? (
          <>
            <ActionButton
              icon={
                <Share2
                  size={22}
                  color={invoicingDocumentActionsDisabled ? Colors.textTertiary : Brand.primary}
                />
              }
              label={t.share}
              active={shareOptionsVisible}
              disabled={invoicingDocumentActionsDisabled}
              onPress={toggleShareOptions}
            />
            {(showDownloadAction || showPrintAction) ? <View style={styles.actionBarDivider} /> : null}
          </>
        ) : null}
        {showDownloadAction ? (
          <>
            <ActionButton
              icon={
                <Download
                  size={22}
                  color={invoicingDocumentActionsDisabled ? Colors.textTertiary : Brand.primary}
                />
              }
              label={t.download}
              disabled={invoicingDocumentActionsDisabled}
              onPress={() => {
                setShareOptionsVisible(false);
                openPreviewAndClose('download');
              }}
            />
            {showPrintAction ? <View style={styles.actionBarDivider} /> : null}
          </>
        ) : null}
        {showPrintAction ? (
          <ActionButton
            icon={
              <Printer
                size={22}
                color={invoicingDocumentActionsDisabled ? Colors.textTertiary : Brand.primary}
              />
            }
            label={t.print}
            disabled={invoicingDocumentActionsDisabled}
            onPress={() => {
              setShareOptionsVisible(false);
              openPreviewAndClose('print');
            }}
          />
        ) : null}
      </View>
      {shareOptionsVisible && documentData ? (
        <ShareChannelRow
          data={documentData}
          onError={(message) =>
            appAlert(t.error, message, undefined, { variant: 'error' })
          }
        />
      ) : null}
    </View>
  ) : null;

  const hasInvoiceMeta =
    detail &&
    (detail.transactionType ||
      detail.orderNumber ||
      detail.sellerTin ||
      detail.buyerTin ||
      detail.eirmsDocumentNumber ||
      detail.eirmsAckDate);

  const hasStatusMeta =
    detail &&
    (detail.customerName ||
      detail.invoiceType !== undefined ||
      detail.status !== undefined ||
      detail.eirmsStatus !== undefined);
  const isWithholding = !!detail?.withholding;
  const isReceiptDetail = !!detail?.receipt;
  const partyLabel = isWithholding ? invoiceStrings.supplier : isReceiptDetail ? t.customer : invoiceStrings.client;

  const modalTitle = showCheckoutActions ? t.successPayment : t.transactionDetail;
  const isInvoiceCancelled = isCancelledDocumentStatus(detail?.status);
  const showInvoiceMoreActions =
    actionMode === 'invoice' && !!resolveInvoicingApiId(detail) && !isInvoiceCancelled;
  const showEirmsRetry =
    actionMode === 'invoice' &&
    !isInvoiceCancelled &&
    isFailedEirmsStatus(detail?.eirmsStatus) &&
    !!resolveInvoicingRetryId(detail);
  const isScreen = presentation === 'screen';

  const retryButton = showEirmsRetry ? (
    <Pressable
      onPress={handleRetryEims}
      hitSlop={10}
      style={styles.moreBtn}
      disabled={retryingEims}
      accessibilityRole="button"
      accessibilityLabel="Retry EIRMS"
    >
      {retryingEims ? (
        <ActivityIndicator size="small" color={Brand.primary} />
      ) : (
        <RefreshCw size={20} color={Brand.primary} />
      )}
    </Pressable>
  ) : undefined;

  const moreButton =
    showInvoiceMoreActions && !showEirmsRetry ? (
      <View ref={moreAnchorRef} collapsable={false}>
        <Pressable
          onPress={() => setMoreActionsVisible((current) => !current)}
          hitSlop={10}
          style={styles.moreBtn}
          accessibilityRole="button"
          accessibilityLabel="More actions"
        >
          <MoreVertical size={22} color={Colors.text} />
        </Pressable>
      </View>
    ) : undefined;

  const headerRight = retryButton ?? moreButton;

  const inlineToastOverlay = inlineToast ? (
    <View pointerEvents="none" style={styles.inlineToastWrap}>
      <Text style={styles.inlineToastText}>{inlineToast}</Text>
    </View>
  ) : null;

  const detailScroll = detail ? (
    <KeyboardAvoidingView
      style={[styles.modalBody, isScreen && styles.screenBody]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={!isScreen}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scrollContent,
          isScreen && styles.screenScrollContent,
          keyboardInset > 0 && { paddingBottom: keyboardInset + 24 },
        ]}
      >
          <View style={styles.detail}>
            <TransactionHeroCard
              invoiceNumber={detail.invoiceNumber}
              createdAt={detail.createdAt}
              total={detail.total}
            />

            {showDocumentActions ? documentActions : null}

            {isWithholding && detail.withholding ? (
              <WithholdingReceiptInformationSection withholding={detail.withholding} />
            ) : null}

            {hasStatusMeta ? (
              <View style={styles.sectionCardElevated}>
                <TransactionStatusBadges
                  customerName={detail.customerName}
                  partyLabel={partyLabel}
                  invoiceType={detail.invoiceType}
                  status={detail.status}
                  eirmsStatus={detail.eirmsStatus}
                />
              </View>
            ) : null}

            {isWithholding && detail.withholding ? (
              <WithholdingDetailSections withholding={detail.withholding} />
            ) : isReceiptDetail && detail.receipt ? (
              <ReceiptDetailSections receipt={detail.receipt} />
            ) : (
              <>
            {hasInvoiceMeta ? (
              <DetailSection title={invoiceStrings.invoiceInformation} icon={FileText}>
                <SummaryRow label={invoiceStrings.transactionType} value={formatDetailValue(detail.transactionType)} />
                <SummaryRow label={invoiceStrings.orderNumber} value={formatDetailValue(detail.orderNumber)} />
                <SummaryRow label={invoiceStrings.sellerTin} value={formatDetailValue(detail.sellerTin)} />
                <SummaryRow label={invoiceStrings.buyerTin} value={formatDetailValue(detail.buyerTin)} />
                <SummaryRow
                  label={invoiceStrings.documentNumber}
                  value={formatDetailValue(detail.eirmsDocumentNumber)}
                />
                {detail.eirmsAckDate ? (
                  <SummaryRow
                    label={invoiceStrings.eirmsAckDate}
                    value={format(parseISO(detail.eirmsAckDate), 'PPpp')}
                  />
                ) : null}
              </DetailSection>
            ) : null}

            {detail.items.length > 0 ? (
              <DetailSection
                title={t.items}
                icon={ShoppingBag}
                footer={
                  <View style={styles.itemsFooter}>
                    <View style={styles.itemsFooterCol}>
                      <Text style={styles.itemsFooterLabel}>{t.totalItems}</Text>
                      <Text style={styles.itemsFooterValue}>{detail.items.length}</Text>
                    </View>
                    <View style={styles.itemsFooterDivider} />
                    <View style={styles.itemsFooterCol}>
                      <Text style={styles.itemsFooterLabel}>{t.totalAmount}</Text>
                      <Text style={styles.itemsFooterAmount}>
                        {formatCurrency(detail.total)}
                      </Text>
                    </View>
                  </View>
                }
              >
                {detail.items.map((item, index) => (
                  <View
                    key={item.key}
                    style={[styles.itemRow, index === detail.items.length - 1 && styles.itemRowLast]}
                  >
                    <View style={styles.itemThumb}>
                      <ShoppingBag size={18} color={Brand.primary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.sku ? <Text style={styles.itemMeta}>{t.code}: {item.sku}</Text> : null}
                      <Text style={styles.itemQty}>
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </Text>
                      {(item.tax ?? 0) > 0 || (item.excise ?? 0) > 0 ? (
                        <Text style={styles.itemMeta}>
                          {item.excise ? t.exciseLine(formatCurrency(item.excise)) : ''}
                          {item.excise && item.tax ? ' · ' : ''}
                          {item.tax ? t.taxLine(formatCurrency(item.tax)) : ''}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
                  </View>
                ))}
              </DetailSection>
            ) : null}

            {detail.taxes.length > 0 ? (
              <DetailSection title={t.taxBreakdown}>
                {detail.taxes.map((tax) => (
                  <SummaryRow
                    key={`${tax.name}-${tax.type}`}
                    label={`${tax.name} (${tax.rate}%)`}
                    value={formatCurrency(tax.amount)}
                  />
                ))}
              </DetailSection>
            ) : null}

            <DetailSection title={t.summary}>
              <SummaryRow label={t.subtotal} value={formatCurrency(detail.subtotal)} />
              {detail.discount > 0 ? (
                <SummaryRow label={t.discount} value={`-${formatCurrency(detail.discount)}`} />
              ) : null}
              {detail.exciseTotal != null && detail.exciseTotal > 0 ? (
                <SummaryRow label={t.exciseTax} value={formatCurrency(detail.exciseTotal)} />
              ) : null}
              {detail.vatTotal != null && detail.vatTotal > 0 ? (
                <SummaryRow label={t.vat} value={formatCurrency(detail.vatTotal)} />
              ) : null}
              {detail.taxValue > 0 ? (
                <SummaryRow label={t.totalTax} value={formatCurrency(detail.taxValue)} />
              ) : null}
              <SummaryRow label={t.paidAmount} value={formatCurrency(detail.paidAmount)} />
              <View style={styles.totalDivider} />
              <SummaryRow label={t.total} value={formatCurrency(detail.total)} bold accent />
              {detail.paymentMethod ? (
                <SummaryRow label={t.payment} value={detail.paymentMethod} />
              ) : null}
              {detail.receivedAmount !== undefined ? (
                <SummaryRow label={t.received} value={formatCurrency(detail.receivedAmount)} />
              ) : null}
              {detail.changeAmount !== undefined && detail.changeAmount > 0 ? (
                <SummaryRow label={t.change} value={formatCurrency(detail.changeAmount)} />
              ) : null}
            </DetailSection>
              </>
            )}

            {showCheckoutActions && onNewSale ? (
              <Button title={t.newSale} onPress={onNewSale} style={styles.newSaleBtn} />
            ) : null}
          </View>
      </ScrollView>
    </KeyboardAvoidingView>
  ) : null;

  const actionModals = (
    <>
    <InvoiceMoreActionsSheet
      visible={moreActionsVisible}
      onClose={() => setMoreActionsVisible(false)}
      onSelect={handleMoreAction}
      anchorRef={moreAnchorRef}
    />

    <InvoiceMemoModal
      visible={memoType !== null}
      invoiceId={resolveInvoicingApiId(detail)}
      invoiceNumber={detail?.invoiceNumber ?? ''}
      referenceIrn={detail?.irn}
      referenceRrn={detail?.rrn}
      memoType={memoType ?? 'CRE'}
      memoLines={memoLines}
      onClose={() => setMemoType(null)}
      onSuccess={refreshInvoices}
    />

    <CancelEimsModal
      visible={cancelEimsVisible}
      invoiceId={resolveInvoicingApiId(detail)}
      onClose={() => setCancelEimsVisible(false)}
      onSuccess={refreshInvoices}
    />

    <GenerateReceiptModal
      visible={generateReceiptVisible}
      detail={detail}
      onClose={() => setGenerateReceiptVisible(false)}
      onSuccess={refreshInvoices}
    />
    </>
  );

  if (isScreen) {
    if (!visible) return null;

    return (
      <DetailToastContext.Provider value={showDetailToast}>
        <View style={styles.screen}>
          <ScreenHeader title={modalTitle} onBack={onClose} right={headerRight} />
          {inlineToastOverlay}
          {detailScroll}
        </View>
        {actionModals}
      </DetailToastContext.Provider>
    );
  }

  return (
    <DetailToastContext.Provider value={showDetailToast}>
    <Modal
      visible={visible}
      onClose={onClose}
      title={modalTitle}
      headerRight={headerRight}
      centerOverlay={inlineToastOverlay}
    >
      {detailScroll}
    </Modal>
    {actionModals}
    </DetailToastContext.Provider>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  loading = false,
  active = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  loading?: boolean;
  active?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[
        styles.actionBtn,
        active && !isDisabled && styles.actionBtnActive,
        isDisabled && styles.actionBtnDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? <ActivityIndicator color={Brand.primary} /> : icon}
      <Text
        style={[
          styles.actionLabel,
          active && !isDisabled && styles.actionLabelActive,
          isDisabled && styles.actionLabelDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const detailCardBorder = {
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: Colors.border,
} as const;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  screenBody: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  screenScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: Colors.white,
  },
  detail: { gap: 20, paddingBottom: 32 },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 28,
    backgroundColor: Colors.white,
  },
  modalBody: {
    position: 'relative',
    minHeight: 120,
    maxHeight: '100%',
    backgroundColor: Colors.white,
  },
  heroCard: {
    borderRadius: Radius.lg,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 26,
    alignItems: 'center',
    ...detailCardBorder,
    ...Shadow.iosCard,
  },
  heroIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(227, 0, 116, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroEyebrow: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroInvoice: {
    ...Typography.title2,
    color: Brand.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  heroDate: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  heroDivider: {
    width: '100%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    marginVertical: 18,
  },
  heroTotal: {
    ...Typography.title1,
    color: Brand.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  actionBarCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 8,
    ...detailCardBorder,
    ...Shadow.iosCard,
  },
  actionBarRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionBarDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  sectionCardElevated: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 16,
    ...detailCardBorder,
    ...Shadow.iosCard,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleAccent: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 16,
    ...detailCardBorder,
    ...Shadow.iosCard,
  },
  sectionTitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionBody: { gap: 14 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  itemRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemInfo: { flex: 1, minWidth: 0, gap: 2 },
  itemName: { ...Typography.subhead, color: Colors.text, fontWeight: '700' },
  itemMeta: { ...Typography.caption2, color: Colors.textSecondary },
  itemQty: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  itemTotal: { ...Typography.subhead, color: Brand.primary, fontWeight: '700' },
  itemsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  itemsFooterCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  itemsFooterDivider: {
    width: 1,
    height: 36,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemsFooterLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  itemsFooterValue: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  itemsFooterAmount: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryStack: { gap: 4 },
  summaryLabelStack: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  summaryLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    flexShrink: 0,
    maxWidth: '42%',
  },
  summaryValue: {
    ...Typography.subhead,
    color: Colors.text,
    textTransform: 'capitalize',
    flex: 1,
    flexShrink: 1,
    textAlign: 'right',
  },
  summaryValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: 6,
    minWidth: 0,
  },
  summaryValueStack: {
    ...Typography.subhead,
    color: Colors.text,
    textTransform: 'capitalize',
    flex: 1,
    flexShrink: 1,
  },
  summaryValueId: {
    textTransform: 'none',
  },
  copyBtn: {
    marginTop: 1,
    padding: 2,
  },
  listingRow: { gap: 4 },
  listingLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  listingValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  listingValue: {
    ...Typography.subhead,
    color: Colors.text,
    flex: 1,
    flexShrink: 1,
  },
  inlineToastWrap: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  inlineToastText: {
    ...Typography.subhead,
    color: Colors.white,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    textAlign: 'center',
    maxWidth: '85%',
  },
  totalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  bold: { fontWeight: '700', color: Colors.text },
  accent: { color: Brand.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  actionBtnActive: {
    backgroundColor: Brand.primaryMuted,
    borderRadius: Radius.md,
  },
  actionBtnDisabled: {
    opacity: 0.55,
    backgroundColor: Colors.borderLight,
  },
  actionLabel: { ...Typography.caption1, color: Colors.text, fontWeight: '600' },
  actionLabelActive: { color: Brand.primary },
  actionLabelDisabled: { color: Colors.textTertiary },
  newSaleBtn: { marginTop: 12 },
  moreBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
  },
  qrWrap: {
    alignItems: 'center',
    paddingTop: 8,
  },
  qrImage: {
    width: 180,
    height: 180,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
});
