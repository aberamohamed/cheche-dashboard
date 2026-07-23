import { Brand, Colors } from '@/constants/theme';
import type { AlertButton } from '@/store/alertStore';
import { useAlertStore } from '@/store/alertStore';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Fragment } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

function AlertButtonRow({
  buttons,
  onPress,
}: {
  buttons: AlertButton[];
  onPress: (button: AlertButton) => void;
}) {
  return (
    <View style={styles.buttonContainer}>
      {buttons.map((button, index) => {
        const isDestructive = button.style === 'destructive';
        const isCancel = button.style === 'cancel';
        const isPrimaryAction = index === buttons.length - 1;

        let buttonTextColor = '#000000';
        if (isDestructive) {
          buttonTextColor = '#FF3B30';
        } else if (isPrimaryAction && !isCancel) {
          buttonTextColor = Brand.primary;
        } else if (isCancel) {
          buttonTextColor = '#000000';
        }

        return (
          <Fragment key={`${button.text}-${index}`}>
            {index > 0 ? <View style={styles.verticalDivider} /> : null}
            <Pressable
              style={styles.button}
              onPress={() => onPress(button)}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: buttonTextColor }]}>{button.text}</Text>
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

export function AlertHost() {
  const { visible, title, message, variant, buttons, hide } = useAlertStore();

  const handlePress = (button: AlertButton) => {
    try {
      button.onPress?.();
    } finally {
      hide();
    }
  };

  const handleShow = () => {
    if (variant === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (variant === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={hide}
      onShow={handleShow}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          ) : null}
          <View style={styles.alertContent}>
            <View style={styles.textContainer}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {message ? <Text style={styles.message}>{message}</Text> : null}
            </View>
            <AlertButtonRow buttons={buttons} onPress={handlePress} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const themeBorderColor = 'rgba(0, 0, 0, 0.08)';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  alertBox: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.75)' : Colors.white,
    borderWidth: StyleSheet.hairlineWidth * 1.5,
    borderColor: themeBorderColor,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  alertContent: {
    width: '100%',
  },
  textContainer: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
    fontSize: 18,
    color: Colors.text,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 14,
    color: '#333333',
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth * 1.5,
    borderTopColor: themeBorderColor,
    height: 52,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  verticalDivider: {
    width: StyleSheet.hairlineWidth * 1.5,
    height: '100%',
    backgroundColor: themeBorderColor,
  },
});
