import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ProfileMenuTileColors = {
  bg: string;
  border: string;
  icon: string;
};

type ProfileMenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: ProfileMenuTileColors;
  onPress: () => void;
  isLast?: boolean;
};

export function ProfileMenuItem({
  icon,
  label,
  colors,
  onPress,
  isLast,
}: ProfileMenuItemProps) {
  return (
    <Pressable style={[styles.row, !isLast && styles.rowBorder]} onPress={onPress}>
      <View
        style={[
          styles.iconChip,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={15} color={colors.icon} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={13} color="#666666" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
});
