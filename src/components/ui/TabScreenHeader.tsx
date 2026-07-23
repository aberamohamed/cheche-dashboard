import { GradientHeaderShell } from '@/components/ui/GradientHeaderShell';
import {
  SCREEN_HEADER_PADDING_BOTTOM,
  SCREEN_HEADER_PADDING_TOP,
  SCREEN_HEADER_SIDE_SIZE,
  screenHeaderSubtitleTextLeft,
  screenHeaderTitleTextLeft,
} from '@/constants/screenHeader';
import { Colors, Typography } from '@/constants/theme';
import { useDarkMode } from '@/hooks/useDarkMode';
import { StyleSheet, Text, View } from 'react-native';

interface TabScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function TabScreenHeader({ title, subtitle, right }: TabScreenHeaderProps) {
  const darkMode = useDarkMode();

  return (
    <GradientHeaderShell>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text
            style={[styles.title, !darkMode && styles.titleLight]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </GradientHeaderShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 17,
    paddingRight: 17,
    paddingTop: SCREEN_HEADER_PADDING_TOP,
    paddingBottom: SCREEN_HEADER_PADDING_BOTTOM,
    gap: 10,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    ...screenHeaderTitleTextLeft,
    ...Typography.title2,
    color: Colors.white,
  },
  titleLight: {
    color: Colors.text,
  },
  subtitle: screenHeaderSubtitleTextLeft,
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    minWidth: SCREEN_HEADER_SIDE_SIZE,
  },
});
