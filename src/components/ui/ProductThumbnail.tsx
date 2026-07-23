import { Brand, Colors, Radius } from '@/constants/theme';
import { Package } from 'lucide-react-native';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

interface ProductThumbnailProps {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function ProductThumbnail({ uri, size = 44, style }: ProductThumbnailProps) {
  const borderRadius = Radius.sm;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius }, style]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[styles.placeholder, { width: size, height: size, borderRadius }, style]}
    >
      <Package size={Math.max(16, Math.round(size * 0.5))} color={Brand.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.borderLight,
  },
  placeholder: {
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
