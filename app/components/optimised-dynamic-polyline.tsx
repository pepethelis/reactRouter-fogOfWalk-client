import React, { useMemo } from "react";
import { Polyline } from "react-leaflet";
import type { Track } from "~/types";
import { stringToNumberHash } from "~/utils/string-to-number-hash";

interface OptimizedDynamicPolylineProps {
  track: Track;
  index: number;
  visiblePointIndices: Set<number>;
}

export const OptimizedDynamicPolyline: React.FC<
  OptimizedDynamicPolylineProps
> = ({ track, index, visiblePointIndices }) => {
  const optimizedPositions = useMemo(() => {
    if (visiblePointIndices.size === 0) {
      return [];
    }

    // Get visible points and sort by index to maintain track continuity
    const visibleIndices = Array.from(visiblePointIndices).sort(
      (a, b) => a - b
    );
    const positions: [number, number][] = [];

    // Add some context points before and after visible range for smooth lines
    const minIndex = Math.max(0, Math.min(...visibleIndices) - 5);
    const maxIndex = Math.min(
      track.points.length - 1,
      Math.max(...visibleIndices) + 5
    );

    for (let i = minIndex; i <= maxIndex; i++) {
      const point = track.points[i];
      if (point) {
        positions.push(point);
      }
    }

    return positions;
  }, [track.points, visiblePointIndices]);

  if (optimizedPositions.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={optimizedPositions}
      pathOptions={{
        color: `hsl(${
          (stringToNumberHash(track.filename || index.toString()) * 137.508) %
          360
        }, 70%, 50%)`,
        weight: 3,
        opacity: 0.8,
      }}
    />
  );
};
