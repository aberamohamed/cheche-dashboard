import { Brand, Colors, Radius } from '@/constants/theme';
import { ModalSheetHeader } from '@/components/ui/ModalSheetHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal as RNModal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  /** Fixed footer pinned under content (owns safe-area padding; removes extra bottom space). */
  footer?: React.ReactNode;
  centerOverlay?: React.ReactNode;
  keyboardAvoiding?: boolean;
  variant?: 'default' | 'gradient';
  /** Less bottom padding for modals with a fixed footer (safe area only). */
  compactBottom?: boolean;
  /** Sheet height follows children instead of stretching. */
  fitContent?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  headerRight,
  children,
  footer,
  centerOverlay,
  keyboardAvoiding = false,
  variant = 'default',
  compactBottom = false,
  fitContent = false,
}: ModalProps) {
  const isGradient = variant === 'gradient';
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const hasFooter = Boolean(footer);

  useEffect(() => {
    if (!keyboardAvoiding || !visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardAvoiding, visible]);

  const bottomInset = keyboardHeight > 0 ? 0 : Math.max(insets.bottom, 12);
  const sheetBottomOffset = keyboardAvoiding ? keyboardHeight : 0;
  const contentPaddingBottom = hasFooter
    ? 0
    : keyboardAvoiding
      ? 12
      : compactBottom
        ? Math.max(insets.bottom, 12)
        : bottomInset + 22;

  const sheetBody = (
    <>
      <View style={[styles.handle, isGradient && styles.handleGradient]} />
      {title ? (
        <ModalSheetHeader
          title={title}
          onBack={onClose}
          right={headerRight}
          variant={variant}
        />
      ) : null}
      <View
        style={[
          styles.content,
          isGradient && styles.contentGradient,
          fitContent && styles.contentFit,
          { paddingBottom: contentPaddingBottom },
        ]}
      >
        {children}
      </View>
      {hasFooter ? (
        <View
          style={[
            styles.footer,
            isGradient && styles.footerGradient,
          ]}
        >
          {footer}
        </View>
      ) : null}
    </>
  );

  const sheetStyle = [
    styles.sheet,
    isGradient ? styles.sheetGradient : styles.sheetDefault,
    keyboardAvoiding && keyboardHeight === 0 && styles.sheetKeyboard,
    fitContent && styles.sheetFitContent,
    { marginBottom: sheetBottomOffset },
  ];

  const sheet = isGradient ? (
    <LinearGradient colors={[...Brand.primaryGradient]} style={sheetStyle}>
      {sheetBody}
    </LinearGradient>
  ) : (
    <View style={sheetStyle}>{sheetBody}</View>
  );

  return (
    <RNModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        {centerOverlay ? <View style={styles.centerOverlay}>{centerOverlay}</View> : null}
        {sheet}
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  sheetKeyboard: {
    minHeight: '48%',
  },
  sheetFitContent: {
    flexGrow: 0,
    flexShrink: 1,
  },
  sheetDefault: {
    backgroundColor: Colors.surface,
  },
  sheetGradient: {
    backgroundColor: 'transparent',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  handleGradient: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  content: {
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
  },
  contentFit: {
    flexGrow: 0,
    flexShrink: 1,
  },
  contentGradient: {
    backgroundColor: 'transparent',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  footerGradient: {
    backgroundColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
});
