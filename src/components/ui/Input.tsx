import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { touchSessionActivity } from '@/utils/sessionActivity';
import { Eye, EyeOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  variant?: 'default' | 'flat';
}

export function Input({
  label,
  error,
  icon,
  rightAccessory,
  variant = 'default',
  secureTextEntry,
  style,
  multiline,
  value,
  onFocus,
  onBlur,
  onChangeText,
  placeholder,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = secureTextEntry;
  const isMultiline = !!multiline;
  const isFlat = variant === 'flat';
  const useFloatingLabel = isFlat && !isMultiline && !!label;
  const hasValue = String(value ?? '').length > 0;
  const showFloatingLabel = focused || hasValue;
  const labelPosition = useRef(new Animated.Value(hasValue ? 1 : 0)).current;

  useEffect(() => {
    if (!useFloatingLabel) return;
    Animated.timing(labelPosition, {
      toValue: showFloatingLabel ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showFloatingLabel, useFloatingLabel, labelPosition]);

  const floatingLabelStyle = {
    top: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [17, -11],
    }),
    fontSize: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 12],
    }),
    left: icon ? 40 : 25,
  };

  return (
    <View style={[styles.wrapper, isFlat && styles.wrapperFlat]}>
      {label && (!isFlat || isMultiline) ? (
        <Text style={[styles.label, isFlat && styles.labelFlat]}>
          {isFlat ? label.toUpperCase() : label}
        </Text>
      ) : null}
      <View
        style={[
          styles.container,
          isFlat && styles.containerFlat,
          isMultiline && styles.containerMultiline,
          focused && !error && styles.containerFocused,
          isFlat && focused && !error && styles.containerFlatFocused,
          error && styles.containerError,
        ]}
      >
        {icon ? <View style={[styles.icon, isFlat && styles.iconFlat]}>{icon}</View> : null}
        <TextInput
          style={[
            styles.input,
            isFlat ? styles.inputFlat : null,
            isFlat && showFloatingLabel ? styles.inputFlatFloated : null,
            icon != null && isFlat ? styles.inputFlatWithIcon : null,
            isMultiline ? styles.inputMultiline : null,
            style,
          ]}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          multiline={multiline}
          scrollEnabled={!isMultiline}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          value={value}
          onFocus={(event) => {
            touchSessionActivity();
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onChangeText={(text) => {
            touchSessionActivity();
            onChangeText?.(text);
          }}
          placeholder={useFloatingLabel ? undefined : placeholder}
          {...props}
        />
        {useFloatingLabel ? (
          <Animated.View
            style={[styles.floatingLabelContainer, floatingLabelStyle]}
            pointerEvents="none"
          >
            <Animated.Text
              style={[
                styles.floatingLabel,
                focused && styles.floatingLabelFocused,
              ]}
            >
              {label}
            </Animated.Text>
          </Animated.View>
        ) : null}
        {isPassword ? (
          <Pressable style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={22} color="#C2C2C2" />
            ) : (
              <Eye size={22} color="#C2C2C2" />
            )}
          </Pressable>
        ) : rightAccessory ? (
          <View style={styles.rightAccessory}>{rightAccessory}</View>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6, marginBottom: 2 },
  wrapperFlat: {
    paddingTop: 8,
  },
  label: { ...Typography.subhead, color: Colors.text, fontWeight: '500' },
  labelFlat: {
    marginLeft: 12,
    fontWeight: '600',
    letterSpacing: 1,
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
    position: 'relative',
    overflow: 'hidden',
  },
  containerFlat: {
    backgroundColor: Colors.white,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    paddingHorizontal: 0,
    overflow: 'visible',
    height: 50,
  },
  containerFlatFocused: {
    borderColor: Brand.primary,
  },
  containerMultiline: {
    height: undefined,
    minHeight: 112,
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  containerFocused: { borderColor: Brand.primary },
  containerError: { borderColor: Colors.danger },
  icon: { marginRight: 10 },
  iconFlat: {
    marginRight: 0,
    paddingLeft: 10,
    paddingRight: 5,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.15)',
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 0,
  },
  inputFlat: {
    fontSize: 14,
    paddingHorizontal: 12,
    height: '100%',
  },
  inputFlatFloated: {
    paddingTop: 3,
  },
  inputFlatWithIcon: {
    paddingLeft: 10,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: 0,
  },
  floatingLabelContainer: {
    position: 'absolute',
    backgroundColor: Colors.white,
    paddingHorizontal: 4,
    zIndex: 2,
  },
  floatingLabel: {
    color: Colors.text,
    fontWeight: '400',
  },
  floatingLabelFocused: {
    color: Brand.primaryDark,
    fontWeight: '500',
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rightAccessory: {
    paddingRight: 12,
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    ...Typography.caption1,
    color: Colors.danger,
    marginLeft: 12,
    marginTop: 2,
  },
});
