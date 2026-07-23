/**
 * bluetooth-printer.tsx
 *
 * Bluetooth Printer Setup Screen
 *
 * Allows the user to:
 *  1. Scan for nearby Bluetooth devices
 *  2. Tap a device to pair/connect as the default printer
 *  3. View currently connected printer
 *
 * Persists the selected printer configuration in AsyncStorage.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  screenHeaderSubtitleTextLeft,
  screenHeaderTitleTextLeft,
} from '@/constants/screenHeader';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { appAlert } from '@/utils/alert';
import {
  type BluetoothDevice,
  connectToPrinter,
  enableBluetooth,
  ensureBluetoothPermissions,
  isBluetoothEnabled,
  printEscPos,
  scanDevices,
} from '@/services/bluetoothPrinterService';
import type { ReceiptData } from '@/types/receipt';
import type { Product } from '@/types';

const PRINTER_ADDRESS_KEY = 'bt_printer_address';
const PRINTER_NAME_KEY = 'bt_printer_name';
const SCREEN_WIDTH = Dimensions.get('window').width;
const DROPDOWN_GAP = Platform.OS === 'android' ? 10 : 12;
const DROPDOWN_WIDTH = 280;

const HOW_IT_WORKS_STEPS = [
  { title: 'Turn on the printer', description: 'Make sure the thermal printer has power.' },
  { title: 'Pair with your phone', description: 'Use Bluetooth settings to pair the device.' },
  { title: 'Scan and select', description: 'Tap "Scan for Printers" and choose your printer.' },
];

/** Builds a sample receipt (test org + test products) for the "Test Print" action. */
function buildTestReceipt(): ReceiptData {
  const makeProduct = (id: string, name: string, price: number): Product => ({
    id,
    productId: id,
    name,
    sku: `TEST-${id}`,
    barcode: '',
    category: 'Test',
    costPrice: price,
    sellingPrice: price,
    stock: 100,
    unit: 'pcs',
    lowStockAlert: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const items = [
    { product_id: '1', product: makeProduct('1', 'Test Coffee', 45), quantity: 2 },
    { product_id: '2', product: makeProduct('2', 'Test Muffin', 30), quantity: 1 },
  ];
  const subtotal = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);

  return {
    invoiceNumber: 'TEST-0001',
    items,
    subtotal,
    discount: 0,
    total: subtotal,
    paymentMethod: 'Cash',
    receivedAmount: subtotal,
    changeAmount: 0,
    businessName: 'Test Organization',
    businessAddress: '123 Test Street, Test City',
    businessPhone: '+251 900 000 000',
    operatorName: 'Test Cashier',
    customerName: 'Test Customer',
    createdAt: new Date().toISOString(),
  };
}

function openBluetoothSettings() {
  if (Platform.OS === 'android') {
    Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() => {
      Linking.openSettings();
    });
    return;
  }
  Linking.openSettings();
}

/** Mirrors the shape of a real device row so the skeleton previews what's about to appear. */
function DeviceRowSkeleton() {
  return (
    <View style={styles.deviceRow}>
      <Skeleton width={34} height={34} borderRadius={Radius.sm} style={styles.deviceIconSkeleton} />
      <View style={styles.deviceInfo}>
        <Skeleton width="55%" height={15} />
        <Skeleton width="75%" height={11} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export default function BluetoothPrinterScreen() {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [paired, setPaired] = useState<BluetoothDevice[]>([]);
  const [found, setFound] = useState<BluetoothDevice[]>([]);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Anchored "How it works" dropdown — same elevated dropdown pattern as
  // LanguageDropdown (measure anchor, animate scale/fade from that point).
  // Opened from the header info button.
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const infoAnchorRef = useRef<View>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const anchorPositionRef = useRef({ top: 56, right: 20 });
  const [dropdownPos, setDropdownPos] = useState(anchorPositionRef.current);

  const measureAnchorPosition = useCallback(
    (anchorRef: React.RefObject<View | null>): Promise<{ top: number; right: number }> => {
      return new Promise((resolve) => {
        anchorRef.current?.measureInWindow?.((x, y, w, h) => {
          if (w > 0 && h > 0) {
            const pos = {
              top: y + h + DROPDOWN_GAP,
              right: Math.max(10, SCREEN_WIDTH - (x + w)),
            };
            anchorPositionRef.current = pos;
            resolve(pos);
            return;
          }
          resolve(anchorPositionRef.current);
        }) ?? resolve(anchorPositionRef.current);
      });
    },
    []
  );

  const closeHowItWorks = useCallback(() => {
    if (Platform.OS === 'ios') {
      Animated.timing(dropdownAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(
        () => setHowItWorksVisible(false)
      );
    } else {
      setHowItWorksVisible(false);
    }
  }, [dropdownAnim]);

  const openHowItWorks = useCallback(
    (anchorRef: React.RefObject<View | null>) => {
      void measureAnchorPosition(anchorRef).then((pos) => {
        setDropdownPos(pos);
        setHowItWorksVisible(true);
        if (Platform.OS === 'ios') {
          Animated.spring(dropdownAnim, {
            toValue: 1,
            useNativeDriver: true,
            stiffness: 260,
            damping: 20,
            mass: 0.8,
          }).start();
        } else {
          dropdownAnim.setValue(1);
        }
      });
    },
    [dropdownAnim, measureAnchorPosition]
  );

  useEffect(() => {
    AsyncStorage.getItem(PRINTER_ADDRESS_KEY).then((addr) => {
      if (addr) setConnectedAddress(addr);
    });
    AsyncStorage.getItem(PRINTER_NAME_KEY).then((name) => {
      if (name) setConnectedName(name);
    });
  }, []);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setPaired([]);
    setFound([]);
    try {
      const permitted = await ensureBluetoothPermissions();
      if (!permitted) {
        appAlert(
          'Permission Required',
          'Bluetooth (and Location, on older Android versions) permission is required to see nearby printers. Please grant it in your device Settings and try again.',
          undefined,
          { variant: 'error' }
        );
        return;
      }

      const btEnabled = await isBluetoothEnabled();
      if (!btEnabled) {
        await enableBluetooth();
      }
      const result = await scanDevices();
      setPaired(result.paired);
      setFound(result.found);
    } catch (err: any) {
      appAlert(
        'Scan Error',
        err?.message ?? String(err) ?? 'Failed to scan for devices.',
        undefined,
        { variant: 'error' }
      );
    } finally {
      setScanning(false);
    }
  }, []);

  const handleConnect = useCallback(async (device: BluetoothDevice) => {
    setLoading(true);
    try {
      await connectToPrinter(device.address);
      await AsyncStorage.setItem(PRINTER_ADDRESS_KEY, device.address);
      await AsyncStorage.setItem(PRINTER_NAME_KEY, device.name);
      setConnectedAddress(device.address);
      setConnectedName(device.name);
      appAlert('Connected', `Successfully connected to ${device.name}`, undefined, {
        variant: 'success',
      });
    } catch (err: any) {
      appAlert('Connection Error', err?.message ?? 'Failed to connect to printer.', undefined, {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTestPrint = useCallback(async () => {
    if (!connectedAddress) return;
    setTesting(true);
    try {
      await connectToPrinter(connectedAddress);
      await printEscPos(buildTestReceipt());
      appAlert('Test Sent', 'A test receipt was sent to the printer.', undefined, {
        variant: 'success',
      });
    } catch (err: any) {
      appAlert('Test Print Failed', err?.message ?? 'Failed to print the test receipt.', undefined, {
        variant: 'error',
      });
    } finally {
      setTesting(false);
    }
  }, [connectedAddress]);

  const allDevices: BluetoothDevice[] = [
    ...paired,
    ...found.filter((f) => !paired.find((p) => p.address === f.address)),
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Bluetooth Printer"
        onBack={() => router.back()}
        right={
          <View style={styles.headerActions}>
            <Pressable
              onPress={openBluetoothSettings}
              style={styles.infoBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open Bluetooth settings"
            >
              <Ionicons name="bluetooth" size={22} color={Brand.primary} />
            </Pressable>
            <View ref={infoAnchorRef} collapsable={false}>
              <Pressable
                onPress={() => openHowItWorks(infoAnchorRef)}
                style={styles.infoBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="How it works"
              >
                <Ionicons name="information-circle-outline" size={24} color={Brand.primary} />
              </Pressable>
            </View>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={{...styles.heroTitle, fontSize: 20}}>Printer Setup</Text>
            <Text style={styles.heroSubtitle}>
              Connect and configure your POS printer in a few simple steps.
            </Text>
          </View>
          <View style={styles.heroIconWrap}>
            <View style={styles.heroGlowOuter} />
            <View style={styles.heroGlowInner} />
            <Ionicons name="print" size={44} color={Brand.primary} />
          </View>
        </View>

        {/* Current default printer banner */}
        {connectedAddress ? (
          <View style={styles.currentPrinter}>
            <View style={styles.currentPrinterHeader}>
              <View style={styles.currentPrinterIconWrap}>
                <Ionicons name="print" size={18} color={Brand.primary} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.currentPrinterLabel}>Selected Printer</Text>
                <Text style={styles.currentPrinterName}>{connectedName ?? connectedAddress}</Text>
              </View>
              <View style={styles.connectedDot} />
            </View>
            <Pressable
              onPress={handleTestPrint}
              disabled={testing || loading}
              style={({ pressed }) => [
                styles.testPrintBtn,
                (testing || loading) && styles.testPrintBtnDisabled,
                pressed && styles.testPrintBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Print a test receipt"
            >
              {testing ? (
                <ActivityIndicator size="small" color={Brand.primary} />
              ) : (
                <Ionicons name="documents-outline" size={16} color={Brand.primary} />
              )}
              <Text style={styles.testPrintBtnText}>
                {testing ? 'Printing…' : 'Test Print'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.noPrinterBanner}
            onPress={handleScan}
            accessibilityRole="button"
            accessibilityLabel="Set a default printer"
          >
            <Ionicons name="alert-circle-outline" size={22} color={Colors.warning} />
            <View style={styles.noPrinterTextWrap}>
              <Text style={styles.noPrinterText}>No default printer configured</Text>
              <Text style={styles.noPrinterSubtext}>Set a default printer to start printing easily.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </Pressable>
        )}

        {/* Scan action */}
        <Pressable
          onPress={handleScan}
          disabled={scanning || loading}
          style={({ pressed }) => [styles.scanBanner, pressed && styles.scanBannerPressed]}
          accessibilityRole="button"
          accessibilityLabel="Scan for printers"
        >
          <View style={styles.scanIconCircle}>
            {scanning ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="bluetooth" size={22} color={Colors.white} />
            )}
          </View>
          <View style={styles.scanTextWrap}>
            <Text style={styles.scanTitle}>
              {scanning ? 'Finding Printers...' : 'Scan for Printers'}
            </Text>
            <Text style={styles.scanSubtitle}>Search for nearby printers</Text>
          </View>
          <View style={styles.scanArrowCircle}>
            <Ionicons name="arrow-forward" size={18} color={Brand.primary} />
          </View>
        </Pressable>

        {/* Inline "How it works" — shown until a device list is available, then
            collapses in favor of the header info icon. */}
        {!loading && !scanning && allDevices.length === 0 && (
          <View style={styles.inlineHowItWorks}>
            <View style={styles.dropdownHeader}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Brand.primary} />
              <Text style={styles.dropdownHeaderText}>How it works</Text>
            </View>
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <View key={step.title} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepTextWrap}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Device list / State views */}
        <View style={styles.availableHeader}>
          <View style={styles.availableHeaderText}>
            <Text style={styles.availableTitle}>Available Printers</Text>
            <Text style={styles.availableSubtitle}>
              Make sure your printer is turned on and in pairing mode.
            </Text>
          </View>
          <Pressable
            onPress={handleScan}
            disabled={scanning || loading}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Refresh printer list"
          >
            <Ionicons name="refresh" size={20} color={Brand.primary} />
          </Pressable>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Brand.primary} size="large" />
            <Text style={styles.loadingText}>Establishing connection...</Text>
          </View>
        )}

        {!loading && scanning && (
          <View style={styles.deviceListWrap}>
            <View style={styles.list}>
              <DeviceRowSkeleton />
              <DeviceRowSkeleton />
              <DeviceRowSkeleton />
            </View>
          </View>
        )}

        {!loading && allDevices.length > 0 && (
          <View style={styles.deviceListWrap}>
            <Text style={styles.sectionHeader}>
              {paired.length > 0 ? 'Paired Printers' : 'Available Devices'}
            </Text>
            <View style={styles.list}>
              {allDevices.map((item) => {
                const isConnected = item.address === connectedAddress;
                return (
                  <Pressable
                    key={item.address}
                    style={[styles.deviceRow, isConnected && styles.deviceRowConnected]}
                    onPress={() => handleConnect(item)}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel={`${isConnected ? 'Connected to' : 'Connect to'} ${item.name || 'Unknown Device'}`}
                  >
                    <View style={[styles.deviceIcon, isConnected && styles.deviceIconConnected]}>
                      <Ionicons
                        name={isConnected ? 'bluetooth' : 'bluetooth-outline'}
                        size={16}
                        color={isConnected ? Colors.white : Brand.primary}
                      />
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text style={{...styles.deviceName, fontSize: 14}} numberOfLines={1}>
                        {item.name || 'Unknown Device'}
                      </Text>
                      <Text style={styles.deviceAddress}>{item.address}</Text>
                    </View>
                    {isConnected ? (
                      <View style={styles.connectedBadge}>
                        <Text style={styles.connectedBadgeText}>Default</Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Tip */}
        <View style={styles.tipBanner}>
          <Ionicons name="bulb-outline" size={18} color={Brand.primary} />
          <Text style={styles.tipText}>
            Tip: Turn on your printer and enable Bluetooth pairing mode for the best results.
          </Text>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={howItWorksVisible}
        animationType="none"
        onRequestClose={closeHowItWorks}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <Pressable style={styles.dropdownOverlay} onPress={closeHowItWorks}>
          <Pressable onPress={() => undefined}>
            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.dropdownContainer,
                {
                  top: dropdownPos.top,
                  right: dropdownPos.right,
                  opacity: dropdownAnim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0, 1, 1],
                  }),
                  transform: [
                    {
                      scale: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                    },
                    {
                      translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-25, 0] }),
                    },
                    {
                      translateX: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [25, 0] }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.dropdown}>
                <View style={styles.dropdownHeader}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={Brand.primary} />
                  <Text style={styles.dropdownHeaderText}>How it works</Text>
                </View>
                {HOW_IT_WORKS_STEPS.map((step, index) => (
                  <View key={step.title} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.stepTextWrap}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.dropdownArrow} />
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    ...screenHeaderTitleTextLeft,
    color: Colors.text,
  },
  heroSubtitle: {
    ...screenHeaderSubtitleTextLeft,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  heroIconWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlowOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    backgroundColor: Brand.primaryMuted,
  },
  heroGlowInner: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(227, 0, 116, 0.14)',
  },
  currentPrinter: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Brand.primaryMuted,
  },
  currentPrinterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Brand.primaryMuted,
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  testPrintBtnPressed: {
    opacity: 0.7,
  },
  testPrintBtnDisabled: {
    opacity: 0.5,
  },
  testPrintBtnText: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '700',
  },
  currentPrinterIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPrinterLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  currentPrinterName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  connectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  noPrinterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  noPrinterTextWrap: {
    flex: 1,
  },
  noPrinterText: {
    ...screenHeaderTitleTextLeft,
    color: Colors.text,
  },
  noPrinterSubtext: {
    ...screenHeaderSubtitleTextLeft,
    color: Colors.textSecondary,
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.primary,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 14,
    ...Shadow.button,
  },
  scanBannerPressed: {
    opacity: 0.9,
  },
  scanIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTextWrap: {
    flex: 1,
  },
  scanTitle: {
    ...screenHeaderTitleTextLeft,
    color: Colors.white,
  },
  scanSubtitle: {
    ...Typography.footnote,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  scanArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineHowItWorks: {
    marginTop: 20,
    borderRadius: Radius.lg,
    padding: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  availableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 14,
    gap: 12,
  },
  availableHeaderText: {
    flex: 1,
  },
  availableTitle: {
    ...screenHeaderTitleTextLeft,
    color: Colors.text,
  },
  availableSubtitle: {
    ...screenHeaderSubtitleTextLeft,
    color: Colors.textSecondary,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Brand.primaryMuted,
    borderRadius: Radius.md,
    padding: 14,
    marginTop: 20,
    gap: 10,
  },
  tipText: {
    ...Typography.footnote,
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
  sectionHeader: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  deviceListWrap: {
    marginTop: 20,
  },
  list: {
    gap: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  deviceRowConnected: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  deviceIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceIconSkeleton: {
    marginRight: 12,
  },
  deviceIconConnected: {
    backgroundColor: Brand.primary,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...Typography.headline,
    color: Colors.text,
  },
  deviceAddress: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  connectedBadge: {
    backgroundColor: Brand.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  connectedBadgeText: {
    ...Typography.caption2,
    color: Colors.white,
    fontWeight: '700',
  },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    width: DROPDOWN_WIDTH,
    zIndex: 100,
    position: 'absolute',
  },
  dropdown: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 12,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dropdownHeaderText: {
    ...screenHeaderTitleTextLeft,
    color: Colors.text,
  },
  dropdownArrow: {
    position: 'absolute',
    top: -4,
    right: 28,
    width: 14,
    height: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    borderLeftColor: Colors.border,
    backgroundColor: Colors.white,
    transform: [{ rotate: '45deg' }],
    zIndex: -1,
    borderRadius: 2,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...Typography.caption1,
    color: Colors.white,
    fontWeight: '700',
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    ...screenHeaderTitleTextLeft,
    color: Colors.text,
  },
  stepDescription: {
    ...screenHeaderSubtitleTextLeft,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
