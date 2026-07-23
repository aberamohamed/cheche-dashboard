import { GuestRestrictedScreen } from '@/components/auth/GuestRestrictedScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function PlaceholderScreen() {
  const { title } = useLocalSearchParams<{ title?: string }>();
  const screenTitle = title?.trim() || 'Coming Soon';

  return (
    <GuestRestrictedScreen
      header={<ScreenHeader title={screenTitle} onBack={() => router.back()} />}
      showModalOnFocus
    >
      <View style={styles.screen}>
        <EmptyState
          title={screenTitle}
          message="This section is not available yet."
        />
      </View>
    </GuestRestrictedScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});
