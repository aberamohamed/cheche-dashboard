import { Brand, Colors, Typography } from '@/constants/theme';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

export type HomeServiceAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  onPress: () => void;
};

type HomeCategoryListProps = {
  actions: HomeServiceAction[];
  numColumns?: number;
};

export function HomeCategoryList({ actions, numColumns = 4 }: HomeCategoryListProps) {
  const { width } = useWindowDimensions();
  const isNarrowDevice = width <= 360;
  const horizontalMargin = 16 * 2;
  const innerPadding = 10 * 2;
  const totalAvailableWidth = width - horizontalMargin - innerPadding;
  const cardWidth = totalAvailableWidth / numColumns - 2;
  const cardHeight = numColumns === 2 ? Math.min(88, 120) : cardWidth;
  const iconSize = Math.max(28, cardWidth * 0.35);
  const iconWrapperSize = Math.max(36, cardWidth * 0.5);

  return (
    <View style={styles.container}>
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <View key={action.key} style={[styles.itemWrap, { width: cardWidth + 4 }]}>
            <Pressable
              style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
              onPress={action.onPress}
            >
              <View style={[styles.rectangleCard, { width: cardWidth, height: cardHeight }]}>
                <View
                  style={[
                    styles.iconWrapper,
                    { width: iconWrapperSize, height: iconWrapperSize },
                  ]}
                >
                  <Icon size={iconSize} color={Brand.primary} strokeWidth={2.25} />
                </View>
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.label,
                      {
                        fontSize: isNarrowDevice ? 9.5 : 10,
                        lineHeight: isNarrowDevice ? 13 : 14,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {action.label}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '96%',
    alignSelf: 'center',
    paddingBottom: 4,
  },
  itemWrap: {
    paddingHorizontal: 2,
    paddingVertical: 0,
    marginBottom: 10,
    alignItems: 'center',
  },
  pressable: {
    alignItems: 'center',
    width: '100%',
  },
  pressablePressed: {
    opacity: 0.85,
  },
  rectangleCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    paddingVertical: 8,
    marginHorizontal: 2,
    backgroundColor: Colors.white,
  },
  iconWrapper: {
    marginTop: 0,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  label: {
    ...Typography.caption1,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
