import { Brand, Colors, Typography } from '@/constants/theme';
import { useLoadingModalStore } from '@/store/loadingModalStore';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const LOADING_MODAL_TRANSITION_MS = 320;

const ChechePosLogo = require('../../../assets/images/cheche_pos.png');

export function LoadingModalHost() {
  const visible = useLoadingModalStore((s) => s.visible);
  const message = useLoadingModalStore((s) => s.message);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={styles.host} pointerEvents="auto" accessibilityViewIsModal>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={Brand.primary} />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
        {/* <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Image
            source={ChechePosLogo}
            style={styles.footerLogo}
            resizeMode="contain"
            accessibilityLabel="Cheche POS"
          />
        </View> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgb(251, 251, 251)',
    padding: 16,
    borderRadius: 10,
  },
  message: {
    ...Typography.subhead,
    color: Brand.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
   
  },
  footerLogo: {
    width: 160,
    height: 48,
    backgroundColor: 'rgb(253, 253, 253)',
    borderRadius: 10,
  },
});
