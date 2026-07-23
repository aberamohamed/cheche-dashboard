import { LanguageDropdown } from '@/components/settings/LanguageDropdown';
import { Radius } from '@/constants/theme';
import { Bell } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeOverlayHeaderProps = {
  language: string;
  onLanguageSelect: (languageId: string) => void;
  lowStockCount?: number;
  onNotificationPress?: () => void;
  glass?: boolean;
};

export function HomeOverlayHeader({
  language,
  onLanguageSelect,
  lowStockCount = 0,
  onNotificationPress,
  glass = true,
}: HomeOverlayHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top + 8, 12) },
      ]}
    >
      <Image
        source={require('@/assets/images/cheche_pos_white.png')}
        style={styles.logo}
        resizeMode="cover"
      />

      <View style={styles.rightActions}>
        <Pressable style={styles.notificationBtn} onPress={onNotificationPress}>
          <Bell size={14} color="#FFFFFF" />
          {lowStockCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {lowStockCount > 99 ? '99+' : lowStockCount}
              </Text>
            </View>
          ) : null}
        </Pressable>

        <LanguageDropdown
          selectedId={language}
          onSelect={onLanguageSelect}
          variant="overlay"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logo: {
    width: 120,
    height: 40,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 15,
    height: 15,
    borderRadius: Radius.full,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 9,
  },
});
