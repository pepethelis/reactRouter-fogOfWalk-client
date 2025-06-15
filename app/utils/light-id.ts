export function generateLightId(length: number = 8): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length);
}
