import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import type { CategoryCardStyle } from '@/data/categoryCardStyles';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ItemCategoryCardProps {
  label: string;
  style: CategoryCardStyle;
  count?: number;
  selected?: boolean;
  onPress: () => void;
  onEdit?: () => void;
}

export function ItemCategoryCard({
  label,
  style,
  count,
  selected = false,
  onPress,
  onEdit,
}: ItemCategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: style.bg },
          selected && styles.iconWrapSelected,
        ]}
      >
        <Ionicons name={style.icon} size={26} color={style.iconColor} />
        {selected ? (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark" size={11} color={Colors.white} />
          </View>
        ) : null}
        {onEdit ? (
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            style={styles.editBadge}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${label}`}
          >
            <Ionicons name="pencil" size={11} color={Colors.white} />
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
        {label}
      </Text>
      {count != null && count > 0 ? (
        <Text style={styles.count}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 8,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.iosCard,
  },
  iconWrapSelected: {
    borderWidth: 2,
    borderColor: Brand.primary,
  },
  selectedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadow.iosCard,
  },
  label: {
    ...Typography.caption1,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  labelSelected: {
    color: Brand.primary,
    fontWeight: '700',
  },
  count: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    marginTop: -4,
  },
});
