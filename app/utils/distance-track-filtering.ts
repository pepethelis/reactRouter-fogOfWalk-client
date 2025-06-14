import type { Point, Track } from "~/types";
import L from "leaflet";

export const getDistanceFilteredTracks = (
  tracks: Array<Track>,
  zoom: number,
  minPixelDistance: number = 10
) => {
  return tracks.map((track) => ({
    ...track,
    points: getDistanceFilteredPoints(track, zoom, minPixelDistance),
  }));
};

export const getDistanceFilteredPoints = (
  track: Track,
  zoom: number,
  minPixelDistance: number = 5
) => {
  if (track.points.length <= 2) {
    return track.points;
  }

  const optimized = [track.points[0]]; // Always keep first point
  let lastIncluded = track.points[0];

  for (let i = 1; i < track.points.length - 1; i++) {
    const current = track.points[i];
    const pixelDistance = calculatePixelDistance(lastIncluded, current, zoom);

    if (pixelDistance >= minPixelDistance) {
      optimized.push(current);
      lastIncluded = current;
    }
  }

  optimized.push(track.points[track.points.length - 1]); // Always keep last point
  return optimized;
};

const calculatePixelDistance = (
  point1: Point,
  point2: Point,
  zoom: number
): number => {
  const latLng1 = L.latLng(point1);
  const latLng2 = L.latLng(point2);

  const metersPerPixel =
    (156543.03392 * Math.cos((latLng1.lat * Math.PI) / 180)) /
    Math.pow(2, zoom);

  const distance = latLng1.distanceTo(latLng2);

  return distance / metersPerPixel;
};

export default calculatePixelDistance;
