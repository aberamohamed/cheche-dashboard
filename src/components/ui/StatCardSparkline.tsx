import { Brand, Colors } from '@/constants/theme';
import type { StatCardVariant } from '@/components/ui/StatCard';
import { valuesToAreaChartPaths } from '@/utils/sparklinePath';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const SPARKLINE_COLORS: Record<StatCardVariant, string> = {
  pink: Brand.primary,
  blue: '#007AFF',
  green: Colors.success,
  purple: '#AF52DE',
};

type StatCardSparklineProps = {
  variant: StatCardVariant;
  data: number[];
  glass?: boolean;
  height?: number;
};

export function StatCardSparkline({
  variant,
  data,
  glass = false,
  height = 36,
}: StatCardSparklineProps) {
  const color = SPARKLINE_COLORS[variant];
  const gradientId = `sparkline-fill-${variant}`;
  const { linePath, areaPath, width, height: viewHeight } = valuesToAreaChartPaths(data, {
    height,
    paddingTop: height <= 24 ? 2 : 4,
    paddingBottom: 2,
  });
  const fillTopOpacity = glass ? 0.4 : 0.32;

  return (
    <Svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${viewHeight}`}
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={fillTopOpacity} />
          <Stop offset="1" stopColor={color} stopOpacity={0.04} />
        </LinearGradient>
      </Defs>

      <Path d={areaPath} fill={`url(#${gradientId})`} />

      <Path
        d={linePath}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
