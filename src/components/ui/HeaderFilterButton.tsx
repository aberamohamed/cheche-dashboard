import { Brand } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { ListFilter } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

interface HeaderFilterButtonProps {
  onPress: () => void;
  active?: boolean;
  light?: boolean;
  variant?: 'circle' | 'tile';
}

export function HeaderFilterButton({
  onPress,
  active,
  light,
  variant = 'circle',
}: HeaderFilterButtonProps) {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const useLightStyle = light ?? darkMode;
  const isTile = variant === 'tile';

  return (
    <Pressable
      style={[
        styles.btn,
        isTile ? styles.btnTile : styles.btnCircle,
        useLightStyle && styles.btnLight,
        active && (useLightStyle ? styles.btnLightActive : styles.btnActive),
        active && isTile && styles.btnTileActive,
      ]}
      onPress={onPress}
      hitSlop={8}
    >
      <ListFilter size={20} color={useLightStyle ? '#FFFFFF' : Brand.primary} />
      {active ? <View style={[styles.dot, useLightStyle && styles.dotLight]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primaryMuted,
  },
  btnTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Brand.primaryMuted,
  },
  btnLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  btnActive: {
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  btnTileActive: {
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  btnLightActive: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Brand.primary,
  },
  dotLight: {
    backgroundColor: '#FFFFFF',
  },
});
