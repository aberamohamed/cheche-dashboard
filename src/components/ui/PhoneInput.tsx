import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { PHONE_COUNTRY_CODE, stripToLocalPhone } from '@/utils/phone';
import { touchSessionActivity } from '@/utils/sessionActivity';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface PhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> {
  label?: string;
  error?: string;
  value: string;
  onChangeText: (localPhone: string) => void;
  variant?: 'default' | 'flat';
  rightAccessory?: ReactNode;
}

export function PhoneInput({
  label,
  error,
  value,
  onChangeText,
  variant = 'default',
  rightAccessory,
  onFocus,
  onBlur,
  ...props
}: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    touchSessionActivity();
    const local = stripToLocalPhone(text).slice(0, 9);
    onChangeText(local);
  };

  const isFlat = variant === 'flat';

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, isFlat && styles.labelFlat]}>
          {isFlat ? label : label}
        </Text>
      ) : null}
      <View
        style={[
          styles.container,
          isFlat && styles.containerFlat,
          focused && !error && styles.containerFocused,
          isFlat && focused && !error && styles.containerFlatFocused,
          error && styles.containerError,
        ]}
      >
        <View style={styles.prefixWrap}>
          <Text style={styles.flag}>🇪🇹</Text>
          <Text style={styles.prefix}>{PHONE_COUNTRY_CODE}</Text>
        </View>
        <View style={styles.divider} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder="9/7********"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
          maxLength={9}
          onFocus={(event) => {
            touchSessionActivity();
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6, marginBottom: 2, width: '100%', alignSelf: 'stretch' },
  label: { ...Typography.subhead, color: Colors.text, fontWeight: '500' },
  labelFlat: {
    fontWeight: '600',
    letterSpacing: 0.3,
    color: Colors.textSecondary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 50,
  },
  containerFlat: {
    backgroundColor: Colors.white,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
  },
  containerFocused: { borderColor: Brand.primary },
  containerFlatFocused: { borderColor: Brand.primary },
  containerError: { borderColor: Colors.danger },
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 2,
    gap: 6,
  },
  flag: {
    fontSize: 20,
    lineHeight: 24,
  },
  prefix: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: Colors.border,
    marginLeft: 12,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 0,
  },
  rightAccessory: {
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    ...Typography.caption1,
    color: Colors.danger,
    marginLeft: 12,
    marginTop: 2,
  },
});
