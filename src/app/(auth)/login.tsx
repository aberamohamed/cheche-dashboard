import { AuthFooterLink, AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Brand } from '@/constants/theme';
import { loginPhoneSchema, type LoginPhoneForm } from '@/features/auth/schemas';
import { getCachedLoginPhone, setCachedLoginPhone } from '@/utils/loginPhoneCache';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginPhoneForm>({
    resolver: zodResolver(loginPhoneSchema),
    defaultValues: { phone: '' },
  });

  useEffect(() => {
    getCachedLoginPhone().then((cached) => {
      if (cached) setValue('phone', cached);
    });
  }, [setValue]);

  const onContinue = async (data: LoginPhoneForm) => {
    await setCachedLoginPhone(data.phone);
    router.push({
      pathname: '/(auth)/pin-input',
      params: { phone: data.phone },
    });
  };

  return (
    <AuthScreenShell
      title="Login"
      footer={
        <AuthFooterLink
          text="Don't have an account?"
          linkText="Sign Up"
          onPress={() => router.replace('/(auth)/getting-started' as Href)}
        />
      }
    >
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <PhoneInput
            label="Mobile Number"
            variant="flat"
            value={value}
            onChangeText={(local) => {
              onChange(local);
              void setCachedLoginPhone(local);
            }}
            error={errors.phone?.message}
          />
        )}
      />

      <View style={styles.buttonWrap}>
        <Button title="Next" onPress={handleSubmit(onContinue)} style={styles.nextButton} />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  buttonWrap: { marginTop: 20 },
  nextButton: { height: 55, borderRadius: 14, backgroundColor: Brand.primary },
});
