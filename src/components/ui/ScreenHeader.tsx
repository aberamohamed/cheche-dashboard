import { GradientHeaderShell } from '@/components/ui/GradientHeaderShell';
import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import {
  SCREEN_HEADER_PADDING_BOTTOM,
  SCREEN_HEADER_PADDING_TOP,
  SCREEN_HEADER_SIDE_SIZE,
  screenHeaderSubtitleText,
  screenHeaderSubtitleTextLeft,
  screenHeaderTitleText,
  screenHeaderTitleTextLeft,
} from '@/constants/screenHeader';
import { Colors } from '@/constants/theme';
import { useDarkMode } from '@/hooks/useDarkMode';
import { StyleSheet, Text, View } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  const darkMode = useDarkMode();
  const hasBack = Boolean(onBack);

  return (
    <GradientHeaderShell>
      <View style={styles.header}>
        {hasBack ? <HeaderBackButton onPress={onBack!} variant={darkMode ? 'dark' : 'light'} /> : null}
        <View style={[styles.titleWrap, !hasBack && styles.titleWrapLeft]}>
          <Text
            style={[
              hasBack ? styles.title : styles.titleLeft,
              !darkMode && styles.titleLight,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={hasBack ? styles.subtitle : styles.subtitleLeft}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>{right ?? (hasBack ? <View style={styles.rightSpacer} /> : null)}</View>
      </View>
    </GradientHeaderShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: SCREEN_HEADER_PADDING_TOP,
    paddingBottom: SCREEN_HEADER_PADDING_BOTTOM,
    gap: 10,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  titleWrapLeft: {
    alignItems: 'flex-start',
  },
  title: {
    ...screenHeaderTitleText,
    color: Colors.white,
  },
  titleLeft: {
    ...screenHeaderTitleTextLeft,
    color: Colors.white,
  },
  titleLight: {
    color: Colors.text,
  },
  subtitle: screenHeaderSubtitleText,
  subtitleLeft: screenHeaderSubtitleTextLeft,
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    minWidth: SCREEN_HEADER_SIDE_SIZE,
  },
  rightSpacer: {
    width: SCREEN_HEADER_SIDE_SIZE,
  },
});
