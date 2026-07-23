import { HomeGlassCard } from '@/components/home/HomeGlassCard';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { Calendar, ChevronDown } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type HomeDateRangeCardProps = {
  label: string;
  onPress?: () => void;
  glass?: boolean;
};

export function HomeDateRangeCard({ label, onPress, glass = false }: HomeDateRangeCardProps) {
  const chevronColor = glass ? Colors.white : Colors.textSecondary;
  const content = (
    <>
      <Calendar size={18} color={glass ? Colors.white : Brand.primary} />
      <Text style={[styles.label, glass && styles.labelGlass]}>{label}</Text>
      <ChevronDown size={18} color={chevronColor} />
    </>
  );

  if (glass) {
    return (
      <Pressable onPress={onPress}>
        <HomeGlassCard contentStyle={styles.cardInner}>
          {content}
        </HomeGlassCard>
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.card, styles.cardSolid]} onPress={onPress}>
      <View style={styles.cardInner}>{content}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadow.iosCard,
  },
  cardSolid: {
    backgroundColor: Colors.white,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  labelGlass: {
    color: Colors.white,
  },
});
