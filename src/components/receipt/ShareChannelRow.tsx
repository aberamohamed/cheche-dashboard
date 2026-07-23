import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useCheckoutTranslation } from '@/hooks/useCheckoutTranslation';
import type { ReceiptData } from '@/types/receipt';
import { shareDocumentVia, type ShareChannel } from '@/utils/shareDocument';
import * as Haptics from 'expo-haptics';
import { Mail, MessageSquare, Send } from 'lucide-react-native';
import { useState, type ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ShareChannelRowProps {
  data: ReceiptData;
  onError: (message: string) => void;
}

interface ShareOption {
  id: ShareChannel;
  label: string;
  color: string;
  Icon: ComponentType<{ size: number; color: string }>;
  opensApp: boolean;
}

function WhatsAppIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </Svg>
  );
}

const SHARE_OPTIONS: ShareOption[] = [
  { id: 'sms', label: 'SMS', color: '#34C759', Icon: MessageSquare, opensApp: false },
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', Icon: WhatsAppIcon, opensApp: true },
  { id: 'telegram', label: 'Telegram', color: '#229ED9', Icon: Send, opensApp: true },
  { id: 'email', label: 'Email', color: '#5856D6', Icon: Mail, opensApp: true },
];

export function ShareChannelRow({ data, onError }: ShareChannelRowProps) {
  const t = useCheckoutTranslation();
  const [selectedChannel, setSelectedChannel] = useState<ShareChannel>('sms');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loadingChannel, setLoadingChannel] = useState<ShareChannel | null>(null);

  const openSocialShare = async (channel: ShareChannel) => {
    try {
      setLoadingChannel(channel);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await shareDocumentVia(channel, data, { phone, email });
    } catch {
      onError(t.unableToOpenApp(SHARE_OPTIONS.find((option) => option.id === channel)?.label ?? ''));
    } finally {
      setLoadingChannel(null);
    }
  };

  const handleChannelPress = async (channel: ShareChannel) => {
    setSelectedChannel(channel);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const option = SHARE_OPTIONS.find((item) => item.id === channel);
    if (option?.opensApp) {
      await openSocialShare(channel);
    }
  };

  const showPhoneInput = selectedChannel === 'sms' || selectedChannel === 'whatsapp';
  const showEmailInput = selectedChannel === 'email';

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {SHARE_OPTIONS.map((option) => {
          const selected = selectedChannel === option.id;
          const loading = loadingChannel === option.id;
          const Icon = option.Icon;

          return (
            <Pressable
              key={option.id}
              style={styles.option}
              onPress={() => handleChannelPress(option.id)}
              disabled={!!loadingChannel}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: option.color },
                  selected && styles.iconWrapSelected,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Icon size={20} color={Colors.white} />
                )}
              </View>
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {showPhoneInput ? (
        <PhoneInput
          label={t.sharePhoneNumber}
          value={phone}
          onChangeText={setPhone}
          placeholder="911234567"
        />
      ) : null}

      {showEmailInput ? (
        <Input
          label={t.shareEmailAddress}
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          icon={<Mail size={20} color={Colors.textSecondary} />}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconWrapSelected: {
    borderColor: Brand.primary,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  optionLabel: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: Brand.primary,
  },
});
