import { HomeGlassCard } from '@/components/home/HomeGlassCard';
import { Radius } from '@/constants/theme';
import { Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeHeroCardProps = {
  fullName: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  businessName?: string;
  glass?: boolean;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_WIDTH = 72;
const AVATAR_HEIGHT = 72;

function mvs(size: number, factor = 0.5): number {
  const scaled = (SCREEN_HEIGHT / 812) * size;
  return size + (scaled - size) * factor;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function HomeHeroCard({
  fullName,
  email,
  phone,
  profilePhoto,
  businessName,
  glass = true,
}: HomeHeroCardProps) {
  const insets = useSafeAreaInsets();
  const contentPaddingTop =
    Platform.OS === 'ios' ? Math.max(16, insets.top + 40) : Math.max(56, insets.top + 40);
  const contentPaddingBottom = 10;
  const contactLine = email || phone;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: contentPaddingTop,
          paddingBottom: contentPaddingBottom,
        },
      ]}
    >
      <View style={styles.userRow}>
        <View style={styles.avatarColumn}>
          <HomeGlassCard style={styles.avatarShell} contentStyle={styles.avatarContent}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{getInitials(fullName)}</Text>
              </View>
            )}
          </HomeGlassCard>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            Hello, {fullName}
          </Text>
          {businessName ? (
            <Text style={styles.businessName} numberOfLines={1}>
              {businessName}
            </Text>
          ) : null}
          {contactLine ? (
            <Text style={styles.contactLine} numberOfLines={1}>
              {contactLine}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: mvs(8),
    gap: 14,
  },
  avatarColumn: {
    alignItems: 'center',
    width: AVATAR_WIDTH,
  },
  avatarShell: {
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
    borderRadius: Radius.lg,
  },
  avatarContent: {
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
    overflow: 'hidden',
    borderRadius: Radius.lg,
  },
  avatarImage: {
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
  },
  avatarFallback: {
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  userName: {
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  businessName: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
  },
  contactLine: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.82)',
  },
});
