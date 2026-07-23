import { Colors } from '@/constants/theme';
import type { WithholdingFormType } from '@/services/withholdingService';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  Animated,
  Dimensions,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface WithholdingAddMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: WithholdingFormType) => void;
  anchorRef: RefObject<View | null>;
}

const ACTIONS: { id: WithholdingFormType; label: string }[] = [
  { id: 'standard', label: 'Withholding' },
  { id: 'vat', label: 'VAT Withholding' },
];

export function WithholdingAddMenuSheet({
  visible,
  onClose,
  onSelect,
  anchorRef,
}: WithholdingAddMenuSheetProps) {
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const [dropdownPos, setDropdownPos] = useState({ top: 56, right: 20 });

  const animateOpen = useCallback(() => {
    if (Platform.OS === 'ios') {
      Animated.spring(dropdownAnim, {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 260,
        damping: 20,
        mass: 0.8,
      }).start();
    } else {
      dropdownAnim.setValue(1);
    }
  }, [dropdownAnim]);

  const dismiss = useCallback(() => {
    dropdownAnim.setValue(0);
    onClose();
  }, [dropdownAnim, onClose]);

  const closeDropdown = useCallback(() => {
    if (Platform.OS === 'ios') {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        onClose();
      });
      return;
    }
    dismiss();
  }, [dismiss, dropdownAnim, onClose]);

  const openDropdown = useCallback(() => {
    anchorRef.current?.measureInWindow?.((x, y, w, h) => {
      const nextRight = Math.max(10, SCREEN_WIDTH - (x + w));
      const nextTop = Math.max(0, y + h + (Platform.OS === 'android' ? 10 : 12));
      setDropdownPos({ top: nextTop, right: nextRight });
    });
    animateOpen();
  }, [anchorRef, animateOpen]);

  useEffect(() => {
    if (visible) {
      openDropdown();
      return;
    }
    dropdownAnim.setValue(0);
  }, [dropdownAnim, openDropdown, visible]);

  const handleSelect = (type: WithholdingFormType) => {
    dismiss();
    InteractionManager.runAfterInteractions(() => {
      onSelect(type);
    });
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={closeDropdown}>
      <Pressable style={styles.modalOverlay} onPress={closeDropdown}>
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.dropdownContainer,
            {
              top: dropdownPos.top,
              right: dropdownPos.right,
              opacity: dropdownAnim.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [0, 1, 1],
              }),
              transform: [
                {
                  scale: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
                {
                  translateY: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-25, 0],
                  }),
                },
                {
                  translateX: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [25, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable onPress={() => {}}>
            <View style={[styles.dropdown, styles.dropdownElevated]}>
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
              <View style={styles.dropdownSurface}>
                {ACTIONS.map((action, index) => (
                  <TouchableOpacity
                    key={action.id}
                    onPress={() => handleSelect(action.id)}
                    style={[styles.actionItem, styles.actionItemElevated]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionText, styles.actionTextElevated]}>
                      {index + 1}. {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.dropdownArrow, styles.dropdownArrowElevated]} />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    width: 248,
    zIndex: 100,
    position: 'absolute',
    right: 20,
  },
  dropdown: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.76)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 14,
  },
  dropdownElevated: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  dropdownSurface: {
    paddingHorizontal: 5,
  },
  dropdownArrow: {
    position: 'absolute',
    top: -4,
    right: 28,
    width: 14,
    height: 14,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: Colors.border,
    borderLeftColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.76)',
    transform: [{ rotate: '45deg' }],
    zIndex: -1,
    borderRadius: 2,
  },
  dropdownArrowElevated: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  actionItemElevated: {
    marginVertical: 2,
  },
  actionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  actionTextElevated: {
    color: 'rgba(0,0,0,0.88)',
  },
});
