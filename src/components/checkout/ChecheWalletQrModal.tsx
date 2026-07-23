import { Modal } from '@/components/ui/Modal';
import { Brand, Colors, Typography } from '@/constants/theme';
import { useCheckoutTranslation } from '@/hooks/useCheckoutTranslation';
import { buildEncryptedProfileQrPayload, getUserDisplayPhone } from '@/utils/profileQr';
import type { User } from '@/types';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const CHECHE_LOGO = require('../../../assets/images/icon2.png');

interface ChecheWalletQrModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function ChecheWalletQrModal({ visible, onClose, user }: ChecheWalletQrModalProps) {
  const t = useCheckoutTranslation();
  const encryptedQrValue = useMemo(
    () => (user ? buildEncryptedProfileQrPayload(user) : ''),
    [user]
  );
  const displayPhone = user ? getUserDisplayPhone(user.phone) : '';

  return (
    <Modal visible={visible} onClose={onClose} title={t.paymentQrTitle}>
      <View style={styles.content}>
        {user ? (
          <>
            <View style={styles.qrWrap}>
              {encryptedQrValue ? (
                <QRCode
                  value={encryptedQrValue}
                  size={220}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  ecl="H"
                  logo={CHECHE_LOGO}
                  logoSize={44}
                  logoBorderRadius={22}
                  logoBackgroundColor="#FFFFFF"
                />
              ) : null}
            </View>
            <Text style={styles.name}>{user.fullName}</Text>
            {displayPhone ? <Text style={styles.phone}>{displayPhone}</Text> : null}
            <Text style={styles.hint}>
              {t.paymentQrHint}
            </Text>
          </>
        ) : (
          <Text style={styles.hint}>{t.paymentQrSignIn}</Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 24,
    gap: 10,
  },
  qrWrap: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  name: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  phone: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
