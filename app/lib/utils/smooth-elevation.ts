export function exponentialMovingAverage(
  values: number[],
  alpha: number = 0.3
): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [...values];

  const smoothed: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const smoothedValue = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
    smoothed.push(smoothedValue);
  }

  return smoothed;
}

export function removeOutliersAndSmooth(
  values: number[],
  maxJump: number = 50, // Maximum elevation change in meters
  windowSize: number = 5
): number[] {
  if (values.length === 0) {
    return [];
  }
  if (values.length === 1) {
    return [...values];
  }

  // First pass: remove obvious outliers
  const cleaned: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const diff = Math.abs(values[i] - cleaned[cleaned.length - 1]);

    if (diff <= maxJump) {
      cleaned.push(values[i]);
    } else {
      // Replace outlier with interpolated value
      cleaned.push(cleaned[cleaned.length - 1]);
    }
  }

  return exponentialMovingAverage(cleaned);
}
