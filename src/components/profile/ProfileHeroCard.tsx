import { Brand, Colors, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type ProfileHeroCardProps = {
  name: string;
  email?: string;
  phone?: string;
  avatarUri?: string | null;
  onPress?: () => void;
};

export function ProfileHeroCard({
  name,
  email,
  phone,
  avatarUri,
  onPress,
}: ProfileHeroCardProps) {
  const avatarSize = 75;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <LinearGradient
        colors={[Brand.primary, '#9D174D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.avatarRing,
          {
            width: avatarSize + 2,
            height: avatarSize + 2,
            borderRadius: (avatarSize + 2) / 2,
          },
        ]}
      >
        <View
          style={[
            styles.avatarFrame,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={34} color={Brand.primary} />
          )}
        </View>
      </LinearGradient>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {email ? (
          <Text style={styles.meta} numberOfLines={1}>
            {email}
          </Text>
        ) : null}
        {phone ? (
          <Text style={styles.meta} numberOfLines={1}>
            {phone}
          </Text>
        ) : null}
      </View>

      <View style={styles.chevronBtn}>
        <ChevronRight size={18} color={Brand.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#d6d6d6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: { elevation: 0 },
    }),
  },
  avatarRing: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFrame: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    alignItems: 'flex-start',
  },
  name: {
    ...Typography.headline,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F7',
    borderWidth: 1,
    borderColor: '#FFE1EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
