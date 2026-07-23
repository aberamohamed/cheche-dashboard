import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import {
  MODAL_SHEET_PADDING_BOTTOM,
  MODAL_SHEET_PADDING_TOP,
  SCREEN_HEADER_SIDE_SIZE,
  modalSheetHeaderSubtitleText,
  modalSheetHeaderSubtitleTextOnGradient,
  modalSheetHeaderTitleText,
  modalSheetHeaderTitleTextOnGradient,
} from '@/constants/screenHeader';
import { Colors } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

interface ModalSheetHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: React.ReactNode;
  /** Transparent header when the full sheet uses a gradient background. */
  variant?: 'default' | 'gradient';
}

export function ModalSheetHeader({
  title,
  subtitle,
  onBack,
  right,
  variant = 'default',
}: ModalSheetHeaderProps) {
  const onGradientSheet = variant === 'gradient';

  return (
    <View style={[styles.header, onGradientSheet && styles.headerOnGradientSheet]}>
      <HeaderBackButton onPress={onBack} variant={onGradientSheet ? 'dark' : 'light'} />
      <View style={styles.titleWrap}>
        <Text
          style={[styles.title, onGradientSheet && styles.titleOnGradient]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, onGradientSheet && styles.subtitleOnGradient]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right ?? <View style={styles.rightSpacer} />}</View>
    </View>
  );
}

export const modalSheetHeaderStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: MODAL_SHEET_PADDING_TOP,
    paddingBottom: MODAL_SHEET_PADDING_BOTTOM,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerOnGradientSheet: {
    backgroundColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.16)',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  title: modalSheetHeaderTitleText,
  titleOnGradient: modalSheetHeaderTitleTextOnGradient,
  subtitle: modalSheetHeaderSubtitleText,
  subtitleOnGradient: modalSheetHeaderSubtitleTextOnGradient,
  right: {
    minWidth: SCREEN_HEADER_SIDE_SIZE,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightSpacer: {
    width: SCREEN_HEADER_SIDE_SIZE,
  },
});

const styles = modalSheetHeaderStyles;
