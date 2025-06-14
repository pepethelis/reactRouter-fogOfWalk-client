import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useMemo, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import type { Track } from "~/types";
import { FogOfWar } from "./fog-of-war";
import { DynamicPolyline } from "./dynamic-polyline";

export type MapProps = {
  tracks: Array<Track>;
  baseSimplificationTolerance?: number;
};

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

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

  const numerator = Math.abs(
    (y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1
  );
  const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

  return denominator === 0 ? 0 : numerator / denominator;
};

const getZoomBasedTolerance = (zoom: number, baseTolerance: number): number => {
  const maxZoom = 18;
  const minToleranceFactor = 0.5;
  const maxToleranceFactor = 20;

  const zoomFactor =
    minToleranceFactor +
    ((maxToleranceFactor - minToleranceFactor) * (maxZoom - zoom)) / maxZoom;
  return baseTolerance * zoomFactor;
};

const trackBoundsCache = new WeakMap<
  Track,
  { north: number; south: number; east: number; west: number }
>();

const getTrackBounds = (track: Track) => {
  if (trackBoundsCache.has(track)) {
    return trackBoundsCache.get(track)!;
  }

  let north = -Infinity,
    south = Infinity,
    east = -Infinity,
    west = Infinity;

  for (const point of track.points) {
    const [lat, lng] = point;
    north = Math.max(north, lat);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    west = Math.min(west, lng);
  }

  const bounds = { north, south, east, west };
  trackBoundsCache.set(track, bounds);
  return bounds;
};

const boundsIntersect = (
  bounds1: ViewportBounds,
  bounds2: ViewportBounds
): boolean => {
  return !(
    bounds1.south > bounds2.north ||
    bounds1.north < bounds2.south ||
    bounds1.west > bounds2.east ||
    bounds1.east < bounds2.west
  );
};

const segmentIntersectsViewport = (
  p1: number[],
  p2: number[],
  bounds: ViewportBounds
): boolean => {
  const [lat1, lng1] = p1;
  const [lat2, lng2] = p2;
  const { north, south, east, west } = bounds;

  const segmentNorth = Math.max(lat1, lat2);
  const segmentSouth = Math.min(lat1, lat2);
  const segmentEast = Math.max(lng1, lng2);
  const segmentWest = Math.min(lng1, lng2);

  if (
    segmentSouth > north ||
    segmentNorth < south ||
    segmentWest > east ||
    segmentEast < west
  ) {
    return false;
  }

  if (
    (lat1 >= south && lat1 <= north && lng1 >= west && lng1 <= east) ||
    (lat2 >= south && lat2 <= north && lng2 >= west && lng2 <= east)
  ) {
    return true;
  }

  const viewportCorners = [
    [south, west],
    [south, east],
    [north, east],
    [north, west],
    [south, west],
  ];

  for (let i = 0; i < 4; i++) {
    if (
      lineSegmentsIntersect(p1, p2, viewportCorners[i], viewportCorners[i + 1])
    ) {
      return true;
    }
  }

  return false;
};

const lineSegmentsIntersect = (
  p1: number[],
  p2: number[],
  p3: number[],
  p4: number[]
): boolean => {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;
  const [x4, y4] = p4;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return false;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};

const isTrackInViewport = (track: Track, bounds: ViewportBounds): boolean => {
  const trackBounds = getTrackBounds(track);
  if (!boundsIntersect(bounds, trackBounds)) {
    return false;
  }

  if (
    trackBounds.north <= bounds.north &&
    trackBounds.south >= bounds.south &&
    trackBounds.east <= bounds.east &&
    trackBounds.west >= bounds.west
  ) {
    return true;
  }

  const points = track.points;
  const pointCount = points.length;

  if (pointCount <= 100) {
    for (const point of points) {
      const [lat, lng] = point;
      if (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      ) {
        return true;
      }
    }
  } else {
    const sampleRate = Math.max(1, Math.floor(pointCount / 50));

    for (let i = 0; i < pointCount; i += sampleRate) {
      const point = points[i];
      const [lat, lng] = point;
      if (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      ) {
        return true;
      }
    }

    for (let i = 0; i < pointCount - sampleRate; i += sampleRate) {
      const endIndex = Math.min(i + sampleRate, pointCount - 1);
      if (segmentIntersectsViewport(points[i], points[endIndex], bounds)) {
        return true;
      }
    }
  }

  return false;
};

interface SpatialIndex {
  tracks: Track[];
  bounds: ViewportBounds;
  children?: SpatialIndex[];
}

const createSpatialIndex = (
  tracks: Track[],
  maxTracksPerNode = 10,
  maxDepth = 4,
  depth = 0
): SpatialIndex => {
  if (tracks.length <= maxTracksPerNode || depth >= maxDepth) {
    return { tracks, bounds: calculateBounds(tracks) };
  }

  const bounds = calculateBounds(tracks);
  const midLat = (bounds.north + bounds.south) / 2;
  const midLng = (bounds.east + bounds.west) / 2;

  const quadrants = [[], [], [], []] as Track[][];

  tracks.forEach((track) => {
    const trackBounds = getTrackBounds(track);
    const centerLat = (trackBounds.north + trackBounds.south) / 2;
    const centerLng = (trackBounds.east + trackBounds.west) / 2;

    const quadrant =
      (centerLat >= midLat ? 0 : 2) + (centerLng >= midLng ? 0 : 1);
    quadrants[quadrant].push(track);
  });

  const children = quadrants
    .filter((quad) => quad.length > 0)
    .map((quad) =>
      createSpatialIndex(quad, maxTracksPerNode, maxDepth, depth + 1)
    );

  return { tracks: [], bounds, children };
};

const calculateBounds = (tracks: Track[]): ViewportBounds => {
  let north = -Infinity,
    south = Infinity,
    east = -Infinity,
    west = Infinity;

  tracks.forEach((track) => {
    const trackBounds = getTrackBounds(track);
    north = Math.max(north, trackBounds.north);
    south = Math.min(south, trackBounds.south);
    east = Math.max(east, trackBounds.east);
    west = Math.min(west, trackBounds.west);
  });

  return { north, south, east, west };
};

const queryIndex = (index: SpatialIndex, viewport: ViewportBounds): Track[] => {
  if (!boundsIntersect(index.bounds, viewport)) {
    return [];
  }

  let result: Track[] = [];

  result = result.concat(
    index.tracks.filter((track) => isTrackInViewport(track, viewport))
  );

  if (index.children) {
    index.children.forEach((child) => {
      result = result.concat(queryIndex(child, viewport));
    });
  }

  return result;
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

const MapController = ({
  tracks,
  onViewportChange,
}: {
  tracks: Array<Track>;
  onViewportChange: (zoom: number, bounds: ViewportBounds) => void;
}) => {
  const map = useMap();

  const updateViewport = useCallback(() => {
    const zoom = map.getZoom();
    const bounds = map.getBounds();

    const viewportBounds: ViewportBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };

    onViewportChange(zoom, viewportBounds);
  }, [map, onViewportChange]);

  useMapEvents({
    zoomend: updateViewport,
    moveend: updateViewport,
  });

  useEffect(() => {
    if (tracks.length === 0) return;

    const allBounds: [number, number][] = [];
    tracks.forEach((track) => {
      track.points.forEach((point) => {
        allBounds.push([point[0], point[1]]);
      });
    });

    if (allBounds.length > 0) {
      map.fitBounds(allBounds, { padding: [20, 20] });
    }

    setTimeout(updateViewport, 100);
  }, [tracks, map, updateViewport]);

  return null;
};

const addBufferToBounds = (
  bounds: ViewportBounds,
  bufferPercent: number = 0.1
): ViewportBounds => {
  const latBuffer = (bounds.north - bounds.south) * bufferPercent;
  const lngBuffer = (bounds.east - bounds.west) * bufferPercent;

  return {
    north: bounds.north + latBuffer,
    south: bounds.south - latBuffer,
    east: bounds.east + lngBuffer,
    west: bounds.west - lngBuffer,
  };
};

const Map = ({ tracks, baseSimplificationTolerance = 0.00005 }: MapProps) => {
  const [zoom, setZoom] = useState(13);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds>({
    north: 0,
    south: 0,
    east: 0,
    west: 0,
  });

  const spatialIndex = useMemo(() => {
    if (tracks.length === 0) return null;

    const startTime = performance.now();
    const index = createSpatialIndex(tracks);
    const endTime = performance.now();

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Spatial index created in ${(endTime - startTime).toFixed(2)}ms for ${
          tracks.length
        } tracks`
      );
    }

    return index;
  }, [tracks]);

  const handleViewportChange = useCallback(
    (newZoom: number, newBounds: ViewportBounds) => {
      setZoom(newZoom);
      setViewportBounds(newBounds);
    },
    []
  );

  const { visibleTracks, tolerance } = useMemo(() => {
    const zoomTolerance = getZoomBasedTolerance(
      zoom,
      baseSimplificationTolerance
    );

    const bufferedBounds = addBufferToBounds(viewportBounds, 0.2);

    let visible: Track[] = [];
    if (spatialIndex) {
      const startTime = performance.now();
      visible = queryIndex(spatialIndex, bufferedBounds);
      const endTime = performance.now();

      if (process.env.NODE_ENV === "development") {
        console.log(
          `Viewport query took ${(endTime - startTime).toFixed(2)}ms`
        );
      }
    } else {
      visible = tracks.filter((track) =>
        isTrackInViewport(track, bufferedBounds)
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`Zoom: ${zoom}, Tolerance: ${zoomTolerance.toFixed(6)}`);
      console.log(`Visible tracks: ${visible.length}/${tracks.length}`);
    }

    return {
      visibleTracks: visible,
      tolerance: zoomTolerance,
    };
  }, [tracks, zoom, viewportBounds, baseSimplificationTolerance, spatialIndex]);

  const simplifiedTracks = useMemo(() => {
    const simplified = simplifyTracks(visibleTracks, tolerance);

    if (process.env.NODE_ENV === "development") {
      visibleTracks.forEach((originalTrack, index) => {
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
  }, [visibleTracks, tolerance]);

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
      return { lat: 50.45, lng: 30.5233 };
    }

    return { lat: totalLat / pointCount, lng: totalLng / pointCount };
  };

  const position = calculateCenter(tracks);

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
      <MapController tracks={tracks} onViewportChange={handleViewportChange} />
      {simplifiedTracks.map((track, trackIndex) => (
        <DynamicPolyline key={trackIndex} track={track} index={trackIndex} />
      ))}
      <FogOfWar tracks={simplifiedTracks} />
    </MapContainer>
  );
};

export default Map;
