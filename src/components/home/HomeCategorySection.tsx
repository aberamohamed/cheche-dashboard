import { Brand, Colors, Typography } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type HomeCategorySectionProps = {
  title: string;
  children: React.ReactNode;
  seeAllLabel?: string;
  onSeeAll?: () => void;
};

export function HomeCategorySection({
  title,
  children,
  seeAllLabel = 'See All',
  onSeeAll,
}: HomeCategorySectionProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll ? (
          <Pressable style={styles.seeAllBtn} onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>{seeAllLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    paddingBottom: 8,
    alignSelf: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 6,
    marginBottom: 4,
    position: 'relative',
  },
  title: {
    ...Typography.subhead,
    fontSize: 14,
    fontWeight: '700',
    color: '#5D5D5D',
    paddingHorizontal: 10,
    marginTop: 2,
    marginBottom: 2,
  },
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  seeAll: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '600',
  },
});
