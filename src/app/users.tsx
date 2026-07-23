import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function UsersScreen() {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Users" onBack={() => router.back()} />
      <EmptyState
        title="No users loaded"
        message="User management is not connected to the API yet."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
});
