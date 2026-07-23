import { ChecheWalletQrModal } from '@/components/checkout/ChecheWalletQrModal';
import { CustomerPickerModal } from '@/components/invoicing/CustomerPickerModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { ETHIOPIAN_BANKS } from '@/data/ethiopianBanks';
import { useCheckoutTranslation } from '@/hooks/useCheckoutTranslation';
import { useCustomers } from '@/hooks/useInvoices';
import {
  buildCreatePosOrderPayload,
  createPosOrder,
  getGiftCardBalance,
  payPosOrder,
  resolvePaymentMethodCode,
  resolvePaymentMethodLabel,
  resolvePayOrderIrn,
  resolvePayOrderReference,
  validateCoupon,
  verifyChecheWalletOtp,
  type PaymentMode,
} from '@/services/posService';
import { OFFLINE_ORDER_PREFIX, OFFLINE_SESSION_PLACEHOLDER } from '@/services/offline/constants';
import { enqueueOfflineSale, isNetworkError } from '@/services/offline/offlineSaleService';
import { ensureSalesSession } from '@/services/sessionService';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useConnectivityStore } from '@/store/connectivityStore';
import { useLoadingModalStore } from '@/store/loadingModalStore';
import { usePaymentMethodsStore } from '@/store/paymentMethodsStore';
import { usePaymentTermsStore } from '@/store/paymentTermsStore';
import { useReceiptStore } from '@/store/receiptStore';
import { recordSoldProducts } from '@/store/recentProductsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTaxesStore } from '@/store/taxesStore';
import type { CartItem, CustomerRecord } from '@/types';
import type { ApiPaymentMethod, ApiPaymentTerm, ApiPayOrderResponse, PosPaymentPayload } from '@/types/api';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { calculateCartTaxBreakdown } from '@/utils/cartTax';
import { formatCurrency } from '@/utils/format';
import { stripToLocalPhone } from '@/utils/phone';
import { getUserDisplayPhone } from '@/utils/profileQr';
import { getGpsIsoTimestamp } from '@/utils/gpsTime';
import { waitForModalTransition, withLoading, withLoadingAfterDismiss } from '@/utils/withLoading';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import {
  Banknote,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Gift,
  Minus,
  PackageOpen,
  Plus,
  QrCode,
  ShoppingBag,
  Smartphone,
  Tag,
  Trash2,
  User,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const CHECHE_WALLET_ICON = require('../../assets/images/icon2.png');
const TELE_BIRR_ICON = require('../../assets/images/tele_birr.png');
const CONFIRM_MODAL_HANDLE_HEIGHT = 16;
const CONFIRM_MODAL_HEADER_HEIGHT = 48;
const CONFIRM_MODAL_FOOTER_HEIGHT = 57;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidCustomerPhone(value: string): boolean {
  return /^[97]\d{8}$/.test(stripToLocalPhone(value));
}

function isValidCustomerContact(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.includes('@')) return isValidEmail(trimmed);
  return isValidCustomerPhone(trimmed);
}

function customerContactMatches(customer: CustomerRecord, contact: string): boolean {
  const trimmed = contact.trim();
  if (!trimmed) return false;
  if (trimmed.includes('@')) {
    return (customer.email ?? '').trim().toLowerCase() === trimmed.toLowerCase();
  }
  const contactPhone = stripToLocalPhone(trimmed);
  return stripToLocalPhone(customer.phone ?? '') === contactPhone;
}

function customerContactDisplay(customer: CustomerRecord): string {
  return customer.phone?.trim() || customer.email?.trim() || customer.name;
}

type MethodVisual = {
  bg: string;
  Icon?: typeof Banknote;
  color?: string;
  image?: number;
};

function isChecheWalletMethod(method: ApiPaymentMethod): boolean {
  const code = resolvePaymentMethodCode(method);
  const label = resolvePaymentMethodLabel(method).toLowerCase();
  return code.includes('WALLET') || code.includes('CHEQUE') || label.includes('cheche wallet');
}

function methodVisual(method: ApiPaymentMethod): MethodVisual {
  const code = resolvePaymentMethodCode(method);
  if (code.includes('CASH')) {
    return { Icon: Banknote, bg: '#E8F9ED', color: '#34C759' };
  }
  if (code.includes('GIFT')) {
    return { Icon: Gift, bg: Brand.primaryMuted, color: Brand.primary };
  }
  if (code.includes('CARD') || code.includes('BANK') || code.includes('TRANSFER')) {
    return { Icon: CreditCard, bg: '#E8F4FD', color: '#2F80ED' };
  }
  if (code.includes('TELE') || code.includes('MOBILE')) {
    return { image: TELE_BIRR_ICON, bg: '#E8F9ED' };
  }
  if (isChecheWalletMethod(method)) {
    return { image: CHECHE_WALLET_ICON, bg: '#FFF4E5' };
  }

  return { Icon: CreditCard, bg: Colors.borderLight, color: Colors.textSecondary };
}

const SQUARE_CARD_SIZE = 80;

function isBankTransferMethod(method: ApiPaymentMethod): boolean {
  const code = resolvePaymentMethodCode(method);
  const label = resolvePaymentMethodLabel(method).toLowerCase();
  return code.includes('BANK') || code.includes('TRANSFER') || label.includes('bank transfer');
}

function isCashPaymentMethod(method: ApiPaymentMethod): boolean {
  return resolvePaymentMethodCode(method).includes('CASH');
}

interface CheckoutOrderItemRowProps {
  item: CartItem;
  showBorder: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

function CheckoutOrderItemRow({
  item,
  showBorder,
  onUpdateQuantity,
}: CheckoutOrderItemRowProps) {
  const [qtyText, setQtyText] = useState(String(item.quantity));

  useEffect(() => {
    setQtyText(String(item.quantity));
  }, [item.quantity]);

  const commitQuantity = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setQtyText(String(item.quantity));
      return;
    }

    const parsed = parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setQtyText(String(item.quantity));
      return;
    }

    if (parsed !== item.quantity) {
      onUpdateQuantity(item.product_id, parsed);
    }
  };

  const adjustQuantity = (delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdateQuantity(item.product_id, item.quantity + delta);
  };

  const codeLabel = item.product.variantName || item.product.sku;

  return (
    <View style={[styles.orderItem, showBorder && styles.orderItemBorder]}>
      <View style={styles.orderItemTop}>
        <ProductThumbnail uri={item.product.image} size={44} />
        <View style={styles.orderItemBody}>
          <Text style={styles.orderItemName} numberOfLines={2}>
            {item.product.name}
          </Text>
          <View style={styles.orderItemMeta}>
            {codeLabel ? (
              <Text style={styles.orderItemVariant} numberOfLines={1}>
                {codeLabel}
              </Text>
            ) : (
              <View style={styles.orderItemMetaSpacer} />
            )}
            <Text style={styles.orderItemPrice}>
              {formatCurrency(item.product.sellingPrice * item.quantity)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.orderItemQtyWrap}>
        <Pressable
          style={styles.orderItemQtyBtn}
          onPress={() => adjustQuantity(-1)}
          hitSlop={6}
        >
          <Minus size={18} color={Colors.textSecondary} strokeWidth={2.5} />
        </Pressable>
        <TextInput
          style={styles.orderItemQtyInput}
          value={qtyText}
          onChangeText={(text) => setQtyText(text.replace(/[^\d]/g, ''))}
          onBlur={() => commitQuantity(qtyText)}
          onSubmitEditing={() => commitQuantity(qtyText)}
          keyboardType="number-pad"
          returnKeyType="done"
          selectTextOnFocus
          maxLength={4}
        />
        <Pressable
          style={styles.orderItemQtyBtn}
          onPress={() => adjustQuantity(1)}
          hitSlop={6}
        >
          <Plus size={18} color={Brand.primary} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

export default function CheckoutScreen() {
  const t = useCheckoutTranslation();
  const business = useAuthStore((s) => s.business);
  const user = useAuthStore((s) => s.user);
  const setSessionId = useAuthStore((s) => s.setSessionId);
  const setThermalPreviewReceipt = useReceiptStore((s) => s.setThermalPreviewReceipt);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const {
    items,
    discount,
    getSubtotal,
    getTotal,
    getItemCount,
    clearCart,
    checkoutSource,
    keypadLines,
    selectedCustomer,
    setSelectedCustomer,
    updateQuantity,
  } = useCartStore();

  const isKeypadCheckout = checkoutSource === 'keypad';

  const paymentMethods = usePaymentMethodsStore((s) => s.methods);
  const paymentTerms = usePaymentTermsStore((s) => s.terms);
  const paymentTermsFetching = usePaymentTermsStore((s) => s.isFetching);
  const fetchPaymentTerms = usePaymentTermsStore((s) => s.fetchPaymentTerms);
  const taxes = useTaxesStore((s) => s.taxes);
  const fetchTaxes = useTaxesStore((s) => s.fetchTaxes);
  const isBusy = useLoadingModalStore((s) => s.visible);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState<ApiPaymentTerm | null>(null);
  const [paymentTermExpanded, setPaymentTermExpanded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<ApiPaymentMethod | null>(null);
  const [received, setReceived] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingOrderUuid, setPendingOrderUuid] = useState<string | null>(null);
  const [pendingCheche, setPendingCheche] = useState<{ transactionId: string; orderId: string } | null>(null);
  const [couponsModalOpen, setCouponsModalOpen] = useState(false);
  const [paymentModeModalOpen, setPaymentModeModalOpen] = useState(false);
  const [couponFocused, setCouponFocused] = useState(false);
  const [giftCardFocused, setGiftCardFocused] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [confirmScrollContentHeight, setConfirmScrollContentHeight] = useState(0);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerContact, setCustomerContact] = useState(() =>
    selectedCustomer ? customerContactDisplay(selectedCustomer) : ''
  );
  /** Only set when user picks from list/autofill — never when typing walk-in contact. */
  const pickedCustomerRef = useRef<CustomerRecord | null>(selectedCustomer);
  const [customerContactFocused, setCustomerContactFocused] = useState(false);
  const [customerContactError, setCustomerContactError] = useState<string | null>(null);
  const [bottomFieldFocused, setBottomFieldFocused] = useState(false);
  const [walletQrVisible, setWalletQrVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { bottom: safeBottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const customersQuery = useCustomers('all');

  const customers = useMemo(
    () => customersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [customersQuery.data]
  );

  const customerSuggestions = useMemo(() => {
    const query = customerContact.trim();
    if (query.length < 2) return [];
    const queryLower = query.toLowerCase();
    const queryPhone = stripToLocalPhone(query);
    return customers
      .filter((customer) => {
        const phone = stripToLocalPhone(customer.phone ?? '');
        const email = (customer.email ?? '').toLowerCase();
        const name = customer.name.toLowerCase();
        return (
          name.includes(queryLower) ||
          email.includes(queryLower) ||
          (queryPhone.length > 0 && phone.includes(queryPhone))
        );
      })
      .slice(0, 6);
  }, [customerContact, customers]);

  const showCustomerSuggestions =
    customerContactFocused && customerSuggestions.length > 0;

  const customerInputValue = selectedCustomer ? selectedCustomer.name : customerContact;

  const customerHelper = useMemo(() => {
    if (!selectedCustomer) return null;
    const phone = selectedCustomer.phone?.trim();
    if (phone) return { label: t.phone, value: phone };
    const email = selectedCustomer.email?.trim();
    if (email) return { label: t.shareEmailAddress, value: email };
    return null;
  }, [selectedCustomer, t.phone, t.shareEmailAddress]);

  const applyCustomer = (customer: CustomerRecord) => {
    pickedCustomerRef.current = customer;
    setSelectedCustomer(customer);
    setCustomerContact(customerContactDisplay(customer));
    setCustomerContactError(null);
    setCustomerContactFocused(false);
    setCustomerPickerOpen(false);
    Haptics.selectionAsync();
  };

  const handleCustomerContactChange = (value: string) => {
    setCustomerContact(value);
    setCustomerContactError(null);
    // Typing never registers or links a customer — walk-in only.
    pickedCustomerRef.current = null;
    if (selectedCustomer) {
      setSelectedCustomer(null);
    }
  };

  const resolveCheckoutCustomer = (): {
    customerId: string | null;
    walkInPhone: string | null;
  } => {
    const contact = customerContact.trim();
    const picked = pickedCustomerRef.current;

    // Registered customer only when explicitly picked from the list / autofill.
    if (picked?.id && customerContactMatches(picked, contact)) {
      return { customerId: picked.id, walkInPhone: null };
    }

    if (!contact) {
      return { customerId: null, walkInPhone: null };
    }

    // Typed email/phone: walk-in only — do not register or send customer_id.
    return {
      customerId: null,
      walkInPhone: contact.includes('@') ? contact : stripToLocalPhone(contact),
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleBottomFieldFocus = () => {
    setBottomFieldFocused(true);
    scrollToBottom();
  };

  const handleBottomFieldBlur = () => {
    setBottomFieldFocused(false);
  };

  const subtotal = getSubtotal();
  const taxBreakdown = useMemo(
    () => calculateCartTaxBreakdown(items, taxes),
    [items, taxes]
  );
  const baseTotal = getTotal();
  const total = Math.max(
    0,
    baseTotal - couponDiscount + taxBreakdown.totalTaxAmount
  );
  // The cashier can adjust the received amount on the checkout summary; the sale
  // is recorded at that amount, and the difference is folded into the receipt
  // discount so its arithmetic stays consistent. Credit mode keeps its own
  // partial-payment "received" field, so the override only applies to non-credit.
  const receivedAmountNum = parseFloat(receivedAmount);
  const effectiveTotal =
    paymentMode !== 'CREDIT' && Number.isFinite(receivedAmountNum) && receivedAmountNum >= 0
      ? receivedAmountNum
      : total;
  const priceAdjustment = total - effectiveTotal;
  const receivedNum = parseFloat(received) || 0;
  const selectedCode = selectedMethod ? resolvePaymentMethodCode(selectedMethod) : '';
  const isCashMethod = selectedCode.includes('CASH');
  const isCreditMode = paymentMode === 'CREDIT';
  const isBankTransfer = selectedMethod ? isBankTransferMethod(selectedMethod) : false;
  const isChecheWallet = selectedMethod ? isChecheWalletMethod(selectedMethod) : false;
  const needsPhone =
    selectedCode.includes('TELE') ||
    selectedCode.includes('WALLET') ||
    selectedCode.includes('MOBILE');
  const itemCount = getItemCount();
  const keypadNotes = isKeypadCheckout
    ? keypadLines.map((line, index) => ({ id: `note-${index}`, text: line.note })).filter((entry) => !!entry.text)
    : [];
  const hasOrderItems = items.length > 0 || keypadNotes.length > 0;
  const footerScrollPadding = hasOrderItems ? 132 + safeBottom : safeBottom + 16;

  useEffect(() => {
    if (isCreditMode) {
      void fetchPaymentTerms();
    }
  }, [isCreditMode, fetchPaymentTerms]);

  useEffect(() => {
    void fetchTaxes();
  }, [fetchTaxes]);

  useEffect(() => {
    if (paymentModeModalOpen && isCreditMode) {
      void fetchPaymentTerms();
      setPaymentTermExpanded(true);
      return;
    }
    if (!paymentModeModalOpen) {
      setPaymentTermExpanded(false);
    }
  }, [paymentModeModalOpen, isCreditMode, fetchPaymentTerms]);

  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedMethod) {
      const cash = paymentMethods.find((m) => resolvePaymentMethodCode(m).includes('CASH'));
      setSelectedMethod(cash ?? paymentMethods[0]);
    }
  }, [paymentMethods, selectedMethod]);

  // Offline: only cash is allowed. Snap the selection back to cash if a non-cash method was active.
  useEffect(() => {
    if (isOnline) return;
    if (selectedMethod && !isCashPaymentMethod(selectedMethod)) {
      const cash = paymentMethods.find(isCashPaymentMethod);
      if (cash) setSelectedMethod(cash);
    }
  }, [isOnline, selectedMethod, paymentMethods]);

  useEffect(() => {
    if (isCreditMode) {
      setReceived(total > 0 ? total.toFixed(2) : '');
      return;
    }
    setReceived('');
  }, [isCreditMode, total]);

  // Auto-fill the received amount from the computed total; the cashier can then
  // edit it. Re-syncs whenever the cart/coupon/taxes change the total.
  useEffect(() => {
    setReceivedAmount(total > 0 ? total.toFixed(2) : '');
  }, [total]);

  useEffect(() => {
    if (!isCreditMode) {
      setSelectedPaymentTerm(null);
    }
  }, [isCreditMode]);

  useEffect(() => {
    if (!isBankTransfer) {
      setSelectedBank('');
    }
  }, [isBankTransfer, selectedMethod?.id]);

  useEffect(() => {
    if (!isChecheWallet || !user?.phone) return;
    setPhoneNumber(getUserDisplayPhone(user.phone));
  }, [isChecheWallet, user?.phone]);

  const paymentLabel = useMemo(() => {
    const base = selectedMethod ? resolvePaymentMethodLabel(selectedMethod) : t.paymentFallback;
    if (isBankTransfer && selectedBank) return `${base} · ${selectedBank}`;
    return base;
  }, [selectedMethod, isBankTransfer, selectedBank, t.paymentFallback]);

  const paymentModeLabel = isCreditMode ? t.credit : t.cash;

  const confirmScrollMaxHeight = useMemo(() => {
    const modalChromeHeight =
      CONFIRM_MODAL_HANDLE_HEIGHT +
      CONFIRM_MODAL_HEADER_HEIGHT +
      CONFIRM_MODAL_FOOTER_HEIGHT +
      Math.max(safeBottom, 12);
    return Math.max(windowHeight * 0.9 - modalChromeHeight, 160);
  }, [safeBottom, windowHeight]);

  const confirmScrollHeight = useMemo(() => {
    if (confirmScrollContentHeight <= 0) return undefined;
    return Math.min(confirmScrollContentHeight, confirmScrollMaxHeight);
  }, [confirmScrollContentHeight, confirmScrollMaxHeight]);

  const confirmScrollEnabled =
    confirmScrollContentHeight > confirmScrollMaxHeight;

  useEffect(() => {
    if (!confirmVisible) {
      setConfirmScrollContentHeight(0);
    }
  }, [confirmVisible]);

  const applyCoupon = async () => {
    if (!couponCode.trim() || isBusy) return;
    try {
      await withLoading(async () => {
        const result = await validateCoupon(
          couponCode.trim(),
          subtotal,
          selectedCustomer?.id
        );
        const amount = Number(result.discount_amount ?? result.discountAmount ?? 0);
        if (!result.valid && amount <= 0) {
          appAlert(t.invalidCoupon, result.message ?? t.couponNotApplied, undefined, {
            variant: 'error',
          });
          return;
        }
        setCouponDiscount(amount);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, t.applyingCoupon);
    } catch (error) {
      appAlert(t.couponError, getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  const checkGiftCard = async () => {
    if (!giftCardCode.trim() || isBusy) return;
    try {
      await withLoading(async () => {
        const result = await getGiftCardBalance(giftCardCode.trim());
        const balance = Number(result.balance ?? result.available_balance ?? 0);
        setGiftCardBalance(balance);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, t.checkingBalance);
    } catch (error) {
      appAlert(t.giftCardError, getApiErrorMessage(error), undefined, { variant: 'error' });
      setGiftCardBalance(null);
    }
  };

  const handleClearCart = () => {
    appAlert(t.clearCartTitle, t.clearCartMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.clear,
        style: 'destructive',
        onPress: () => {
          clearCart();
        },
      },
    ], { variant: 'warning' });
  };

  const handleBackPress = () => {
    if (!hasOrderItems) {
      router.back();
      return;
    }

    appAlert(t.clearCartTitle, t.clearCartBackMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.yes,
        style: 'destructive',
        onPress: () => {
          clearCart();
          router.back();
        },
      },
    ], { variant: 'warning' });
  };

  const handleAddMore = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/sell');
  };

  const buildReceipt = (
    invoiceNumber: string,
    options?: { irn?: string; receiptNumber?: string; createdAt?: string }
  ) => {
    const contact = customerContact.trim();
    const customerPhone =
      selectedCustomer?.phone?.trim() ||
      (contact && !contact.includes('@') ? stripToLocalPhone(contact) || undefined : undefined);

    return {
      invoiceNumber,
      receiptNumber: options?.receiptNumber,
      items: [...items],
      subtotal,
      discount: discount + couponDiscount + priceAdjustment,
      total: effectiveTotal,
      taxAmount: taxBreakdown.totalTaxAmount,
      vatAmount: taxBreakdown.vatAmount,
      otherTaxAmount: taxBreakdown.taxAmount,
      paymentMethod: paymentLabel,
      receivedAmount: isCreditMode ? receivedNum : undefined,
      changeAmount: undefined,
      businessName: business?.name,
      businessLogo: business?.logo,
      operatorName: user?.fullName,
      customerName: selectedCustomer?.name?.trim() || undefined,
      customerPhone,
      createdAt: options?.createdAt ?? new Date().toISOString(),
      irn: options?.irn,
    };
  };

  const completePayment = async (orderUuid: string, payments: PosPaymentPayload[]) => {
    if (!selectedMethod) throw new Error('Select a payment method');

    const payResult = await payPosOrder(orderUuid, {
      payments,
      phoneNumber: needsPhone ? phoneNumber : undefined,
      coupon_code: couponCode.trim() || undefined,
      gift_card_code: giftCardCode.trim() || undefined,
      bank_name: isBankTransfer && selectedBank ? selectedBank : undefined,
    });

    return finalizeOrder(orderUuid, payResult);
  };

  const openThermalReceipt = (invoiceNumber: string, payResult?: ApiPayOrderResponse) => {
    const receiptNumber = payResult ? resolvePayOrderReference(payResult) : undefined;
    const receipt = buildReceipt(invoiceNumber, {
      irn: payResult ? resolvePayOrderIrn(payResult) : undefined,
      receiptNumber,
    });
    setThermalPreviewReceipt(receipt);
    if (!isKeypadCheckout) {
      recordSoldProducts(items.map((item) => item.product));
    }
    clearCart();
    router.replace({
      pathname: '/thermal-receipt-preview',
      params: { invoiceNumber: receiptNumber ?? invoiceNumber },
    });
  };

  const finalizeOrder = (
    orderUuid: string,
    result: ApiPayOrderResponse
  ): 'otp' | 'complete' => {
    const checheTxn = result.cheche_transaction_id ?? result.checheTransactionId;
    const checheOrder = result.cheche_order_id ?? result.checheOrderId;

    if (result.pending && checheTxn && checheOrder) {
      setPendingOrderUuid(orderUuid);
      setPendingCheche({ transactionId: checheTxn, orderId: checheOrder });
      return 'otp';
    }

    const invoiceNumber =
      result.invoice_number ??
      result.invoiceNumber ??
      result.invoice_uuid ??
      `INV-${Date.now().toString().slice(-6)}`;

    openThermalReceipt(String(invoiceNumber), result);
    return 'complete';
  };

  const buildOrderPayments = (): PosPaymentPayload[] => {
    if (!selectedMethod) throw new Error('Select a payment method');
    return [
      {
        method_id: selectedMethod.id,
        method: resolvePaymentMethodCode(selectedMethod),
        amount: effectiveTotal,
      },
    ];
  };

  const validateCheckout = (): { message: string; variant: 'info' | 'error' } | null => {
    if (items.length === 0) return { message: t.errAddItem, variant: 'error' };
    if (!selectedMethod) return { message: t.errSelectPayment, variant: 'info' };
    if (isCreditMode && !selectedPaymentTerm) return { message: t.errSelectPaymentTerm, variant: 'info' };
    if (isCreditMode && receivedNum > total) return { message: t.errReceivedExceedsTotal, variant: 'error' };
    if (customerContact.trim() && !isValidCustomerContact(customerContact)) {
      setCustomerContactError(t.errInvalidCustomerContact);
      return { message: t.errInvalidCustomerContact, variant: 'error' };
    }
    if (needsPhone && phoneNumber.trim().length < 10) {
      return { message: t.errEnterPhone, variant: 'error' };
    }
    if (isBankTransfer && !selectedBank) return { message: t.errSelectBank, variant: 'info' };
    return null;
  };

  const handleConfirmPress = () => {
    const error = validateCheckout();
    if (error) {
      appAlert(t.checkoutAlertTitle, error.message, undefined, {
        variant: error.variant,
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfirmVisible(true);
  };

  // Queue the sale to the local offline outbox (cash only) and print a provisional receipt.
  const queueOfflineSale = async () => {
    if (isCreditMode || selectedCode !== 'CASH') {
      appAlert(
        t.checkoutAlertTitle,
        'Only cash payments can be completed while offline. Switch the payment method to Cash to continue.',
        undefined,
        { variant: 'info' }
      );
      return;
    }
    if (!selectedMethod) {
      appAlert(t.checkoutAlertTitle, t.errSelectPayment, undefined, { variant: 'info' });
      return;
    }

    try {
      await withLoadingAfterDismiss(async () => {
        const createdAt = await getGpsIsoTimestamp();
        const orderNumber = `${OFFLINE_ORDER_PREFIX}-${Date.now()}`;
        const { customerId, walkInPhone } = resolveCheckoutCustomer();
        const payments = buildOrderPayments();
        const payload = buildCreatePosOrderPayload({
          orderNumber,
          sessionId: OFFLINE_SESSION_PLACEHOLDER,
          paymentMode: 'CASH',
          paymentTermId: null,
          customerId,
          walkInPhone,
          lines: items.map((item) => {
            if (!item.product_id) {
              throw new Error('Cart item is missing product_id. Clear the cart and add products again.');
            }
            return {
              productId: item.product_id,
              qty: item.quantity,
              unitPrice: item.product.sellingPrice,
              uomId: item.product.uomId,
              taxesIds: item.product.taxesIds,
            };
          }),
          payments,
        });

        const receipt = {
          ...buildReceipt(orderNumber, { createdAt }),
          provisional: true,
        };

        await enqueueOfflineSale({
          clientUuid: Crypto.randomUUID(),
          orderNumber,
          total: effectiveTotal,
          createdAt,
          payload,
          payments,
          receipt,
        });

        setThermalPreviewReceipt(receipt);
        if (!isKeypadCheckout) {
          recordSoldProducts(items.map((item) => item.product));
        }
        clearCart();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace({
          pathname: '/thermal-receipt-preview',
          params: { invoiceNumber: orderNumber },
        });
      }, 'Saving offline sale...');
    } catch (error) {
      await waitForModalTransition();
      appAlert(t.checkoutFailed, getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  const handleComplete = async () => {
    const error = validateCheckout();
    if (error) {
      appAlert(t.checkoutAlertTitle, error.message, undefined, {
        variant: error.variant,
      });
      return;
    }

    setConfirmVisible(false);

    const isOnline = useConnectivityStore.getState().isOnline;
    const offlineEnabled = useSettingsStore.getState().offlineModeEnabled;

    if (!isOnline) {
      if (!offlineEnabled) {
        appAlert(
          t.checkoutAlertTitle,
          'No internet connection. Enable "Work offline" in Settings to complete cash sales without a connection.',
          undefined,
          { variant: 'error' }
        );
        return;
      }
      await queueOfflineSale();
      return;
    }

    try {
      let nextStep: 'otp' | 'complete' | null = null;

      await withLoadingAfterDismiss(async () => {
        const payments = buildOrderPayments();
        const activeSessionId = await ensureSalesSession();
        setSessionId(activeSessionId);
        const { customerId, walkInPhone } = resolveCheckoutCustomer();

        const order = await createPosOrder(
          buildCreatePosOrderPayload({
            orderNumber: `POS-${Date.now()}`,
            sessionId: activeSessionId,
            paymentMode,
            paymentTermId: isCreditMode ? selectedPaymentTerm?.id : null,
            customerId,
            walkInPhone,
            lines: items.map((item) => {
              if (!item.product_id) {
                throw new Error('Cart item is missing product_id. Clear the cart and add products again.');
              }
              return {
                productId: item.product_id,
                qty: item.quantity,
                unitPrice: item.product.sellingPrice,
                uomId: item.product.uomId,
                taxesIds: item.product.taxesIds,
              };
            }),
            payments,
          })
        );

        const orderUuid = order.uuid ?? order.id;
        if (!orderUuid) throw new Error('Failed to create order');

        const checheTxn = order.cheche_transaction_id ?? order.checheTransactionId;
        const checheOrder = order.cheche_order_id ?? order.checheOrderId;

        if (order.pending && checheTxn && checheOrder) {
          nextStep = finalizeOrder(String(orderUuid), order);
        } else {
          nextStep = await completePayment(String(orderUuid), payments);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, t.processingPayment);

      if (nextStep === 'otp') {
        await waitForModalTransition();
        setOtpVisible(true);
      }
    } catch (error) {
      // Connection dropped mid-request: fall back to the offline queue when enabled (cash only).
      if (useSettingsStore.getState().offlineModeEnabled && isNetworkError(error)) {
        await waitForModalTransition();
        await queueOfflineSale();
        return;
      }
      await waitForModalTransition();
      appAlert(t.checkoutFailed, getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingOrderUuid || !pendingCheche || otp.length < 4 || isBusy) return;
    try {
      await withLoading(async () => {
        const payResult = await verifyChecheWalletOtp(
          pendingOrderUuid,
          otp,
          pendingCheche.transactionId,
          pendingCheche.orderId
        );
        const invoiceNumber =
          payResult.invoice_number ??
          payResult.invoiceNumber ??
          payResult.invoice_uuid ??
          `INV-${Date.now().toString().slice(-6)}`;

        openThermalReceipt(String(invoiceNumber), payResult);
        setOtpVisible(false);
      }, t.verifyingOtp);
    } catch (error) {
      await waitForModalTransition();
      appAlert(t.otpVerificationFailed, getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t.title}
        onBack={handleBackPress}
        right={
 <>
          {hasOrderItems ? (
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [styles.headerActionBtn, styles.headerAddBtn, pressed && styles.headerActionBtnPressed]}
              onPress={handleAddMore}
              hitSlop={4}
            >
              <Plus size={14} color={Brand.primary} strokeWidth={2.5} />
              <Text style={styles.headerActionAddText}>{t.add}</Text>
            </Pressable>
          
              <Pressable
                style={({ pressed }) => [styles.headerActionBtn, styles.headerClearBtn, pressed && styles.headerActionBtnPressed]}
                onPress={handleClearCart}
                hitSlop={4}
              >
                <Trash2 size={14} color={Colors.danger} strokeWidth={2.5} />
                <Text style={styles.headerActionClearText}>{t.clear}</Text>
              </Pressable>
           
          </View>
        ) : null}
 </>
        }
      />

      {hasOrderItems ? (
        <View style={styles.customerPhoneSection} pointerEvents="box-none">
          <View style={styles.customerPhoneCard}>
            <Input
              label={t.addCustomer}
              variant="flat"
              value={customerInputValue}
              onChangeText={handleCustomerContactChange}
              placeholder={t.customerContactPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={selectedCustomer ? 'default' : 'email-address'}
              scrollEnabled
              error={customerContactError ?? undefined}
              onFocus={() => setCustomerContactFocused(true)}
              onBlur={() => {
                setTimeout(() => setCustomerContactFocused(false), 150);
                if (customerContact.trim() && !isValidCustomerContact(customerContact)) {
                  setCustomerContactError(t.errInvalidCustomerContact);
                }
              }}
              icon={<User size={20} color={Colors.textSecondary} />}
              rightAccessory={
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCustomerPickerOpen(true);
                  }}
                  hitSlop={8}
                  style={styles.customerPlusBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t.selectCustomerHint}
                >
                  <Plus size={20} color={Brand.primary} strokeWidth={2.5} />
                </Pressable>
              }
            />
            {customerHelper ? (
              <Text style={styles.customerHelperText} numberOfLines={1}>
                <Text style={styles.customerHelperKey}>{customerHelper.label}: </Text>
                {customerHelper.value}
              </Text>
            ) : null}
          </View>
          {showCustomerSuggestions ? (
            <View style={styles.customerSuggestions}>
              {customerSuggestions.map((customer) => (
                <Pressable
                  key={customer.id}
                  style={styles.customerSuggestionRow}
                  onPress={() => applyCustomer(customer)}
                >
                  <View style={styles.customerSuggestionText}>
                    <Text style={styles.customerSuggestionName} numberOfLines={1}>
                      {customer.name}
                    </Text>
                    {customer.phone || customer.email ? (
                      <Text style={styles.customerSuggestionPhone} numberOfLines={1}>
                        {customer.phone || customer.email}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={bottomFieldFocused ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}
        keyboardVerticalOffset={bottomFieldFocused && Platform.OS === 'ios' ? 8 : 0}
        enabled={bottomFieldFocused}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: footerScrollPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View style={[styles.panel, !hasOrderItems && styles.panelLast]}>
          <View style={styles.panelHeader}>
            <View style={styles.cardTitleRow}>
              <ShoppingBag size={18} color={Brand.primary} />
              <Text style={styles.panelTitle}>{t.orderSummary}</Text>
            </View>
            <View style={styles.itemBadge}>
              <Text style={styles.itemBadgeText}>
                {t.itemCount(itemCount)}
              </Text>
            </View>
          </View>

          {hasOrderItems ? (
            <>
              <View style={styles.orderList}>
                {keypadNotes.map((entry, noteIndex) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.orderNoteRow,
                      (noteIndex < keypadNotes.length - 1 || items.length > 0) && styles.orderItemBorder,
                    ]}
                  >
                    <View style={styles.orderItemBody}>
                      <Text style={styles.orderNoteLabel}>{t.note}</Text>
                      <Text style={styles.orderNoteText}>{entry.text}</Text>
                    </View>
                  </View>
                ))}
                {items.map((item, index) => (
                  <CheckoutOrderItemRow
                    key={item.product_id}
                    item={item}
                    showBorder={index < items.length - 1}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
              </View>

              <View style={styles.summaryBlock}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t.subtotal}</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                </View>
                {(discount + couponDiscount) > 0 ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t.discount}</Text>
                    <Text style={[styles.summaryValue, styles.discountText]}>
                      -{formatCurrency(discount + couponDiscount)}
                    </Text>
                  </View>
                ) : null}
                {taxBreakdown.vatAmount > 0 ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t.vat}</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(taxBreakdown.vatAmount)}
                    </Text>
                  </View>
                ) : null}
                {taxBreakdown.taxAmount > 0 ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t.tax}</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(taxBreakdown.taxAmount)}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>{t.totalAmount}</Text>
                  <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
                {!isCreditMode ? (
                  <View style={styles.receivedAmountWrap}>
                    <Input
                      label="Received Amount"
                      value={receivedAmount}
                      onChangeText={setReceivedAmount}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                      placeholder={total > 0 ? total.toFixed(2) : '0.00'}
                    />
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <View style={styles.orderEmpty}>
              <View style={styles.orderEmptyIcon}>
                <PackageOpen size={36} color={Brand.primary} />
              </View>
              <Text style={styles.orderEmptyTitle}>{t.noItemsInCart}</Text>
              <Text style={styles.orderEmptyMessage}>
                {t.noItemsMessage}
              </Text>
              <Pressable style={styles.orderEmptyBtn} onPress={handleAddMore}>
                <Plus size={18} color="#fff" strokeWidth={2.5} />
                <Text style={styles.orderEmptyBtnText}>{t.addItemService}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {hasOrderItems ? (
          <>
        {isCreditMode && (
          <View style={styles.panel}>
            <Input
              label={t.receivedAmount}
              placeholder="0.00"
              value={received}
              onChangeText={setReceived}
              keyboardType="decimal-pad"
              onFocus={handleBottomFieldFocus}
              onBlur={handleBottomFieldBlur}
            />
          </View>
        )}

        <View style={styles.panel}>
          <Text style={styles.sectionLabel}>{t.paymentMethods}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paymentCardsRow}
          >
            {paymentMethods.map((method) => {
              const visual = methodVisual(method);
              const { Icon, image } = visual;
              const active = selectedMethod?.id === method.id;
              const label = resolvePaymentMethodLabel(method);
              // Offline: only cash can be taken — Bank, Telebirr and Cheche Wallet are disabled.
              const disabled = !isOnline && !isCashPaymentMethod(method);

              return (
                <Pressable
                  key={String(method.id)}
                  style={[
                    styles.paymentCard,
                    active && styles.paymentCardActive,
                    disabled && styles.paymentCardDisabled,
                  ]}
                  disabled={disabled}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedMethod(method);
                  }}
                >
                  <View style={[styles.paymentCardIconWrap, active && styles.paymentCardIconWrapActive]}>
                    {image ? (
                      <Image source={image} style={styles.paymentCardImage} resizeMode="cover" />
                    ) : (
                      Icon && (
                        <Icon size={18} color={active ? Brand.primary : Colors.textSecondary} />
                      )
                    )}
                  </View>
                  <Text
                    style={[styles.paymentCardLabel, active && styles.paymentCardLabelActive]}
                    numberOfLines={2}
                  >
                    {label}
                  </Text>
                  {disabled ? (
                    <Text style={styles.paymentCardOfflineTag} numberOfLines={1}>
                      Offline
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {isBankTransfer && (
            <View style={styles.bankTransferExtra}>
              <Text style={styles.fieldLabel}>{t.bankType}</Text>
              <Pressable
                style={styles.bankPicker}
                onPress={() => {
                  Haptics.selectionAsync();
                  setBankPickerOpen(true);
                }}
              >
                <Text
                  style={[
                    styles.bankPickerText,
                    !selectedBank && styles.bankPickerPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedBank || t.selectBank}
                </Text>
                <ChevronDown size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
          )}

          {needsPhone && (
            <View style={styles.extraField}>
              <Input
                label={t.customerPhone}
                placeholder="0912345678"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                onFocus={handleBottomFieldFocus}
                onBlur={handleBottomFieldBlur}
                icon={<Smartphone size={18} color={Colors.textSecondary} />}
                rightAccessory={
                  isChecheWallet ? (
                    <Pressable
                      onPress={() => setWalletQrVisible(true)}
                      hitSlop={8}
                      style={styles.qrBtn}
                    >
                      <QrCode size={20} color={Brand.primary} />
                    </Pressable>
                  ) : undefined
                }
              />
            </View>
          )}
        </View>

        <Pressable style={styles.panel} onPress={() => setCouponsModalOpen(true)}>
          <View style={styles.settingRow}>
            <View style={styles.cardTitleRow}>
              <Tag size={18} color={Brand.primary} />
              <Text style={styles.panelTitle}>{t.couponsAndGiftCards}</Text>
            </View>
            <View style={styles.settingTrailing}>
              <Text style={styles.settingValue} numberOfLines={1}>
                {couponDiscount > 0
                  ? `-${formatCurrency(couponDiscount)}`
                  : giftCardCode.trim()
                    ? giftCardCode.trim().toUpperCase()
                    : t.none}
              </Text>
              <ChevronRight size={20} color={Colors.textTertiary} />
            </View>
          </View>
        </Pressable>

        <Pressable style={[styles.panel, styles.panelLast]} onPress={() => setPaymentModeModalOpen(true)}>
          <View style={styles.settingRow}>
            <View style={styles.cardTitleRow}>
              <CalendarClock size={18} color={Brand.primary} />
              <Text style={styles.panelTitle}>{t.modeOfPayment}</Text>
            </View>
            <View style={styles.settingTrailing}>
              <Text style={styles.settingValue} numberOfLines={1}>
                {isCreditMode && selectedPaymentTerm
                  ? `${paymentModeLabel} · ${selectedPaymentTerm.name}`
                  : paymentModeLabel}
              </Text>
              <ChevronRight size={20} color={Colors.textTertiary} />
            </View>
          </View>
        </Pressable>
          </>
        ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {hasOrderItems ? (
      <SafeAreaView style={styles.footerSafe} edges={['bottom']}>
        <View style={styles.footerCard}>
          <View style={styles.footerTop}>
            <View>
              <Text style={styles.footerLabel}>{t.amountToPay}</Text>
              <Text style={styles.footerHint}>
                {t.itemCount(itemCount)} · {paymentLabel}
              </Text>
            </View>
            <Text style={styles.footerAmount}>{formatCurrency(total)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && styles.confirmBtnPressed,
              isBusy && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirmPress}
            disabled={isBusy}
          >
            <Text style={styles.confirmText}>{t.confirmPayment}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      ) : null}

      <Modal
        visible={couponsModalOpen}
        onClose={() => setCouponsModalOpen(false)}
        title={t.couponsAndGiftCards}
        keyboardAvoiding
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.couponModalScroll}
        >
          <View style={styles.couponBody}>
            <View style={styles.inlineRow}>
              <View style={[styles.codeInputWrap, couponFocused && styles.codeInputWrapFocused]}>
                <Tag size={16} color={Brand.primary} />
                <TextInput
                  style={styles.codeInput}
                  placeholder={t.enterCouponCode}
                  placeholderTextColor={Colors.textTertiary}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  onFocus={() => setCouponFocused(true)}
                  onBlur={() => setCouponFocused(false)}
                  autoCapitalize="characters"
                />
              </View>
              <Pressable
                style={[styles.applyBtn, isBusy && styles.actionBtnDisabled]}
                onPress={applyCoupon}
                disabled={isBusy}
              >
                <Text style={styles.applyBtnText}>{t.apply}</Text>
              </Pressable>
            </View>
            <Text style={styles.helperText}>{t.couponDiscountHint}</Text>

            <View style={[styles.inlineRow, styles.giftRow]}>
              <View style={[styles.codeInputWrap, giftCardFocused && styles.codeInputWrapFocused]}>
                <Gift size={16} color={Brand.primary} />
                <TextInput
                  style={styles.codeInput}
                  placeholder={t.enterGiftCardCode}
                  placeholderTextColor={Colors.textTertiary}
                  value={giftCardCode}
                  onChangeText={setGiftCardCode}
                  onFocus={() => setGiftCardFocused(true)}
                  onBlur={() => setGiftCardFocused(false)}
                  autoCapitalize="characters"
                />
              </View>
              <Pressable
                style={[styles.checkBalanceBtn, isBusy && styles.actionBtnDisabled]}
                onPress={checkGiftCard}
                disabled={isBusy}
              >
                <Text style={styles.checkBalanceText}>{t.checkBalance}</Text>
              </Pressable>
            </View>
            <Text style={styles.helperText}>
              {giftCardBalance !== null
                ? t.giftCardBalance(formatCurrency(giftCardBalance))
                : t.giftCardBalanceUsed}
            </Text>

            <View style={styles.paySummary}>
              <View style={styles.paySummaryCol}>
                <Text style={styles.paySummaryLabel}>{t.total}</Text>
                <Text style={styles.paySummaryValue}>{formatCurrency(subtotal)}</Text>
              </View>
              <View style={styles.paySummaryDivider} />
              <View style={styles.paySummaryCol}>
                <Text style={styles.paySummaryLabel}>{t.discount}</Text>
                <Text style={[styles.paySummaryValue, styles.discountValue]}>
                  -{formatCurrency(couponDiscount)}
                </Text>
              </View>
              <View style={styles.paySummaryDivider} />
              <View style={styles.paySummaryCol}>
                <Text style={styles.paySummaryLabel}>{t.amountToPay}</Text>
                <Text style={[styles.paySummaryValue, styles.amountToPayValue]}>
                  {formatCurrency(total)}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.modalDoneBtn}
              onPress={() => setCouponsModalOpen(false)}
            >
              <Text style={styles.modalDoneBtnText}>{t.done}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>

      <Modal visible={paymentModeModalOpen} onClose={() => setPaymentModeModalOpen(false)} title={t.modeOfPayment}>
        <View style={styles.paymentModeModal}>
          <Text style={styles.sectionLabel}>{t.selectMode}</Text>
          <View style={styles.modeCardsRow}>
            {(['CASH', 'CREDIT'] as const).map((mode) => {
              const active = paymentMode === mode;
              const label = mode === 'CASH' ? t.cash : t.credit;
              const Icon = mode === 'CASH' ? Banknote : CalendarClock;
              return (
                <Pressable
                  key={mode}
                  style={[styles.modeCard, active && styles.modeCardActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPaymentMode(mode);
                    if (mode === 'CREDIT') {
                      void fetchPaymentTerms();
                      setPaymentTermExpanded(true);
                    } else {
                      setPaymentTermExpanded(false);
                    }
                  }}
                >
                  <View style={[styles.modeCardIconWrap, active && styles.modeCardIconWrapActive]}>
                    <Icon size={20} color={active ? Brand.primary : Colors.textSecondary} />
                  </View>
                  <Text
                    style={[styles.modeCardLabel, active && styles.modeCardLabelActive]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isCreditMode && (
            <View style={styles.paymentTermExtra}>
              <Text style={styles.fieldLabel}>{t.paymentTerm}</Text>
              <Pressable
                style={styles.bankPicker}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (paymentTerms.length === 0) {
                    void fetchPaymentTerms();
                  }
                  setPaymentTermExpanded((open) => !open);
                }}
              >
                <Text
                  style={[
                    styles.bankPickerText,
                    !selectedPaymentTerm && styles.bankPickerPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {paymentTermsFetching && paymentTerms.length === 0
                    ? t.loadingPaymentTerms
                    : selectedPaymentTerm?.name || t.selectPaymentTerm}
                </Text>
                {paymentTermExpanded ? (
                  <ChevronUp size={18} color={Colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={Colors.textSecondary} />
                )}
              </Pressable>

              {paymentTermExpanded ? (
                <View style={styles.termOptionList}>
                  {paymentTermsFetching && paymentTerms.length === 0 ? (
                    <Text style={styles.emptyTermsText}>{t.loadingPaymentTerms}</Text>
                  ) : paymentTerms.length === 0 ? (
                    <Text style={styles.emptyTermsText}>{t.noPaymentTerms}</Text>
                  ) : (
                    paymentTerms.map((term) => {
                      const active = selectedPaymentTerm?.id === term.id;
                      return (
                        <Pressable
                          key={term.id}
                          style={[styles.termOption, active && styles.termOptionActive]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setSelectedPaymentTerm(term);
                            setPaymentTermExpanded(false);
                          }}
                        >
                          <Text style={[styles.termOptionText, active && styles.termOptionTextActive]}>
                            {term.name}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              ) : null}
            </View>
          )}

          <Pressable
            style={styles.modalDoneBtn}
            onPress={() => setPaymentModeModalOpen(false)}
          >
            <Text style={styles.modalDoneBtnText}>{t.done}</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title={t.confirmPayment}
        compactBottom
        fitContent
      >
        <View style={styles.confirmModalLayout}>
          <ScrollView
            showsVerticalScrollIndicator={confirmScrollEnabled}
            scrollEnabled={confirmScrollEnabled}
            style={[
              styles.confirmScroll,
              confirmScrollHeight != null && { height: confirmScrollHeight },
            ]}
            contentContainerStyle={styles.confirmScrollContent}
            onContentSizeChange={(_, height) => setConfirmScrollContentHeight(height)}
          >
            <View style={styles.confirmSection}>
              <Text style={styles.confirmSectionTitle}>{t.orderItems}</Text>
              <View style={styles.confirmItemsList}>
                {keypadNotes.map((entry, noteIndex) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.confirmNoteRow,
                      (noteIndex < keypadNotes.length - 1 || items.length > 0) &&
                        styles.confirmListRowBorder,
                    ]}
                  >
                    <Text style={styles.confirmNoteLabel}>{t.note}</Text>
                    <Text style={styles.confirmNoteText}>{entry.text}</Text>
                  </View>
                ))}
                {items.map((item, index) => (
                  <View
                    key={item.product_id}
                    style={[
                      styles.confirmItemRow,
                      index < items.length - 1 && styles.confirmListRowBorder,
                    ]}
                  >
                    <ProductThumbnail uri={item.product.image} size={40} />
                    <View style={styles.confirmItemInfo}>
                      <Text style={styles.confirmItemName} numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      {isKeypadCheckout ? (
                        <Text style={styles.confirmItemVariant} numberOfLines={1}>
                          {t.service}
                        </Text>
                      ) : null}
                      {!isKeypadCheckout && item.product.variantName ? (
                        <Text style={styles.confirmItemVariant} numberOfLines={1}>
                          {item.product.variantName}
                        </Text>
                      ) : null}
                      <Text style={styles.confirmItemMeta}>
                        <Text style={styles.confirmItemQty}>× {item.quantity}</Text>
                        {' · '}
                        {formatCurrency(item.product.sellingPrice)}
                      </Text>
                    </View>
                    <Text style={styles.confirmItemTotal}>
                      {formatCurrency(item.product.sellingPrice * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.confirmSection}>
              <Text style={styles.confirmSectionTitle}>{t.summary}</Text>
              <View style={styles.confirmSummaryRow}>
                <Text style={styles.confirmLabel}>{t.subtotal}</Text>
                <Text style={styles.confirmValue}>{formatCurrency(subtotal)}</Text>
              </View>
              {(discount + couponDiscount) > 0 && (
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmLabel}>{t.discount}</Text>
                  <Text style={[styles.confirmValue, styles.confirmDiscount]}>
                    -{formatCurrency(discount + couponDiscount)}
                  </Text>
                </View>
              )}
              {taxBreakdown.vatAmount > 0 ? (
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmLabel}>{t.vat}</Text>
                  <Text style={styles.confirmValue}>
                    {formatCurrency(taxBreakdown.vatAmount)}
                  </Text>
                </View>
              ) : null}
              {taxBreakdown.taxAmount > 0 ? (
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmLabel}>{t.tax}</Text>
                  <Text style={styles.confirmValue}>
                    {formatCurrency(taxBreakdown.taxAmount)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.confirmSummaryRow}>
                <Text style={styles.confirmLabelBold}>{t.total}</Text>
                <Text style={styles.confirmTotal}>{formatCurrency(effectiveTotal)}</Text>
              </View>
              {Math.abs(priceAdjustment) >= 0.01 ? (
                <View style={styles.confirmAdjustCard}>
                  <Text style={styles.confirmAdjustTitle}>
                    {priceAdjustment > 0
                      ? 'Received amount is below the calculated total'
                      : 'Received amount is above the calculated total'}
                  </Text>
                  <Text style={styles.confirmAdjustText}>
                    Calculated total is {formatCurrency(total)}, received amount is{' '}
                    {formatCurrency(effectiveTotal)} ({priceAdjustment > 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(priceAdjustment))}). The sale will be
                    recorded at the received amount.
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.confirmSection, styles.confirmSectionLast]}>
              <Text style={styles.confirmSectionTitle}>{t.paymentDetails}</Text>
              <View style={styles.confirmSummaryRow}>
                <Text style={styles.confirmLabel}>{t.mode}</Text>
                <Text style={styles.confirmValue}>{paymentModeLabel}</Text>
              </View>
              {isCreditMode && selectedPaymentTerm ? (
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmLabel}>{t.paymentTerm}</Text>
                  <Text style={styles.confirmValue}>{selectedPaymentTerm.name}</Text>
                </View>
              ) : null}
              <View style={styles.confirmSummaryRow}>
                <Text style={styles.confirmLabel}>{t.method}</Text>
                <Text style={styles.confirmValue}>{paymentLabel}</Text>
              </View>
              {isCreditMode && (
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmLabel}>{t.received}</Text>
                  <Text style={styles.confirmValue}>{formatCurrency(receivedNum)}</Text>
                </View>
              )}
              {needsPhone && phoneNumber.trim() ? (
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmLabel}>{t.phone}</Text>
                  <Text style={styles.confirmValue}>{phoneNumber.trim()}</Text>
                </View>
              ) : null}
              {couponCode.trim() ? (
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmLabel}>{t.coupon}</Text>
                  <Text style={styles.confirmValue}>{couponCode.trim().toUpperCase()}</Text>
                </View>
              ) : null}
              {giftCardCode.trim() ? (
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmLabel}>{t.giftCard}</Text>
                  <Text style={styles.confirmValue}>{giftCardCode.trim().toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.confirmFooter}>
            <Pressable
              style={styles.confirmCancelBtn}
              onPress={() => setConfirmVisible(false)}
              disabled={isBusy}
            >
              <Text style={styles.confirmCancelText}>{t.cancel}</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmSubmitBtn, isBusy && styles.confirmBtnDisabled]}
              onPress={handleComplete}
              disabled={isBusy}
            >
              <Text style={styles.confirmSubmitText}>{t.confirmPayment}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={bankPickerOpen} onClose={() => setBankPickerOpen(false)} title={t.selectBankTitle}>
        <ScrollView style={styles.bankList} showsVerticalScrollIndicator={false}>
          {ETHIOPIAN_BANKS.map((bank) => {
            const active = selectedBank === bank;
            return (
              <Pressable
                key={bank}
                style={[styles.bankOption, active && styles.bankOptionActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedBank(bank);
                  setBankPickerOpen(false);
                }}
              >
                <Text style={[styles.bankOptionText, active && styles.bankOptionTextActive]}>
                  {bank}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Modal>

      <ChecheWalletQrModal
        visible={walletQrVisible}
        onClose={() => setWalletQrVisible(false)}
        user={user}
      />

      <Modal visible={otpVisible} onClose={() => setOtpVisible(false)} title={t.verifyOtpTitle}>
        <View style={styles.otpModal}>
          <Text style={styles.otpHint}>{t.otpHint}</Text>
          <Input
            label={t.otp}
            placeholder="123456"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />
          <Button title={t.verifyAndComplete} onPress={handleVerifyOtp} disabled={isBusy} />
        </View>
      </Modal>

      <CustomerPickerModal
        visible={customerPickerOpen}
        selectedId={selectedCustomer?.id}
        onClose={() => setCustomerPickerOpen(false)}
        onSelect={applyCustomer}
        onAddNew={() => {
          setCustomerPickerOpen(false);
          router.push('/add-customer' as Href);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  keyboardAvoid: { flex: 1, backgroundColor: Colors.background },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  headerActionBtnPressed: {
    opacity: 0.88,
  },
  headerAddBtn: {
    backgroundColor: Brand.primaryMuted,
    borderColor: Brand.primary,
  },
  headerClearBtn: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger,
  },
  headerActionAddText: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '700',
  },
  headerActionClearText: {
    ...Typography.caption1,
    color: Colors.danger,
    fontWeight: '700',
  },
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  customerPhoneSection: {
    zIndex: 20,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  customerPhoneCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
    overflow: 'visible',
  },
  customerHelperText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 4,
    marginLeft: 12,
    marginBottom: 2,
  },
  customerHelperKey: {
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  customerPlusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.primaryMuted,
  },
  customerSuggestions: {
    marginTop: 6,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.iosCard,
  },
  customerSuggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  customerSuggestionText: {
    gap: 2,
  },
  customerSuggestionName: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  customerSuggestionPhone: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  panel: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: 12,
    ...Shadow.iosCard,
  },
  panelLast: {
    marginBottom: 4,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    maxWidth: '45%',
  },
  settingValue: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelTitle: { ...Typography.headline, color: Colors.text, fontWeight: '700' },
  sectionLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  itemBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  itemBadgeText: { ...Typography.caption1, color: Colors.textSecondary, fontWeight: '600' },
  keypadSummary: {
    gap: 12,
    paddingVertical: 4,
  },
  keypadNoteValue: {
    flex: 1,
    textAlign: 'right',
  },
  orderList: {
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  orderEmpty: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  orderEmptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  orderEmptyTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  orderEmptyMessage: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  orderEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: Brand.primary,
    marginTop: 4,
  },
  orderEmptyBtnText: {
    ...Typography.subhead,
    color: '#fff',
    fontWeight: '700',
  },
  orderNoteRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: Colors.white,
  },
  orderNoteLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  orderNoteText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '500',
  },
  orderItem: {
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: Colors.white,
  },
  orderItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  orderItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  orderItemBody: { flex: 1, gap: 2, minWidth: 0 },
  orderItemName: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  orderItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  orderItemMetaSpacer: { flex: 1 },
  orderItemVariant: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    flex: 1,
    minWidth: 0,
  },
  orderItemPrice: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Brand.primary,
    flexShrink: 0,
  },
  orderItemQtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: Radius.md,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
  },
  orderItemQtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  orderItemQtyInput: {
    flex: 1,
    height: 40,
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: 0,
    backgroundColor: Colors.white,
    borderRadius: Radius.sm,
  },
  summaryBlock: {
    marginTop: 14,
    gap: 8,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { ...Typography.subhead, color: Colors.textSecondary },
  summaryValue: { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  discountText: { color: Colors.success },
  totalLabel: { ...Typography.subhead, color: Colors.text, fontWeight: '700' },
  totalValue: { ...Typography.title3, color: Brand.primary, fontWeight: '700' },
  receivedAmountWrap: { marginTop: 8 },
  couponBody: { gap: 10 },
  couponModalScroll: {
    paddingBottom: 12,
  },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  giftRow: { marginTop: 4 },
  codeInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  codeInputWrapFocused: { borderColor: Brand.primary },
  codeInput: {
    flex: 1,
    ...Typography.subhead,
    color: Colors.text,
    paddingVertical: 0,
  },
  applyBtn: {
    height: 48,
    minWidth: 80,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { ...Typography.subhead, color: '#fff', fontWeight: '700' },
  checkBalanceBtn: {
    height: 48,
    minWidth: 112,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBalanceText: { ...Typography.caption1, color: Colors.text, fontWeight: '600' },
  actionBtnDisabled: { opacity: 0.7 },
  helperText: { ...Typography.caption1, color: Colors.textTertiary },
  paySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  paySummaryCol: { flex: 1, alignItems: 'center', gap: 4 },
  paySummaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: Colors.border,
  },
  paySummaryLabel: { ...Typography.caption1, color: Colors.textSecondary },
  paySummaryValue: { ...Typography.subhead, color: Colors.text, fontWeight: '700' },
  discountValue: { color: Colors.success },
  amountToPayValue: { color: Brand.primary },
  paymentModeModal: {
    gap: 12,
    paddingBottom: 8,
  },
  modalDoneBtn: {
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalDoneBtnText: { ...Typography.subhead, color: '#fff', fontWeight: '700' },
  modeCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    width: SQUARE_CARD_SIZE,
    height: SQUARE_CARD_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 6,
  },
  modeCardActive: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  modeCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.borderLight,
  },
  modeCardIconWrapActive: {
    backgroundColor: Colors.white,
  },
  modeCardLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  modeCardLabelActive: {
    color: Brand.primary,
    fontWeight: '700',
  },
  paymentTermExtra: {
    marginTop: 14,
    gap: 8,
  },
  termOptionList: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
    maxHeight: 220,
  },
  termOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  termOptionActive: {
    backgroundColor: Brand.primaryMuted,
  },
  termOptionText: {
    ...Typography.subhead,
    color: Colors.text,
  },
  termOptionTextActive: {
    color: Brand.primary,
    fontWeight: '600',
  },
  emptyTermsText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  paymentCardsRow: {
    gap: 10,
    paddingRight: 4,
  },
  paymentCard: {
    width: SQUARE_CARD_SIZE,
    height: SQUARE_CARD_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 6,
  },
  paymentCardActive: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  paymentCardDisabled: {
    opacity: 0.4,
  },
  paymentCardOfflineTag: {
    ...Typography.caption2,
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 9,
    lineHeight: 11,
  },
  paymentCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
  },
  paymentCardIconWrapActive: {
    backgroundColor: Colors.white,
  },
  paymentCardImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  paymentCardLabel: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 13,
  },
  paymentCardLabelActive: {
    color: Brand.primary,
    fontWeight: '700',
  },
  bankTransferExtra: {
    marginTop: 14,
    gap: 8,
  },
  extraField: { marginTop: 14, gap: 8 },
  qrBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  bankPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 8,
  },
  bankPickerText: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  bankPickerPlaceholder: { color: Colors.textTertiary },
  bankList: { maxHeight: 360 },
  bankOption: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  bankOptionActive: { backgroundColor: Brand.primaryMuted },
  bankOptionText: { ...Typography.subhead, color: Colors.text },
  bankOptionTextActive: { color: Brand.primary, fontWeight: '600' },
  footerSafe: {
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    ...Shadow.iosCard,
  },
  footerCard: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerLabel: { ...Typography.caption1, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  footerHint: { ...Typography.caption1, color: Colors.textTertiary, marginTop: 2 },
  footerAmount: { ...Typography.title2, color: Brand.primary, fontWeight: '700' },
  confirmBtn: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnPressed: { opacity: 0.92 },
  confirmBtnDisabled: { opacity: 0.65 },
  confirmText: { ...Typography.headline, color: '#fff', fontWeight: '700' },
  otpModal: { gap: 12 },
  otpHint: { ...Typography.subhead, color: Colors.textSecondary },
  confirmModalLayout: {
    flexShrink: 1,
  },
  confirmScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  confirmScrollContent: {
    paddingBottom: 4,
  },
  confirmSection: {
    gap: 10,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  confirmSectionLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  confirmSectionTitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confirmNoteRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.borderLight,
    gap: 4,
  },
  confirmNoteLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  confirmNoteText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '500',
  },
  confirmItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
  },
  confirmItemsList: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  confirmListRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  confirmItemInfo: { flex: 1, gap: 2 },
  confirmItemName: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  confirmItemVariant: { ...Typography.caption1, color: Colors.textSecondary },
  confirmItemMeta: { ...Typography.caption1, color: Colors.textSecondary },
  confirmItemQty: { color: Brand.primary, fontWeight: '700' },
  confirmItemTotal: { ...Typography.subhead, fontWeight: '700', color: Colors.text },
  confirmSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmLabel: { ...Typography.subhead, color: Colors.textSecondary },
  confirmLabelBold: { ...Typography.subhead, color: Colors.text, fontWeight: '700' },
  confirmValue: { ...Typography.subhead, color: Colors.text, fontWeight: '500' },
  confirmDiscount: { color: Colors.success },
  confirmTotal: { ...Typography.title3, color: Brand.primary, fontWeight: '700' },
  confirmAdjustCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  confirmAdjustTitle: {
    ...Typography.footnote,
    fontWeight: '700',
    color: '#92400E',
  },
  confirmAdjustText: {
    ...Typography.footnote,
    color: '#92400E',
    lineHeight: 18,
  },
  confirmFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  confirmCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  confirmCancelText: { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  confirmSubmitBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitText: { ...Typography.subhead, color: '#fff', fontWeight: '700' },
});
