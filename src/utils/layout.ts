export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getScanFrameSize(layoutWidth: number, layoutHeight: number) {
  const frameWidth = clamp(Math.round(layoutWidth * 0.6), 168, 260);
  const frameHeight = clamp(
    Math.round(Math.min(frameWidth * 0.34, layoutHeight * 0.38)),
    52,
    96
  );

  return { frameWidth, frameHeight };
}
