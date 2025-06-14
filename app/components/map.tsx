import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import type { Track } from "~/types";
import { FogOfWar } from "./fog-of-war";
import { DynamicPolyline } from "./dynamic-polyline";

export type MapProps = {
  tracks: Array<Track>;
  simplificationTolerance?: number;
};

const douglasPeucker = (
  points: Track["points"],
  tolerance: number
): Track["points"] => {
  if (points.length <= 2) {
    return points;
  }

  let maxDistance = 0;
  let maxIndex = 0;
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const leftPart = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const rightPart = douglasPeucker(points.slice(maxIndex), tolerance);

    return [...leftPart.slice(0, -1), ...rightPart];
  } else {
    return [firstPoint, lastPoint];
  }
};

const perpendicularDistance = (
  point: number[],
  lineStart: number[],
  lineEnd: number[]
): number => {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  // Calculate the perpendicular distance using the formula:
  // |((y2-y1)*px - (x2-x1)*py + x2*y1 - y2*x1)| / sqrt((y2-y1)^2 + (x2-x1)^2)
  const numerator = Math.abs(
    (y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1
  );
  const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

  return denominator === 0 ? 0 : numerator / denominator;
};

const simplifyTracks = (
  tracks: Array<Track>,
  tolerance: number
): Array<Track> => {
  return tracks.map((track) => ({
    ...track,
    points: douglasPeucker(track.points, tolerance),
    originalPointCount: track.points.length,
  }));
};

const MapUpdater = ({ tracks }: { tracks: Array<Track> }) => {
  const map = useMap();

  useEffect(() => {
    if (tracks.length === 0) return;

    const bounds: [number, number][] = [];
    tracks.forEach((track) => {
      track.points.forEach((point) => {
        bounds.push([point[0], point[1]]);
      });
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [tracks, map]);

  return null;
};

const Map = ({ tracks, simplificationTolerance = 0.0001 }: MapProps) => {
  const simplifiedTracks = useMemo(() => {
    const simplified = simplifyTracks(tracks, simplificationTolerance);

    if (process.env.NODE_ENV === "development") {
      tracks.forEach((originalTrack, index) => {
        const simplifiedTrack = simplified[index];
        const reduction = (
          ((originalTrack.points.length - simplifiedTrack.points.length) /
            originalTrack.points.length) *
          100
        ).toFixed(1);
        console.log(
          `Track ${index}: ${originalTrack.points.length} → ${simplifiedTrack.points.length} points (${reduction}% reduction)`
        );
      });
    }

    return simplified;
  }, [tracks, simplificationTolerance]);

  const calculateCenter = (tracks: Array<Track>) => {
    let totalLat = 0;
    let totalLng = 0;
    let pointCount = 0;

    tracks.forEach((track) => {
      track.points.forEach((point) => {
        totalLat += point[0];
        totalLng += point[1];
        pointCount++;
      });
    });

    if (pointCount === 0) {
      return { lat: 50.45, lng: 30.5233 }; // Default position (Kyiv)
    }

    return { lat: totalLat / pointCount, lng: totalLng / pointCount };
  };

  const position = calculateCenter(simplifiedTracks);

  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={13}
      className="relative h-screen w-full z-0"
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <MapUpdater tracks={simplifiedTracks} />
      {simplifiedTracks.map((track, trackIndex) => (
        <DynamicPolyline key={trackIndex} track={track} index={trackIndex} />
      ))}
      <FogOfWar tracks={simplifiedTracks} />
    </MapContainer>
  );
};

export default Map;
