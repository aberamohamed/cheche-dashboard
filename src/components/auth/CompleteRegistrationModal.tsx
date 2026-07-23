import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { Building2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface CompleteRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  title?: string;
  message?: string;
}

export function CompleteRegistrationModal({
  visible,
  onClose,
  onComplete,
  title = 'Complete your registration',
  message = 'Guest access is limited. Register your business to unlock checkout, items, and full POS features.',
}: CompleteRegistrationModalProps) {
  const anim = useRef(new Animated.Value(0)).current;

  const animateOpen = useCallback(() => {
    if (Platform.OS === 'ios') {
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 260,
        damping: 22,
        mass: 0.85,
      }).start();
    } else {
      anim.setValue(1);
    }
  }, [anim]);

  const animateClose = useCallback(
    (after?: () => void) => {
      if (Platform.OS === 'ios') {
        Animated.timing(anim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }).start(() => after?.());
      } else {
        after?.();
      }
    },
    [anim]
  );

  useEffect(() => {
    if (visible) {
      animateOpen();
      return;
    }
    anim.setValue(0);
  }, [animateOpen, anim, visible]);

  const handleClose = () => {
    animateClose(onClose);
  };

  const handleComplete = () => {
    animateClose(onComplete);
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View
          style={[
            styles.cardWrap,
            {
              opacity: anim.interpolate({
                inputRange: [0, 0.35, 1],
                outputRange: [0, 1, 1],
              }),
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.88, 1],
                  }),
                },
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable onPress={(event) => event.stopPropagation()}>
            <View style={[styles.card, styles.cardElevated]}>
              <BlurView
                intensity={42}
                tint="light"
                style={StyleSheet.absoluteFill}
                {...(Platform.OS === 'android'
                  ? {
                      experimentalBlurMethod: 'dimezisBlurView' as const,
                      blurReductionFactor: 2,
                    }
                  : {})}
              />
              <View style={styles.cardSurface}>
                <View style={styles.iconWrap}>
                  <Building2 size={28} color={Brand.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>

                <TouchableOpacity style={styles.primaryButton} onPress={handleComplete} activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>Complete Registration</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleClose} activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 14,
  },
  cardElevated: {
    borderWidth: 0,
  },
  cardSurface: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  primaryButton: {
    width: '100%',
    borderRadius: Radius.full,
    backgroundColor: Brand.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    ...Typography.headline,
    color: Colors.white,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '600',
  },
});
