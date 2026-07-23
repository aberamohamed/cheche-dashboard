const CHART_WIDTH = 100;
const CHART_HEIGHT = 36;
const PADDING_TOP = 4;

type AreaChartPathOptions = {
  width?: number;
  height?: number;
  paddingTop?: number;
  paddingBottom?: number;
};

export function valuesToAreaChartPaths(
  values: number[],
  options: AreaChartPathOptions = {},
): {
  linePath: string;
  areaPath: string;
  width: number;
  height: number;
} {
  const width = options.width ?? CHART_WIDTH;
  const height = options.height ?? CHART_HEIGHT;
  const paddingTop = options.paddingTop ?? PADDING_TOP;
  const paddingBottom = options.paddingBottom ?? 2;

  if (values.length === 0) {
    const baseline = height - paddingBottom;
    const linePath = `M0 ${baseline} L${width} ${baseline}`;
    return {
      linePath,
      areaPath: `${linePath} L${width} ${height} L0 ${height} Z`,
      width,
      height,
    };
  }

  const max = Math.max(...values, 1);
  const plotHeight = height - paddingTop - paddingBottom;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((value, index) => ({
    x: values.length > 1 ? index * step : width / 2,
    y: paddingTop + plotHeight - (value / max) * plotHeight,
  }));

  let linePath = `M${points[0].x} ${points[0].y}`;

  if (points.length === 1) {
    linePath = `M0 ${points[0].y} L${width} ${points[0].y}`;
  } else {
    for (let index = 1; index < points.length; index++) {
      const previous = points[index - 1];
      const current = points[index];
      const controlX = (previous.x + current.x) / 2;
      linePath += ` C${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`;
    }
  }

  return {
    linePath,
    areaPath: `${linePath} L${width} ${height} L0 ${height} Z`,
    width,
    height,
  };
}

export function valuesToSparklinePaths(values: number[]): {
  linePath: string;
  areaPath: string;
  width: number;
  height: number;
} {
  return valuesToAreaChartPaths(values);
}
