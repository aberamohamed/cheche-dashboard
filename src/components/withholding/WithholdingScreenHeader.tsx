import {
  TAB_TITLE_SCREEN_HEADER_MIN_HEIGHT,
  screenHeaderSubtitleTextLeft,
  screenHeaderTitleTextLeft,
  tabTitleScreenHeaderRowPadding,
} from '@/constants/screenHeader';
import { Brand, Colors, Typography } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { FileText, Percent } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function WithholdingScreenHeader() {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.mainRow}>
        <View style={styles.textCol}>
          <Text style={styles.title}>Withholding</Text>
          <Text style={styles.subtitle}>Manage withholding receipts</Text>
        </View>
        <View style={styles.illustration} pointerEvents="none">
          <View style={styles.docStack}>
            <View style={[styles.docSheet, styles.docSheetBack]} />
            <View style={[styles.docSheet, styles.docSheetMid]} />
            <View style={[styles.docSheet, styles.docSheetFront]}>
              <FileText size={12} color={Brand.primary} strokeWidth={2} />
            </View>
          </View>
          <View style={styles.percentBadge}>
            <Percent size={13} color={Colors.white} strokeWidth={2.5} />
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    minHeight: TAB_TITLE_SCREEN_HEADER_MIN_HEIGHT,
    ...tabTitleScreenHeaderRowPadding,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    gap: 4,
    paddingRight: 72,
  },
  title: {
    ...screenHeaderTitleTextLeft,
    ...Typography.title2,
    color: Colors.text,
  },
  subtitle: screenHeaderSubtitleTextLeft,
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
  percentBadge: {
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
