import { Button } from '@/components/ui/Button';
import { ServiceChipsSkeleton } from '@/components/ui/Skeleton';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { getCategoryCardStyle } from '@/data/categoryCardStyles';
import { useGuestRegistrationGate } from '@/hooks/useGuestRegistrationGate';
import { useProducts } from '@/hooks/useProducts';
import { useSellTranslation } from '@/hooks/useSellTranslation';
import { useSellBottomPadding } from '@/hooks/useTabBarInsets';
import { resolveKeypadCheckoutLines } from '@/services/productService';
import type { KeypadCheckoutLine } from '@/store/cartStore';
import { mergeKeypadLines, useCartStore } from '@/store/cartStore';
import { useConnectivityStore } from '@/store/connectivityStore';
import { useOfflineProductsStore } from '@/store/offlineProductsStore';
import type { Product } from '@/types';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { formatAmount } from '@/utils/format';
import { prefetchAppData } from '@/utils/prefetchAppData';
import { withLoading } from '@/utils/withLoading';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, PackageOpen, Plus, RefreshCw, Wallet } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface SellKeypadPanelProps {
  onCheckout: () => void;
  onViewAllServices?: () => void;
}

type AmountSource = 'empty' | 'service' | 'manual';

const KEY_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '+'],
] as const;

export function SellKeypadPanel({ onCheckout, onViewAllServices }: SellKeypadPanelProps) {
  const t = useSellTranslation();
  const queryClient = useQueryClient();
  const sellBottomPadding = useSellBottomPadding();
  const { requireRegistration, modal: guestRegistrationModal } = useGuestRegistrationGate();
  const keypadLines = useCartStore((s) => s.keypadLines);
  const setKeypadLines = useCartStore((s) => s.setKeypadLines);
  const beginKeypadCheckout = useCartStore((s) => s.beginKeypadCheckout);
  const setCheckoutSource = useCartStore((s) => s.setCheckoutSource);
  const cartItemCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const cartItems = useCartStore((s) => s.items);
  const cartSubtotal = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0)
  );

  const [entryCents, setEntryCents] = useState(0);
  const [note, setNote] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [amountSource, setAmountSource] = useState<AmountSource>('empty');
  const [isRegisteringAdd, setIsRegisteringAdd] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [serviceInputFocused, setServiceInputFocused] = useState(false);
  const noteInputRef = useRef<TextInput>(null);

  const isOnline = useConnectivityStore((s) => s.isOnline);
  const {
    data: onlineProducts = [],
    isLoading: onlineLoading,
    refetch: refetchOnline,
    isRefetching: onlineRefetching,
  } = useProducts();
  const offlineProducts = useOfflineProductsStore((s) => s.products);
  const refreshOfflineProducts = useOfflineProductsStore((s) => s.refresh);

  // Offline: services come from the manually-curated offline catalog.
  const products = isOnline ? onlineProducts : offlineProducts;
  const servicesLoading = isOnline ? onlineLoading : false;
  const servicesRefetching = isOnline ? onlineRefetching : false;
  const refetchServices = isOnline ? refetchOnline : refreshOfflineProducts;
  const serviceProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.productType === 'service' && !/^users?$/i.test(product.name.trim())
      ),
    [products]
  );
  const selectedService = useMemo(
    () => serviceProducts.find((product) => product.productId === selectedServiceId) ?? null,
    [serviceProducts, selectedServiceId]
  );

  const buildLine = (amount: number): KeypadCheckoutLine => {
    const fromService = selectedService != null;
    const serviceName = fromService ? selectedService.name : undefined;
    const trimmedNote = note.trim();

    return {
      amount,
      serviceId: fromService ? selectedService.productId : undefined,
      serviceName,
      serviceUomId: fromService ? selectedService.uomId : undefined,
      serviceTaxesIds: fromService ? selectedService.taxesIds : undefined,
      note: trimmedNote || undefined,
    };
  };

  const lineHasServiceOrNote = (line: {
    amount: number;
    serviceId?: string;
    note?: string;
  }) => {
    if (line.amount <= 0) return false;
    if (line.serviceId) return true;
    return Boolean(line.note?.trim());
  };

  const isCheckoutLineValid = (line: KeypadCheckoutLine) => {
    if (line.amount <= 0) return false;
    return lineHasServiceOrNote(line);
  };

  const amount = entryCents / 100;
  const savedLines = Array.isArray(keypadLines) ? keypadLines : [];
  const lineQuantity = (line: KeypadCheckoutLine) => line.quantity ?? 1;
  const validSavedCount = savedLines
    .filter((line) => isCheckoutLineValid(line))
    .reduce((sum, line) => sum + lineQuantity(line), 0);
  const currentEntryValid =
    entryCents > 0 && (selectedServiceId != null || note.trim().length > 0);
  const pendingItemCount = validSavedCount + (currentEntryValid ? 1 : 0);
  const checkoutItemCount = cartItemCount + pendingItemCount;
  const canCheckout = checkoutItemCount > 0;
  const canAdd = currentEntryValid && !isRegisteringAdd;

  const displayTotal = useMemo(() => {
    const savedTotal = savedLines
      .filter((line) => isCheckoutLineValid(line))
      .reduce((sum, line) => sum + line.amount * lineQuantity(line), 0);
    const keypadTotal = savedTotal + (entryCents > 0 ? amount : 0);
    return cartSubtotal + keypadTotal;
  }, [cartSubtotal, savedLines, entryCents, amount]);

  const needsLineRegistration = (line: KeypadCheckoutLine) =>
    !line.serviceId && Boolean(line.note?.trim());

  const needsLineResolution = (lines: KeypadCheckoutLine[]) =>
    lines.some(needsLineRegistration);

  useEffect(() => {
    if (cartItemCount > 0) {
      prefetchAppData();
    }
  }, [cartItemCount]);

  const handleRefreshServices = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void refetchServices();
  };

  const appendDigit = (digit: number) => {
    if (isRegisteringAdd) return;
    setServiceError(null);
    Haptics.selectionAsync();

    if (amountSource === 'service') {
      setAmountSource('manual');
      setEntryCents(digit);
      return;
    }

    if (amountSource === 'empty') {
      setAmountSource('manual');
      setEntryCents(digit);
      return;
    }

    setEntryCents((prev) =>
      prev === 0 ? digit : Math.min(prev * 10 + digit, 999_999_999)
    );
  };

  const resetEntry = () => {
    setEntryCents(0);
    setNote('');
    setSelectedServiceId(null);
    setServiceError(null);
    setAmountSource('empty');
  };

  const ensureServiceSelected = (): boolean => {
    if (entryCents === 0) return true;
    if (selectedServiceId) return true;
    if (note.trim()) return true;
    setServiceError(t.selectServiceError);
    return false;
  };

  const validateLinesForCheckout = (lines: KeypadCheckoutLine[]): boolean => {
    for (const line of lines) {
      if (!lineHasServiceOrNote(line)) {
        setServiceError(t.selectServiceError);
        return false;
      }
    }
    return true;
  };

  const prepareKeypadCheckout = async (lines: KeypadCheckoutLine[]) => {
    const resolved = await resolveKeypadCheckoutLines(lines);
    beginKeypadCheckout(resolved);
    resetEntry();
    void queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const navigateToCheckoutScreen = () => {
    onCheckout();
  };

  const buildCheckoutLines = (): KeypadCheckoutLine[] => {
    const saved = savedLines.filter((line) => isCheckoutLineValid(line));
    return currentEntryValid ? saved.concat(buildLine(amount)) : saved;
  };

  const handleCheckout = async () => {
    if (!canCheckout || isRegisteringAdd || isCheckingOut) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const lines = buildCheckoutLines();
    if (lines.length === 0 && cartItemCount > 0) {
      if (!requireRegistration()) return;
      setCheckoutSource('cart');
      navigateToCheckoutScreen();
      return;
    }

    if (!requireRegistration()) return;
    if (currentEntryValid && !ensureServiceSelected()) return;
    setServiceError(null);
    if (!validateLinesForCheckout(lines)) return;

    try {
      setIsCheckingOut(true);
      if (needsLineResolution(lines)) {
        await withLoading(() => prepareKeypadCheckout(lines), t.preparingCheckout);
      } else {
        beginKeypadCheckout(lines);
        resetEntry();
      }
      navigateToCheckoutScreen();
    } catch (error) {
      appAlert(t.checkoutFailed, getApiErrorMessage(error), undefined, { variant: 'error' });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleAddLine = async () => {
    if (!canAdd) return;
    if (!ensureServiceSelected()) return;

    const line = buildLine(amount);

    try {
      if (needsLineRegistration(line)) {
        setIsRegisteringAdd(true);
        const [resolved] = await resolveKeypadCheckoutLines([line]);
        await queryClient.invalidateQueries({ queryKey: ['products'] });
        setKeypadLines(mergeKeypadLines(savedLines.concat(resolved)));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setKeypadLines(mergeKeypadLines(savedLines.concat(line)));
      }
      resetEntry();
    } catch (error) {
      appAlert(t.couldNotAddService, getApiErrorMessage(error), undefined, { variant: 'error' });
    } finally {
      setIsRegisteringAdd(false);
    }
  };

  const handleKey = (key: (typeof KEY_ROWS)[number][number]) => {
    if (isRegisteringAdd) return;

    if (key === 'C') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (entryCents > 0) {
        resetEntry();
      } else {
        setKeypadLines([]);
      }
      return;
    }
    if (key === '+') {
      void handleAddLine();
      return;
    }
    appendDigit(Number(key));
  };

  const handleServicePress = (product: Product) => {
    const store = useCartStore.getState();
    const existing = store.items.find((item) => item.product_id === product.productId);
    const lines = Array.isArray(store.keypadLines) ? store.keypadLines : [];
    const hasKeypadLines = lines.some((line) => line.serviceId === product.productId);
    const isSelected =
      selectedServiceId === product.productId ||
      Boolean(existing) ||
      hasKeypadLines;

    if (isSelected) {
      if (existing) {
        store.removeItem(product.productId);
      }
      if (hasKeypadLines) {
        store.setKeypadLines(lines.filter((line) => line.serviceId !== product.productId));
      }
      if (selectedServiceId === product.productId) {
        setSelectedServiceId(null);
        if (note.trim() === product.name.trim()) {
          setNote('');
        }
        if (entryCents === 0) {
          setAmountSource('empty');
        }
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    store.addItem(product);
    store.setCheckoutSource(store.checkoutSource ?? 'keypad');
    setSelectedServiceId(product.productId);
    setNote(product.name);
    setServiceError(null);
    if (entryCents > 0) {
      setAmountSource('manual');
    } else {
      setAmountSource('service');
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const getServiceAddedCount = (productId: string): number => {
    const cartQty =
      cartItems.find((item) => item.product_id === productId)?.quantity ?? 0;
    const keypadQty = savedLines
      .filter((line) => line.serviceId === productId && isCheckoutLineValid(line))
      .reduce((sum, line) => sum + lineQuantity(line), 0);
    return cartQty + keypadQty;
  };

  const checkoutLabel = t.checkoutLabel(checkoutItemCount);

  return (
    <>
      <View style={styles.panel}>
      <View style={styles.topSection}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
        <LinearGradient
          colors={['#FCE7F3', '#FDF2F8', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <View style={styles.totalCopy}>
            <Text style={styles.totalLabel}>{t.totalAmount}</Text>
            <Text style={styles.totalValue}>{formatAmount(displayTotal)}</Text>
          </View>
          <Pressable
            style={[styles.walletBtn, (!canCheckout || isCheckingOut) && styles.walletBtnDisabled]}
            onPress={handleCheckout}
            disabled={!canCheckout || isRegisteringAdd || isCheckingOut}
          >
            <Wallet size={20} color={Brand.primary} strokeWidth={2.25} />
          </Pressable>
        </LinearGradient>

        <View style={[styles.serviceInputWrap, serviceInputFocused && styles.serviceInputWrapFocused]}>
          <Plus size={18} color={Brand.primary} strokeWidth={2.5} />
          <TextInput
            ref={noteInputRef}
            style={styles.serviceInput}
            value={note}
            onChangeText={(text) => {
              setNote(text);
              setServiceError(null);
              if (selectedServiceId) {
                const service = serviceProducts.find(
                  (product) => product.productId === selectedServiceId
                );
                if (service && text.trim() !== service.name.trim()) {
                  setSelectedServiceId(null);
                }
              }
            }}
            onFocus={() => setServiceInputFocused(true)}
            onBlur={() => setServiceInputFocused(false)}
            placeholder={t.enterServiceName}
            placeholderTextColor={Colors.textTertiary}
            maxLength={80}
          />
        </View>

        <View style={styles.quickServicesHeader}>
          <Text style={styles.quickServicesTitle}>{t.quickServices}</Text>
          <Pressable
            style={styles.quickServicesRefreshBtn}
            onPress={handleRefreshServices}
            disabled={servicesLoading || servicesRefetching}
            hitSlop={8}
          >
            {servicesRefetching ? (
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            ) : (
              <RefreshCw size={18} color={Colors.textSecondary} />
            )}
          </Pressable>
        </View>

        {serviceError ? <Text style={styles.serviceError}>{serviceError}</Text> : null}

        {servicesLoading ? (
          <ServiceChipsSkeleton />
        ) : serviceProducts.length === 0 ? (
          <View style={styles.serviceEmpty}>
            <PackageOpen size={22} color={Colors.textTertiary} />
            <Text style={styles.serviceEmptyTitle}>{t.noServicesTitle}</Text>
            <Text style={styles.serviceEmptyMessage}>
              {t.noServicesMessage}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickServicesRow}
          >
            {serviceProducts.map((product, index) => {
              const addedCount = getServiceAddedCount(product.productId);
              const selected =
                selectedServiceId === product.productId || addedCount > 0;
              const cardStyle = getCategoryCardStyle(index);
              return (
                <View key={product.productId} style={styles.quickServiceCardWrap}>
                  <Pressable
                    style={[styles.quickServiceCard, selected && styles.quickServiceCardSelected]}
                    onPress={() => handleServicePress(product)}
                  >
                    {addedCount > 0 ? (
                      <View style={styles.quickServiceBadge}>
                        <Text style={styles.quickServiceBadgeText}>{addedCount}</Text>
                      </View>
                    ) : null}
                    <View style={[styles.quickServiceIcon, { backgroundColor: cardStyle.bg }]}>
                      <Ionicons name={cardStyle.icon} size={14} color={cardStyle.iconColor} />
                    </View>
                    <Text
                      style={[styles.quickServiceName, selected && styles.quickServiceNameSelected]}
                    >
                      {product.name}
                    </Text>
                    <Text style={styles.quickServicePrice}>{formatAmount(product.sellingPrice)}</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}
        </ScrollView>
      </View>

      <View style={[styles.bottomStack, { paddingBottom: sellBottomPadding }]}>
        <View style={styles.keypad}>
          {KEY_ROWS.map((row) => (
            <View key={row.join('-')} style={styles.keyRow}>
              {row.map((key) => {
                const isAccentKey = key === 'C' || key === '+';
                const isAddKey = key === '+';
                const disabled = isAddKey && (!canAdd || isRegisteringAdd);

                return (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [
                      styles.key,
                      pressed && !disabled && styles.keyPressed,
                      disabled && styles.keyDisabled,
                    ]}
                    onPress={() => handleKey(key)}
                    disabled={disabled}
                  >
                    {isAddKey && isRegisteringAdd ? (
                      <ActivityIndicator color={Brand.primary} />
                    ) : (
                      <Text
                        style={[
                          styles.keyText,
                          isAccentKey && styles.keyTextAccent,
                          disabled && styles.keyTextDisabled,
                        ]}
                      >
                        {key}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <Button
          title={checkoutLabel}
          onPress={handleCheckout}
          loading={isCheckingOut}
          disabled={!canCheckout || isRegisteringAdd || isCheckingOut}
          style={styles.checkoutBtn}
          icon={<CreditCard size={18} color="#FFFFFF" strokeWidth={2.25} />}
        />
      </View>
    </View>
      {guestRegistrationModal}
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  topSection: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
    gap: 12,
    flexGrow: 1,
  },
  totalCard: {
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(227, 0, 116, 0.12)',
  },
  totalCopy: {
    flex: 1,
    gap: 4,
  },
  totalLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  totalValue: {
    ...Typography.title1,
    color: Colors.text,
    fontWeight: '700',
  },
  walletBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.iosCard,
  },
  walletBtnDisabled: {
    opacity: 0.55,
  },
  serviceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.iosCard,
  },
  serviceInputWrapFocused: {
    borderColor: Brand.primary,
  },
  serviceInput: {
    flex: 1,
    ...Typography.subhead,
    color: Colors.text,
    padding: 0,
  },
  quickServicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickServicesTitle: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
  },
  quickServicesRefreshBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllLink: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '600',
  },
  serviceError: {
    ...Typography.caption1,
    color: Colors.danger,
    fontWeight: '500',
    marginTop: -6,
  },
  serviceEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 88,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  serviceEmptyTitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  serviceEmptyMessage: {
    ...Typography.caption2,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  quickServicesRow: {
    gap: 8,
    paddingTop: 4,
    paddingRight: 8,
    alignItems: 'flex-start',
  },
  quickServiceCardWrap: {
    paddingTop: 6,
    paddingRight: 6,
  },
  quickServiceCard: {
    position: 'relative',
    alignSelf: 'flex-start',
    alignItems: 'center',
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 4,
    overflow: 'visible',
    ...Shadow.iosCard,
  },
  quickServiceCardSelected: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  quickServiceBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 2,
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  quickServiceBadgeText: {
    ...Typography.caption2,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 12,
  },
  quickServiceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickServiceName: {
    ...Typography.caption2,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  quickServiceNameSelected: {
    color: Brand.primary,
  },
  quickServicePrice: {
    ...Typography.caption2,
    color: Brand.primary,
    fontWeight: '700',
    lineHeight: 16,
  },
  bottomStack: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  keypad: {
    gap: 5,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 5,
  },
  key: {
    flex: 1,
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    ...Shadow.iosCard,
  },
  keyPressed: {
    backgroundColor: Brand.primaryMuted,
  },
  keyDisabled: {
    opacity: 0.45,
  },
  keyText: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '600',
  },
  keyTextAccent: {
    color: Brand.primary,
    fontWeight: '700',
  },
  keyTextDisabled: {
    color: Colors.textTertiary,
  },
  checkoutBtn: {
    height: 55,
    borderRadius: 14,
    backgroundColor: Brand.primary,
  },
});
