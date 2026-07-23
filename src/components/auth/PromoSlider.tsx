import { useEffect, useRef } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

export type PromoSlide = {
  id: string;
  title: string;
  description: string;
  image: number;
};

type PromoSliderProps = {
  slides: PromoSlide[];
  fullScreen?: boolean;
  activeSlideIndex?: number;
  onSlideChange?: (index: number) => void;
  containerStyle?: object;
};

export function PromoSlider({
  slides,
  fullScreen = false,
  activeSlideIndex = 0,
  onSlideChange,
  containerStyle,
}: PromoSliderProps) {
  const { width, height } = useWindowDimensions();
  const flatListRef = useRef<FlatList<PromoSlide>>(null);
  const slideHeight = fullScreen ? height : height * 0.55;

  useEffect(() => {
    flatListRef.current?.scrollToIndex({
      index: activeSlideIndex,
      animated: true,
    });
  }, [activeSlideIndex]);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    onSlideChange?.(slideIndex);
  };

  return (
    <View
      style={[
        styles.container,
        {
          height: slideHeight,
          marginTop: fullScreen ? 0 : height * 0.01,
          marginBottom: fullScreen ? 0 : height * 0.02,
        },
        containerStyle,
      ]}
    >
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 500);
        }}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={{ width, height: slideHeight }}>
            <Image source={item.image} style={[StyleSheet.absoluteFill, styles.image]} />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
