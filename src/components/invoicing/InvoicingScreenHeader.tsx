import {
  TAB_TITLE_SCREEN_HEADER_MIN_HEIGHT,
  tabTitleScreenHeaderRowPadding,
} from '@/constants/screenHeader';
import { Brand, Colors, Typography } from '@/constants/theme';
import { getInvoiceStrings } from '@/i18n/invoice';
import { useSettingsStore } from '@/store/settingsStore';
import { StatusBar } from 'expo-status-bar';
import { FileText, Receipt } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function InvoicingScreenHeader() {
  const language = useSettingsStore((s) => s.language);
  const strings = getInvoiceStrings(language);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.mainRow}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{strings.title}</Text>
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
        </View>

        <View style={styles.illustration} pointerEvents="none">
          <View style={styles.docStack}>
            <View style={[styles.docSheet, styles.docSheetBack]} />
            <View style={[styles.docSheet, styles.docSheetMid]} />
            <View style={[styles.docSheet, styles.docSheetFront]}>
              <FileText size={12} color={Brand.primary} strokeWidth={2} />
            </View>
          </View>
          <View style={styles.receiptBadge}>
            <Receipt size={13} color={Colors.white} strokeWidth={2.2} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: Colors.white,
    flexShrink: 0,
  },
  mainRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: TAB_TITLE_SCREEN_HEADER_MIN_HEIGHT,
    ...tabTitleScreenHeaderRowPadding,
  },
  titleSection: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  illustration: {
    position: 'absolute',
    right: 16,
    top: tabTitleScreenHeaderRowPadding.paddingTop,
    width: 64,
    height: 52,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  docStack: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  docSheet: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(227, 0, 116, 0.18)',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docSheetBack: {
    width: 32,
    height: 38,
    top: 4,
    left: 0,
    transform: [{ rotate: '-8deg' }],
    backgroundColor: Brand.primaryMuted,
  },
  docSheetMid: {
    width: 30,
    height: 36,
    top: 1,
    left: 6,
    transform: [{ rotate: '4deg' }],
  },
  docSheetFront: {
    width: 28,
    height: 34,
    top: 0,
    right: 0,
    ...StyleSheet.flatten({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    }),
  },
  receiptBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
});
