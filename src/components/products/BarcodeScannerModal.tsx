import { BarcodeScannerView } from '@/components/sell/BarcodeScannerView';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModalSheetHeader } from '@/components/ui/ModalSheetHeader';
import { Brand, Colors, Radius } from '@/constants/theme';
import { useCameraPermissions } from 'expo-camera';
import { Flashlight, FlashlightOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Modal as RNModal, StyleSheet, View } from 'react-native';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

export function BarcodeScannerModal({ visible, onClose, onScanned }: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!visible) setFlash(false);
  }, [visible]);

  const handleScanned = (barcode: string) => {
    onScanned(barcode);
    onClose();
  };

  const torchButton = (
    <Pressable
      onPress={() => setFlash((value) => !value)}
      hitSlop={8}
      style={[styles.torchBtn, flash && styles.torchBtnActive]}
    >
      {flash ? (
        <FlashlightOff size={20} color={Brand.primary} />
      ) : (
        <Flashlight size={20} color={Brand.primary} />
      )}
    </Pressable>
  );

  return (
    <RNModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ModalSheetHeader title="Scan Barcode" onBack={onClose} right={torchButton} />

          {!permission ? (
            <View style={styles.permissionWrap} />
          ) : !permission.granted ? (
            <View style={styles.permissionWrap}>
              <EmptyState
                title="Camera Access Required"
                message="Allow camera access to scan barcodes"
                actionLabel="Grant Permission"
                onAction={requestPermission}
              />
            </View>
          ) : (
            <View style={styles.scannerWrap}>
              <BarcodeScannerView
                fill
                flash={flash}
                onBarcodeScanned={handleScanned}
                active={visible}
                showTorch={false}
              />
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    height: '88%',
    maxHeight: '92%',
    overflow: 'hidden',
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
  scannerWrap: {
    flex: 1,
    minHeight: 500,
    backgroundColor: '#000',
  },
  permissionWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 34,
    minHeight: 280,
  },
  torchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchBtnActive: {
    backgroundColor: Brand.primaryMuted,
  },
});
