import { useState, useMemo } from "react";
import type { Track } from "~/types";
import {
  TileSystem,
  type TileData,
  type ViewportBounds,
} from "~/utils/tile-system";

export const useTileManager = (tracks: Track[]) => {
  const [tileCache] = useState(new Map<string, TileData>());
  const [visibleTiles, setVisibleTiles] = useState<Set<string>>(new Set());

  const buildTileCache = useMemo(() => {
    tileCache.clear();

    tracks.forEach((track, trackIndex) => {
      track.segments.forEach((segment, segmentIndex) => {
        segment.forEach((point, pointIndex) => {
          for (let zoom = 1; zoom <= 18; zoom++) {
            const tile = TileSystem.latLngToTile(point[0], point[1], zoom);
            const tileKey = TileSystem.tileToKey(tile);

            if (!tileCache.has(tileKey)) {
              tileCache.set(tileKey, {
                key: tile,
                points: [],
              });
            }

            tileCache.get(tileKey)!.points.push({
              lat: point[0],
              lng: point[1],
              trackIndex,
              pointIndex,
            });
          }
        });
      });
    });

    return tileCache;
  }, [tracks, tileCache]);

  const updateVisibleTiles = (bounds: ViewportBounds) => {
    const tilesInView = TileSystem.getTilesInBounds(bounds, 1);
    const visibleTileKeys = new Set(
      tilesInView.map((tile) => TileSystem.tileToKey(tile))
    );
    setVisibleTiles(visibleTileKeys);
  };

  const getVisiblePoints = (zoom: number) => {
    const targetZoom = Math.floor(Math.max(1, Math.min(18, zoom)));
    const visiblePoints = new Map<number, Set<number>>();

    visibleTiles.forEach((tileKey) => {
      const tile = TileSystem.keyToTile(tileKey);
      if (tile.z === targetZoom && tileCache.has(tileKey)) {
        const tileData = tileCache.get(tileKey)!;
        tileData.points.forEach((point) => {
          if (!visiblePoints.has(point.trackIndex)) {
            visiblePoints.set(point.trackIndex, new Set());
          }
          visiblePoints.get(point.trackIndex)!.add(point.pointIndex);
        });
      }
    });

    return visiblePoints;
  };

  return {
    updateVisibleTiles,
    getVisiblePoints,
    tileCache: buildTileCache,
    visibleTileCount: visibleTiles.size,
  };
};
