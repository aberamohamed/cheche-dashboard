import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Typography } from '@/constants/theme';
import { changePasswordSchema, type ChangePasswordForm } from '@/features/auth/schemas';
import { fetchProfile, updatePassword } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { appAlert } from '@/utils/alert';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ChangePasswordScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    try {
      let userId = user?.id;
      if (!userId || userId === 'user') {
        const profile = await fetchProfile();
        userId = profile.id;
        setUser(profile);
      }

      await updatePassword(userId, data.password);
      reset();
      appAlert('Password Updated', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ], { variant: 'success' });
    } catch (error) {
      appAlert('Update Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Change Password" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lead}>
            Enter a new password for your account. You will use it the next time you sign in.
          </Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="New Password"
                  placeholder="Enter new password"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  icon={<Lock size={20} color={Colors.textSecondary} />}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter new password"
                  value={value}
                  onChangeText={onChange}
                  error={errors.confirmPassword?.message}
                  icon={<Lock size={20} color={Colors.textSecondary} />}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />

            <Button
              title="Update Password"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  lead: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  form: { gap: 16 },
});
