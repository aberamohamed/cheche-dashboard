import { Brand } from '@/constants/theme';
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const iosVersion = parseInt(String(Platform.Version), 10);
const isCompatibleIOS = Platform.OS === 'ios' && iosVersion >= 26;
const isAndroid = Platform.OS === 'android';

type PinNumpadKeyProps = {
  item: number | 'backspace' | '';
  isSubmitting: boolean;
  keySize: number;
  keyMarginHorizontal: number;
  keyMarginVertical: number;
  onPress: () => void;
};

export const PinNumpadKey = React.memo(function PinNumpadKey({
  item,
  isSubmitting,
  keySize,
  keyMarginHorizontal,
  keyMarginVertical,
  onPress,
}: PinNumpadKeyProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const glassAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        useNativeDriver: true,
        damping: 15,
        stiffness: 300,
      }),
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(glassAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 200,
        overshootClamping: false,
      }),
      Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(glassAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1.8],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const isEmpty = item === '';
  const isDisabled = isEmpty || isSubmitting;

  const keyMetrics = {
    width: keySize,
    height: keySize,
    borderRadius: keySize / 2,
    marginHorizontal: keyMarginHorizontal,
    marginVertical: keyMarginVertical,
  };

  const keyLabel =
    item === 'backspace' ? (
      <Ionicons name="backspace-outline" size={24} color={Brand.primary} />
    ) : !isEmpty ? (
      <Text style={styles.keyText}>{item}</Text>
    ) : null;

  if (isEmpty) {
    return <View style={[styles.numpadButton, keyMetrics, styles.numpadButtonEmpty]} />;
  }

  if (isAndroid) {
    return (
      <Pressable
        disabled={isDisabled}
        onPress={onPress}
        android_ripple={{
          color: 'rgba(227, 0, 116, 0.14)',
          borderless: false,
          radius: Math.round(keySize / 2),
        }}
        style={({ pressed }) => [
          styles.numpadButton,
          keyMetrics,
          pressed && !isDisabled && styles.numpadButtonPressed,
          isDisabled && styles.numpadButtonDisabled,
        ]}
      >
        <View
          style={[StyleSheet.absoluteFill, styles.numpadButtonSurface, { borderRadius: keySize / 2 }]}
        />
        <View style={styles.keyContent}>{keyLabel}</View>
      </Pressable>
    );
  }

  const buttonContent = (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      {keyLabel}
    </Animated.View>
  );

  if (isCompatibleIOS) {
    return (
      <TouchableWithoutFeedback
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <View
          style={[
            { marginHorizontal: keyMarginHorizontal, marginVertical: keyMarginVertical },
            styles.liquidKeyShadow,
            isDisabled && styles.numpadButtonDisabled,
          ]}
        >
          <LiquidGlassView
            style={[
              {
                width: keySize,
                height: keySize,
                borderRadius: keySize / 2,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
              },
              !isLiquidGlassSupported && {
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderColor: 'rgba(0,0,0,0.05)',
                borderWidth: 0.5,
              },
            ]}
            interactive
            effect="regular"
          >
            {buttonContent}
          </LiquidGlassView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <View style={[styles.numpadButton, keyMetrics, isDisabled && styles.numpadButtonDisabled]}>
        <View
          style={[StyleSheet.absoluteFill, styles.numpadButtonSurface, { borderRadius: keySize / 2 }]}
        />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: keySize / 2,
              backgroundColor: 'rgba(255,255,255,0.18)',
              opacity: rippleOpacity,
              transform: [{ scale: rippleScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: keySize / 2,
              backgroundColor: 'rgba(255,255,255,0.28)',
              opacity: glassAnim,
            },
          ]}
        />
        {buttonContent}
      </View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  liquidKeyShadow: {
    shadowColor: '#B6C5D9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  numpadButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E7EDFB',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#B6C5D9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
      },
      android: { elevation: 1 },
    }),
  },
  numpadButtonSurface: {
    backgroundColor: '#FFFFFF',
  },
  numpadButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  numpadButtonEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  numpadButtonDisabled: {
    opacity: 0.6,
  },
  keyContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  keyText: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '600' : '400',
    color: '#0F172A',
  },
});
