import type { Point, Track } from "~/types";

function haversineDistance(point1: Point, point2: Point): number {
  const R = 6371000; // Earth's radius in meters

  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lon - point1.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateTrackLength(track: Track): number {
  if (!track.points || track.points.length < 2) {
    return 0;
  }

  let totalLength = 0;

  for (let i = 1; i < track.points.length; i++) {
    const distance = haversineDistance(track.points[i - 1], track.points[i]);
    totalLength += distance;
  }

  return totalLength;
}

export function calculateTrackLengthWithUnits(track: Track) {
  const meters = calculateTrackLength(track);

  return {
    meters: Math.round(meters * 100) / 100,
    kilometers: Math.round((meters / 1000) * 100) / 100,
    miles: Math.round((meters / 1609.344) * 100) / 100,
    feet: Math.round(meters * 3.28084 * 100) / 100,
  };
}
