import { Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useToastStore } from '@/store/toastStore';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const TOAST_DURATION_MS = 2000;

export function ToastHost() {
  const visible = useToastStore((state) => state.visible);
  const message = useToastStore((state) => state.message);
  const hide = useToastStore((state) => state.hide);

  useEffect(() => {
    if (!visible) return undefined;

    const timer = setTimeout(hide, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, message, hide]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.host}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 12,
  },
  message: {
    ...Typography.subhead,
    color: Colors.white,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    textAlign: 'center',
    maxWidth: '85%',
    ...Shadow.card,
  },
});
