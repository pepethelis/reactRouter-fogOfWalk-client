import type { Point, Track } from "~/types";
import { generateLightId } from "./light-id";

type TileValue = {
  point: Point;
  trackId: string;
};

const pointToTileKey = (point: Point, tileSizeMeters: number): string => {
  const { lat, lon } = point;

  const latMeters = lat * 111320;
  const lngMeters = lon * 111320 * Math.cos((lat * Math.PI) / 180);

  const tileLatIndex = Math.floor(latMeters / tileSizeMeters);
  const tileLngIndex = Math.floor(lngMeters / tileSizeMeters);

  return `${tileLatIndex},${tileLngIndex}`;
};

export const deduplicateByTilesMap = (
  tracks: Track[],
  tileSizeMeters: number
): Track[] => {
  const tileMap = new Map<string, TileValue>();

  const deduplicatedTracks: Array<Track> = [];

  for (const track of tracks) {
    const trackId = generateLightId();
    let filteredPoints: Track["points"] = [];
    let prevPointDuplicateTile: TileValue | null = null;

    for (const point of track.points) {
      const tileKey = pointToTileKey(point, tileSizeMeters);
      const isDuplicate =
        tileMap.has(tileKey) && tileMap.get(tileKey)!.trackId !== trackId;
      if (prevPointDuplicateTile && !isDuplicate) {
        deduplicatedTracks.push({
          ...track,
          points: filteredPoints,
        });
        filteredPoints = [prevPointDuplicateTile.point];
      }
      if (!isDuplicate) {
        tileMap.set(tileKey, {
          point,
          trackId,
        });
        filteredPoints.push(point);
      }
      if (isDuplicate && !prevPointDuplicateTile) {
        filteredPoints.push(tileMap.get(tileKey)!.point);
      }
      prevPointDuplicateTile = isDuplicate
        ? tileMap.get(tileKey) || null
        : null;
    }

    if (filteredPoints.length > 2) {
      deduplicatedTracks.push({
        ...track,
        points: filteredPoints,
      });
    }
  }

  return deduplicatedTracks;
};
