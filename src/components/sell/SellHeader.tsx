import { Brand, Colors, Typography } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { RefreshCw, ShoppingCart } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SellHeaderProps {
  cartCount: number;
  onRefresh?: () => void;
  onCartPress?: () => void;
}

export function SellHeader({ cartCount, onRefresh, onCartPress }: SellHeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable style={styles.sideBtn} onPress={onRefresh} hitSlop={8}>
          <RefreshCw size={20} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Sell</Text>
        <Pressable style={styles.sideBtn} onPress={onCartPress} hitSlop={8}>
          <ShoppingCart size={22} color={Colors.text} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  sideBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.headline, color: Colors.text, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { ...Typography.caption2, color: '#fff', fontWeight: '700', fontSize: 10 },
});
