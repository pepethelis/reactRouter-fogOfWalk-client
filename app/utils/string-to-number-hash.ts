export function stringToNumberHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char; // Multiply by 31 and add char code
    hash = hash & hash; // Ensure it stays within 32-bit integer range
  }
  return Math.abs(hash); // Return positive number
}
