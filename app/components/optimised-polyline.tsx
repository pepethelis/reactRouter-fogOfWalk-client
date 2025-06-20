import React, { useMemo } from "react";
import { Polyline } from "react-leaflet";
import type { Track } from "~/types";
import { stringToNumberHash } from "~/lib/utils/string-to-number-hash";

interface OptimizedPolylineProps {
  track: Track;
  visiblePointIndices: Set<number>;
  muted?: boolean;
  onClick?: () => void;
}

export const OptimizedPolyline: React.FC<OptimizedPolylineProps> = ({
  track,
  visiblePointIndices,
  muted,
  onClick,
}) => {
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
        positions.push([point.lat, point.lon]);
      }
    }
    return positions;
  }, [track.points, visiblePointIndices]);

  if (optimizedPositions.length < 2) {
    return null;
  }

  return (
    <Polyline
      interactive
      eventHandlers={{
        click: onClick,
      }}
      positions={optimizedPositions}
      pathOptions={{
        color: muted
          ? "lightgray"
          : `hsl(${
              (stringToNumberHash(track.filename || "") * 137.508) % 360
            }, 70%, 50%)`,
        weight: 3,
        opacity: 0.8,
      }}
    />
  );
};
