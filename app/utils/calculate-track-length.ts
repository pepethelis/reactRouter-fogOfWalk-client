import type { Point, Track } from "~/types";
import { haversineDistance } from "./haversine-distance";

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
