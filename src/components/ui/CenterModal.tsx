import { Colors, Radius, Typography } from '@/constants/theme';
import { ModalSheetHeader } from '@/components/ui/ModalSheetHeader';
import { X } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface CenterModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  titleColor?: string;
  headerMode?: 'default' | 'sheet';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function CenterModal({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  titleColor,
  headerMode = 'default',
  children,
  footer,
}: CenterModalProps) {
  return (
    <RNModal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centerWrap}
        >
          <View style={styles.card}>
            {headerMode === 'sheet' ? (
              <ModalSheetHeader title={title} onBack={onClose} />
            ) : (
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  {icon}
                  <Text style={[styles.title, titleColor ? { color: titleColor } : null]}>{title}</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                  <X size={20} color={Colors.text} />
                </Pressable>
              </View>
            )}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  centerWrap: {
    maxHeight: '92%',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    paddingHorizontal: 18,
    paddingTop: 8,
    lineHeight: 18,
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 16,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
