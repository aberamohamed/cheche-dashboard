import { TaxDocumentHtmlPreview } from '@/components/receipt/TaxDocumentHtmlPreview';
import { Button } from '@/components/ui/Button';
import { ModalSheetHeader } from '@/components/ui/ModalSheetHeader';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import {
  createInvoiceMemo,
  fetchMemoPreviewHtml,
} from '@/services/invoiceAdjustmentService';
import type { MemoLineItem, MemoType } from '@/types/invoiceAdjustment';
import { appAlert } from '@/utils/alert';
import { formatAmount, formatCurrency } from '@/utils/format';
import { buildMemoPreviewHtml } from '@/utils/memoPreviewHtml';
import {
  canDecreaseMemoPrice,
  canDecreaseMemoQty,
  canIncreaseMemoPrice,
  canIncreaseMemoQty,
  computeMemoLineTotals,
  computeMemoTaxSummary,
  parseMemoPriceInput,
  parseMemoQtyInput,
  validateMemoForm,
} from '@/utils/memoTax';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Calculator,
  FilePlus,
  FileText,
  Info,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react-native';

interface InvoiceMemoModalProps {
  visible: boolean;
  invoiceId: string | null;
  invoiceNumber: string;
  referenceIrn?: string;
  referenceRrn?: string;
  memoType: MemoType;
  memoLines: MemoLineItem[] | null;
  onClose: () => void;
  onSuccess: () => void;
}

function MemoModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <ModalSheetHeader
      title={title}
      onBack={onClose}
      right={
        <Pressable onPress={onClose} hitSlop={12} style={styles.memoCloseBtn}>
          <X size={20} color={Colors.text} />
        </Pressable>
      }
    />
  );
}

function MemoNumericStepper({
  value,
  onChange,
  canDecrease,
  canIncrease,
  keyboardType = 'number-pad',
}: {
  value: string;
  onChange: (value: string) => void;
  canDecrease: boolean;
  canIncrease: boolean;
  keyboardType?: 'number-pad' | 'decimal-pad';
}) {
  const num = Number(value) || 0;

  return (
    <View style={styles.amountStepper}>
      <Pressable
        style={[styles.stepperBtn, !canDecrease && styles.stepperBtnDisabled]}
        onPress={() => canDecrease && onChange(String(num - 1))}
        disabled={!canDecrease}
        hitSlop={6}
      >
        <Minus
          size={16}
          color={canDecrease ? Brand.primary : Colors.textTertiary}
        />
      </Pressable>
      <TextInput
        style={styles.stepperInput}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        inputMode={keyboardType === 'decimal-pad' ? 'decimal' : 'numeric'}
      />
      <Pressable
        style={[styles.stepperBtn, !canIncrease && styles.stepperBtnDisabled]}
        onPress={() => canIncrease && onChange(String(num + 1))}
        disabled={!canIncrease}
        hitSlop={6}
      >
        <Plus size={16} color={canIncrease ? Brand.primary : Colors.textTertiary} />
      </Pressable>
    </View>
  );
}

function MemoLineCard({
  index,
  item,
  isFirst,
  memoType,
  onChangeQty,
  onChangePrice,
  onRemove,
}: {
  index: number;
  item: MemoLineItem;
  isFirst: boolean;
  memoType: MemoType;
  onChangeQty: (value: string) => void;
  onChangePrice: (value: string) => void;
  onRemove: () => void;
}) {
  const lineTotals = computeMemoLineTotals(item);

  return (
    <View style={[styles.itemCard, !isFirst && styles.itemCardDivider]}>
      <View style={styles.itemCardHeader}>
        <View style={styles.itemIndexTag}>
          <Text style={styles.itemIndexText}>#{index + 1}</Text>
        </View>
        <Pressable onPress={onRemove} hitSlop={8} style={styles.deleteBtn}>
          <Trash2 size={18} color={Brand.primary} />
        </Pressable>
      </View>

      <View style={styles.productRow}>
        <View style={styles.productThumb}>
          <ShoppingBag size={20} color={Brand.primary} />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name}
          </Text>
          {item.code ? <Text style={styles.productMeta}>Code: {item.code}</Text> : null}
          {item.uom ? <Text style={styles.productMeta}>UoM: {item.uom}</Text> : null}
        </View>
      </View>

      <View style={styles.itemKvTable}>
        <View style={styles.itemKvRow}>
          <View style={styles.itemKvKeyCell}>
            <Text style={styles.itemKvKey}>Qty</Text>
          </View>
          <View style={styles.itemKvValueCell}>
            <MemoNumericStepper
              value={String(item.qty)}
              onChange={onChangeQty}
              canDecrease={canDecreaseMemoQty(item, memoType)}
              canIncrease={canIncreaseMemoQty(item, memoType)}
            />
          </View>
        </View>
        <View style={styles.itemKvRow}>
          <View style={styles.itemKvKeyCell}>
            <Text style={styles.itemKvKey}>Price</Text>
          </View>
          <View style={styles.itemKvValueCell}>
            <MemoNumericStepper
              value={String(item.unit_price)}
              onChange={onChangePrice}
              canDecrease={canDecreaseMemoPrice(item, memoType)}
              canIncrease={canIncreaseMemoPrice(item, memoType)}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View style={[styles.itemKvRow, styles.itemKvRowLast]}>
          <View style={styles.itemKvKeyCell}>
            <Text style={styles.itemKvKey}>Total</Text>
          </View>
          <View style={styles.itemKvTotal}>
            <Text style={styles.itemKvTotalBase}>{formatCurrency(lineTotals.base)}</Text>
            <Text style={styles.itemKvTotalIncl}>{formatCurrency(lineTotals.total)} incl.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function InvoiceMemoModal({
  visible,
  invoiceId,
  invoiceNumber: _invoiceNumber,
  referenceIrn,
  referenceRrn,
  memoType,
  memoLines,
  onClose,
  onSuccess,
}: InvoiceMemoModalProps) {
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<MemoLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRequestId = useRef(0);

  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * 0.92;

  const isCredit = memoType === 'CRE';
  const taxSummary = useMemo(() => computeMemoTaxSummary(items), [items]);
  const canSubmit = useMemo(() => {
    if (loading || loadError || items.length === 0) return false;
    if (reason.trim().length < 3) return false;
    return true;
  }, [loading, loadError, items.length, reason]);

  const localPreviewHtml = useMemo(() => {
    const hasValidLine = items.some((item) => {
      const qty = Number(item.qty) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      return qty > 0 && unitPrice > 0;
    });
    if (!hasValidLine) return null;
    return buildMemoPreviewHtml(memoType, reason, items);
  }, [items, memoType, reason]);

  useEffect(() => {
    if (!visible) {
      setReason('');
      setItems([]);
      setLoading(false);
      setSubmitting(false);
      setShowPreview(true);
      setLoadError(null);
      setPreviewHtml(null);
      setPreviewLoading(false);
      setPreviewError(null);
      return;
    }

    if (!invoiceId) return;

    if (!memoLines || memoLines.length === 0) {
      setItems([]);
      setLoadError(
        memoLines?.length === 0
          ? 'No line items found on this invoice.'
          : 'Invoice not found.'
      );
      setLoading(false);
      return;
    }

    setItems(memoLines);
    setLoadError(null);
    setLoading(false);
  }, [visible, invoiceId, memoLines]);

  const previewSignature = useMemo(
    () =>
      JSON.stringify({
        memoType,
        reason: reason.trim(),
        items: items.map((item) => ({
          id: item.id,
          qty: item.qty,
          unit_price: item.unit_price,
        })),
      }),
    [items, memoType, reason]
  );

  useEffect(() => {
    if (!visible || !showPreview || !invoiceId || loading || !!loadError) {
      return;
    }

    const hasValidLine = items.some((item) => {
      const qty = Number(item.qty) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      return qty > 0 && unitPrice > 0;
    });

    if (!hasValidLine) {
      setPreviewHtml(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    const requestId = ++previewRequestId.current;
    const timer = setTimeout(() => {
      setPreviewLoading(true);
      setPreviewError(null);

      fetchMemoPreviewHtml(invoiceId, memoType, reason, items, referenceIrn, referenceRrn)
        .then((html) => {
          if (previewRequestId.current !== requestId) return;
          setPreviewHtml(html);
          setPreviewError(null);
        })
        .catch(() => {
          if (previewRequestId.current !== requestId) return;
          setPreviewError(null);
        })
        .finally(() => {
          if (previewRequestId.current === requestId) {
            setPreviewLoading(false);
          }
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [
    visible,
    showPreview,
    invoiceId,
    loading,
    loadError,
    previewSignature,
    memoType,
    reason,
    items,
    referenceIrn,
    referenceRrn,
  ]);

  const updateItem = (id: string, patch: Partial<MemoLineItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleSubmit = async () => {
    if (!invoiceId || submitting || !canSubmit) return;

    const validationError = validateMemoForm(reason, items, memoType);
    if (validationError) {
      appAlert('Invalid Form', validationError, undefined, { variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await createInvoiceMemo(invoiceId, memoType, reason, items);
      onClose();
      onSuccess();
      appAlert(
        `${isCredit ? 'Credit' : 'Debit'} Note Created`,
        `${isCredit ? 'Credit' : 'Debit'} note created successfully.`,
        undefined,
        { variant: 'success' }
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create adjustment note.';
      appAlert('Unable to Create Note', message, undefined, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const title = isCredit ? 'Create Credit Note (CRE)' : 'Create Debit Note (DEB)';
  const memoInfoHint = isCredit
    ? 'Lines in this list are what the customer is returning. Reduce quantity or price for a partial return.'
    : 'Lines in this list are added to the original sale. Unchanged rows add the same quantity again. Delete a line to exclude it. Reduce quantity or price for a partial addition, or increase to add more.';
  const creditItemsHint =
    'Unchanged rows are credited in full. Use the trash icon to keep a line as sold.';

  return (
    <RNModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheetWrap}>
          <View style={[styles.sheet, { height: sheetHeight, maxHeight: sheetHeight }]}>
            <View style={styles.handle} />
            <MemoModalHeader title={title} onClose={onClose} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.infoBanner}>
                <Info size={16} color={Brand.primary} />
                <Text style={styles.infoBannerText}>{memoInfoHint}</Text>
              </View>

              <View style={styles.reasonSection}>
                <Text style={styles.fieldLabel}>Adjustment Reason</Text>
                <View style={styles.reasonInputWrap}>
                  <TextInput
                    style={styles.reasonInput}
                    placeholder="Why is this adjustment being made?"
                    placeholderTextColor={Colors.textTertiary}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    textAlignVertical="top"
                  />
                  <FileText size={18} color={Colors.textTertiary} style={styles.reasonIcon} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {isCredit ? 'Items to return' : 'Items to add'}
                </Text>
                {isCredit ? (
                  <View style={styles.sectionInfo}>
                    <Info size={14} color={Brand.primary} />
                    <Text style={styles.sectionInfoText}>{creditItemsHint}</Text>
                  </View>
                ) : null}

                <View style={styles.itemsCard}>
                  {loading ? (
                    <View style={styles.loadingWrap}>
                      <ActivityIndicator color={Brand.primary} />
                    </View>
                  ) : loadError ? (
                    <Text style={[styles.errorText, styles.itemsCardMessage]}>{loadError}</Text>
                  ) : (
                    items.map((item, index) => (
                      <MemoLineCard
                        key={item.id}
                        index={index}
                        item={item}
                        isFirst={index === 0}
                        memoType={memoType}
                        onChangeQty={(value) => {
                          updateItem(item.id, {
                            qty: parseMemoQtyInput(value, item, memoType),
                          });
                        }}
                        onChangePrice={(value) => {
                          updateItem(item.id, {
                            unit_price: parseMemoPriceInput(value, item, memoType),
                          });
                        }}
                        onRemove={() =>
                          setItems((current) => current.filter((line) => line.id !== item.id))
                        }
                      />
                    ))
                  )}
                </View>
              </View>

              <View style={styles.taxCard}>
                <View style={styles.taxHeader}>
                  <View style={styles.taxIconWrap}>
                    <Calculator size={16} color={Brand.primary} />
                  </View>
                  <Text style={styles.taxTitle}>Tax Calculation (Live)</Text>
                </View>
                <SummaryRow
                  label="Total amount (gross)"
                  value={formatCurrency(taxSummary.grossSubtotal)}
                />
                <SummaryRow label="Excise" value={formatCurrency(taxSummary.excise)} />
                <SummaryRow
                  label="Taxable total"
                  value={formatCurrency(taxSummary.taxableTotal)}
                />
                <SummaryRow label="VAT 15%" value={formatCurrency(taxSummary.vat)} />
                <View style={styles.taxDivider} />
                <SummaryRow
                  label="Total incl. tax"
                  value={formatCurrency(taxSummary.grandTotal)}
                  accent
                  bold
                />
              </View>

              <View style={styles.previewSection}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>Print Preview (Updates as you edit)</Text>
                  <Pressable onPress={() => setShowPreview((current) => !current)}>
                    <Text style={styles.previewToggle}>
                      {showPreview ? 'Hide preview' : 'Show preview'}
                    </Text>
                  </Pressable>
                </View>
                {showPreview ? (
                  <TaxDocumentHtmlPreview
                    html={previewHtml ?? localPreviewHtml}
                    loading={previewLoading}
                    error={!previewHtml && !localPreviewHtml ? previewError : null}
                    height={320}
                  />
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.footerTotal}>
                <Text style={styles.footerTotalLabel}>Total incl. tax</Text>
                <View style={styles.footerTotalRow}>
                  <Text style={styles.footerTotalAmount}>
                    {formatAmount(taxSummary.grandTotal)}
                  </Text>
                  <Text style={styles.footerTotalCurrency}>ETB</Text>
                </View>
              </View>
              <Button
                title={isCredit ? 'Confirm CRE' : 'Confirm DEB'}
                icon={<FilePlus size={18} color={Colors.white} />}
                fullWidth={false}
                loading={submitting}
                disabled={!canSubmit}
                onPress={handleSubmit}
                style={styles.footerConfirmBtn}
              />
            </View>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

function SummaryRow({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          bold && styles.summaryBold,
          accent && styles.summaryAccent,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrap: {
    maxHeight: '92%',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    flexDirection: 'column',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  memoCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  footerTotal: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  footerTotalLabel: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  footerTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  footerTotalAmount: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '700',
  },
  footerTotalCurrency: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  footerConfirmBtn: {
    height: 44,
    paddingHorizontal: 16,
    minWidth: 132,
  },
  reasonSection: {
    gap: 8,
  },
  fieldLabel: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  reasonInputWrap: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    minHeight: 112,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 36,
    position: 'relative',
  },
  reasonInput: {
    ...Typography.body,
    color: Colors.text,
    minHeight: 64,
    padding: 0,
  },
  reasonIcon: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Brand.primaryMuted,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionInfoText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Brand.primaryMuted,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoBannerText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.danger,
  },
  itemsCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadow.iosCard,
  },
  itemsCardMessage: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: Colors.white,
    gap: 12,
    paddingTop: 14,
    paddingBottom: 0,
  },
  itemCardDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  itemIndexTag: {
    backgroundColor: Brand.primaryMuted,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  itemIndexText: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
  },
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  productName: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  productMeta: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  itemKvTable: {
    backgroundColor: Colors.white,
  },
  itemKvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    minHeight: 44,
  },
  itemKvRowLast: {
    borderBottomWidth: 0,
  },
  itemKvKeyCell: {
    width: 88,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: Colors.borderLight,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.border,
  },
  itemKvKey: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  itemKvValueCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.white,
    minHeight: 44,
  },
  amountStepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  stepperBtn: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.borderLight,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    textAlign: 'center',
    ...Typography.subhead,
    color: Colors.text,
    paddingVertical: 0,
    backgroundColor: Colors.white,
  },
  itemKvTotal: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: Colors.white,
  },
  itemKvTotalBase: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  itemKvTotalIncl: {
    ...Typography.caption1,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'right',
  },
  taxCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
    ...Shadow.iosCard,
  },
  taxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  taxIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxTitle: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taxDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.primary,
    marginVertical: 4,
    opacity: 0.45,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    ...Typography.caption1,
    color: Colors.text,
    textAlign: 'right',
  },
  summaryBold: {
    fontWeight: '700',
    color: Colors.text,
  },
  summaryAccent: {
    color: Brand.primary,
    fontWeight: '700',
  },
  previewSection: { gap: 8 },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  previewTitle: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  previewToggle: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '600',
  },
});
