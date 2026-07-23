import { Dimensions, Image, StyleSheet, View } from 'react-native';

const ADS_IMAGE = require('@/assets/images/ads.png');

export function HomeAdsBanner() {
  const screenWidth = Dimensions.get('window').width;
  const bannerHeight = screenWidth > 768 ? 150 : screenWidth < 380 ? 85 : 110;

  return (
    <View style={[styles.wrap, { height: bannerHeight }]}>
      <Image
        source={ADS_IMAGE}
        style={[styles.image, { height: bannerHeight+45 }]}
        resizeMode="cover"
        accessibilityLabel="Smarter Business Starts Here"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '120%',
  },
});
