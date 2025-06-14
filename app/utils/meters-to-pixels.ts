export const metersToPixels = (
  meters: number,
  zoom: number,
  latitude: number
) => {
  const earthCircumference = 40075016.686; // Earth's circumference in meters
  const pixelsPerTile = 256; // Standard tile size in pixels
  const tiles = Math.pow(2, zoom); // Number of tiles at this zoom level
  const metersPerPixel =
    (earthCircumference * Math.cos((latitude * Math.PI) / 180)) /
    (tiles * pixelsPerTile);
  return Math.min(meters / metersPerPixel, 20); // Limit to 20 meters equivalent
};
