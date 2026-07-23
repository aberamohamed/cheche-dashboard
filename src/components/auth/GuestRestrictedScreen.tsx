import { GuestRestrictedPlaceholder } from '@/components/auth/GuestRestrictedPlaceholder';
import { useGuestRegistrationGate } from '@/hooks/useGuestRegistrationGate';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

interface GuestRestrictedScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  title?: string;
  message?: string;
  showModalOnFocus?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function GuestRestrictedScreen({
  children,
  header,
  title,
  message,
  showModalOnFocus = true,
  contentStyle,
}: GuestRestrictedScreenProps) {
  const { isGuest, modal, navigateToRegistration, showPrompt } = useGuestRegistrationGate();

  useFocusEffect(
    useCallback(() => {
      if (isGuest && showModalOnFocus) {
        showPrompt();
      }
    }, [isGuest, showModalOnFocus, showPrompt])
  );

  if (!isGuest) {
    return (
      <View style={[{ flex: 1 }, contentStyle]}>
        {header}
        {children}
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, contentStyle]}>
      {header}
      <GuestRestrictedPlaceholder
        title={title}
        message={message}
        onCompleteRegistration={navigateToRegistration}
      />
      {modal}
    </View>
  );
}
