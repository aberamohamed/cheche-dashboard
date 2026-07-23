import { Brand, Colors } from '@/constants/theme';
import { LANGUAGES, getLanguageCode } from '@/data/languages';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DROPDOWN_GAP = Platform.OS === 'android' ? 10 : 12;

type PickerOption = { id: string; label: string };

type LanguageDropdownProps = {
  selectedId: string;
  onSelect: (languageId: string) => void;
  /** White compact trigger for home hero overlay */
  variant?: 'overlay' | 'default';
  visible?: boolean;
  onClose?: () => void;
  hideTrigger?: boolean;
  options?: PickerOption[];
  anchorRef?: React.RefObject<View | null>;
  dropdownWidth?: number;
};

export function LanguageDropdown({
  selectedId,
  onSelect,
  variant = 'overlay',
  visible: visibleProp,
  onClose,
  hideTrigger = false,
  options = LANGUAGES,
  anchorRef: externalAnchorRef,
  dropdownWidth = 180,
}: LanguageDropdownProps) {
  const insets = useSafeAreaInsets();
  const internalAnchorRef = useRef<View>(null);
  const anchorRef = externalAnchorRef ?? internalAnchorRef;
  const [internalVisible, setInternalVisible] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const anchorPositionRef = useRef({ top: 56, right: 20 });
  const [dropdownPos, setDropdownPos] = useState(anchorPositionRef.current);

  const isControlled = visibleProp !== undefined;
  const isDropdownVisible = isControlled ? visibleProp : internalVisible;
  const isOverlay = variant === 'overlay';
  const triggerColor = isOverlay ? '#FFFFFF' : Brand.primary;

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

  const closeDropdown = useCallback(() => {
    if (Platform.OS === 'ios') {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        if (isControlled) {
          onClose?.();
        } else {
          setInternalVisible(false);
        }
      });
    } else if (isControlled) {
      onClose?.();
    } else {
      setInternalVisible(false);
    }
  }, [dropdownAnim, isControlled, onClose]);

  const measureAnchorPosition = useCallback((): Promise<{ top: number; right: number }> => {
    if (hideTrigger && !externalAnchorRef) {
      const pos = { top: insets.top + 52, right: 20 };
      anchorPositionRef.current = pos;
      return Promise.resolve(pos);
    }

    return new Promise((resolve) => {
      const runMeasure = (attempt = 0) => {
        anchorRef.current?.measureInWindow?.((x, y, w, h) => {
          if (w > 0 && h > 0) {
            const pos = {
              top: Math.max(insets.top, y + h + DROPDOWN_GAP),
              right: Math.max(10, SCREEN_WIDTH - (x + w)),
            };
            anchorPositionRef.current = pos;
            resolve(pos);
            return;
          }

          if (attempt < 3 && Platform.OS === 'android') {
            requestAnimationFrame(() => runMeasure(attempt + 1));
            return;
          }

          resolve(anchorPositionRef.current);
        }) ?? resolve(anchorPositionRef.current);
      };

      if (Platform.OS === 'android') {
        requestAnimationFrame(() => requestAnimationFrame(() => runMeasure()));
        return;
      }

      runMeasure();
    });
  }, [anchorRef, externalAnchorRef, hideTrigger, insets.top]);

  const cacheAnchorPosition = useCallback(() => {
    void measureAnchorPosition().then((pos) => {
      anchorPositionRef.current = pos;
    });
  }, [measureAnchorPosition]);

  const openDropdown = useCallback(() => {
    void measureAnchorPosition().then((pos) => {
      setDropdownPos(pos);
      if (!isControlled) {
        setInternalVisible(true);
      }
      animateOpen();
    });
  }, [animateOpen, isControlled, measureAnchorPosition]);

  useEffect(() => {
    if (isControlled && visibleProp) {
      openDropdown();
    }
    if (isControlled && !visibleProp) {
      dropdownAnim.setValue(0);
    }
  }, [dropdownAnim, isControlled, openDropdown, visibleProp]);

  const toggleDropdown = useCallback(() => {
    if (isDropdownVisible) {
      closeDropdown();
      return;
    }
    openDropdown();
  }, [closeDropdown, isDropdownVisible, openDropdown]);

  const handleSelect = (languageId: string) => {
    onSelect(languageId);
    closeDropdown();
  };

  const renderItem = (item: PickerOption) => {
    const isSelected = selectedId === item.id;
    const selectedOverlayText =
      Platform.OS === 'android' ? styles.selectedLanguageTextOverlayAndroid : styles.selectedLanguageTextOverlay;
    const selectedCheckColor =
      isOverlay && Platform.OS === 'android' ? Colors.white : Brand.primary;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleSelect(item.id)}
        style={[
          styles.languageItem,
          isOverlay ? styles.languageItemOverlay : styles.languageItemElevated,
          isSelected &&
            (isOverlay
              ? Platform.OS === 'android'
                ? styles.selectedLanguageItemOverlayAndroid
                : styles.selectedLanguageItemOverlay
              : styles.selectedLanguageItemElevated),
        ]}
      >
        <View style={styles.languageItemContent}>
          <Text
            style={[
              styles.languageText,
              isOverlay ? styles.languageTextOverlay : styles.languageTextElevated,
              isSelected &&
                (isOverlay
                  ? selectedOverlayText
                  : styles.selectedLanguageTextElevated),
            ]}
          >
            {item.label}
          </Text>
        </View>
        {isSelected ? (
          <Ionicons name="checkmark-circle-outline" size={20} color={selectedCheckColor} />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {!hideTrigger ? (
        <View
          ref={internalAnchorRef}
          collapsable={false}
          onLayout={cacheAnchorPosition}
          style={[styles.triggerCapsule, !isOverlay && styles.triggerCapsuleDefault]}
        >
          <TouchableOpacity
            onPress={toggleDropdown}
            style={styles.languageButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={[styles.languageCodeText, { color: triggerColor }]}>
              {getLanguageCode(selectedId)}
            </Text>
            <Ionicons name="chevron-down" size={16} color={triggerColor} />
          </TouchableOpacity>
        </View>
      ) : externalAnchorRef ? null : (
        <View
          ref={internalAnchorRef}
          collapsable={false}
          onLayout={cacheAnchorPosition}
          style={styles.hiddenAnchor}
        />
      )}

      <Modal
        transparent
        visible={isDropdownVisible}
        animationType="none"
        onRequestClose={closeDropdown}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDropdown}>
          <Pressable onPress={() => undefined}>
            <Animated.View
              pointerEvents="box-none"
              style={[
              styles.dropdownContainer,
              !isOverlay && styles.dropdownContainerShadow,
              {
                top: dropdownPos.top,
                right: dropdownPos.right,
                width: dropdownWidth,
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
            <View
              style={[
                styles.dropdown,
                isOverlay ? styles.dropdownGlass : styles.dropdownElevated,
              ]}
            >
              {isOverlay && Platform.OS === 'ios' ? (
                <BlurView intensity={36} tint="dark" style={StyleSheet.absoluteFill} />
              ) : null}
              {isOverlay && Platform.OS === 'android' ? (
                <LinearGradient
                  colors={[...Brand.headerGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              {isOverlay && Platform.OS === 'ios' ? (
                <View style={styles.dropdownGlassTint} />
              ) : null}
              <View style={styles.dropdownSurface}>
                {options.map(renderItem)}
              </View>
            </View>
            {!isOverlay ? (
              <View style={[styles.dropdownArrow, styles.dropdownArrowElevated]} />
            ) : null}
          </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerCapsule: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 4,
  },
  triggerCapsuleDefault: {
    backgroundColor: Brand.primaryMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  hiddenAnchor: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  languageCodeText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    width: 180,
    zIndex: 100,
    position: 'absolute',
    right: 20,
  },
  dropdownContainerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 12,
  },
  dropdown: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  dropdownElevated: {
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  dropdownGlass: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 14,
  },
  dropdownGlassTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  dropdownSurface: {
    paddingHorizontal: 4,
    paddingVertical: 4,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    borderLeftColor: Colors.border,
    backgroundColor: Colors.white,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  languageItemElevated: {
    marginVertical: 1,
  },
  languageItemOverlay: {
    marginVertical: 0,
  },
  selectedLanguageItemElevated: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  selectedLanguageItemOverlay: {
    backgroundColor: 'rgba(227, 0, 116, 0.14)',
    borderWidth: 0,
  },
  selectedLanguageItemOverlayAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 0,
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  languageTextElevated: {
    color: 'rgba(0,0,0,0.88)',
  },
  languageTextOverlay: {
    color: 'rgba(255, 255, 255, 0.92)',
  },
  selectedLanguageTextElevated: {
    color: Brand.primary,
    fontWeight: '700',
  },
  selectedLanguageTextOverlay: {
    color: Brand.primary,
    fontWeight: '700',
  },
  selectedLanguageTextOverlayAndroid: {
    color: Colors.white,
    fontWeight: '700',
  },
});
