export function savitzkyGolaySmooth(
  values: number[],
  windowSize: number = 5
): number[] {
  if (values.length === 0) return [];
  if (windowSize <= 1 || windowSize % 2 === 0) {
    windowSize = 5; // Default to odd number
  }

  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  // Savitzky-Golay coefficients for quadratic fit (window size 5)
  const coefficients =
    windowSize === 5 ? [-3, 12, 17, 12, -3] : Array(windowSize).fill(1); // Fallback to simple average

  const norm = coefficients.reduce((sum, coef) => sum + coef, 0);

  for (let i = 0; i < values.length; i++) {
    if (i < halfWindow || i >= values.length - halfWindow) {
      // Use simple average for edge cases
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(values.length - 1, i + halfWindow);
      let sum = 0;
      let count = 0;

      for (let j = start; j <= end; j++) {
        sum += values[j];
        count++;
      }

      smoothed.push(sum / count);
    } else {
      // Apply Savitzky-Golay filter
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += coefficients[j] * values[i - halfWindow + j];
      }
      smoothed.push(sum / norm);
    }
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

  // Second pass: Savitzky-Golay algo
  return savitzkyGolaySmooth(cleaned, windowSize);
}
