import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useCallback, useMemo, useEffect } from "react";
import type { Track } from "~/types";
import { Fog } from "./fog";
import { ViewportTracker } from "./viewport-tracker";
import { useTileManager } from "~/hooks/use-tile-manager";
import { useTracksFitBounds } from "~/hooks/use-tracks-fit-bounds";
import { calculateCenter } from "~/utils/calculate-center";
import type { ViewportBounds } from "~/utils/tile-system";
import { OptimizedDynamicPolyline } from "./optimised-dynamic-polyline";
import { getDistanceFilteredTracks } from "~/utils/distance-track-filtering";

export type MapProps = {
  tracks: Array<Track>;
};

const ZOOM_LEVELS = [17];

const MapUpdater = ({ tracks }: { tracks: Array<Track> }) => {
  const map = useMap();
  useTracksFitBounds(tracks, map);
  return null;
};

const calculateFilteredTracksForZoomLevel = async (
  tracks: Array<Track>,
  zoomLevel: number
): Promise<Array<Track>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filteredTracks = getDistanceFilteredTracks(tracks, zoomLevel);
      resolve(filteredTracks);
    }, 0);
  });
};

const precalculateAllTracks = async (
  tracks: Array<Track>,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<number, Array<Track>>> => {
  const tracksByZoom = new Map<number, Array<Track>>();

  for (let i = 0; i < ZOOM_LEVELS.length; i++) {
    const zoomLevel = ZOOM_LEVELS[i];
    const filteredTracks = await calculateFilteredTracksForZoomLevel(
      tracks,
      zoomLevel
    );
    tracksByZoom.set(zoomLevel, filteredTracks);

    if (onProgress) {
      onProgress(i + 1, ZOOM_LEVELS.length);
    }
  }

  return tracksByZoom;
};

const TileOptimizedMap = ({ tracks }: MapProps) => {
  const [currentZoom, setCurrentZoom] = useState(13);
  const [precalculatedTracks, setPrecalculatedTracks] = useState<Map<
    number,
    Array<Track>
  > | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState({
    completed: 0,
    total: 0,
  });

  useEffect(() => {
    let isCancelled = false;

    const calculateTracks = async () => {
      if (tracks.length === 0) {
        setPrecalculatedTracks(new Map());
        return;
      }

      setIsCalculating(true);
      setCalculationProgress({ completed: 0, total: ZOOM_LEVELS.length });

      try {
        const result = await precalculateAllTracks(
          tracks,
          (completed, total) => {
            if (!isCancelled) {
              setCalculationProgress({ completed, total });
            }
          }
        );

        if (!isCancelled) {
          setPrecalculatedTracks(result);
          setIsCalculating(false);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error calculating filtered tracks:", error);

          const fallbackMap = new Map<number, Array<Track>>();
          ZOOM_LEVELS.forEach((level) => fallbackMap.set(level, tracks));
          setPrecalculatedTracks(fallbackMap);
          setIsCalculating(false);
        }
      }
    };

    calculateTracks();

    return () => {
      isCancelled = true;
    };
  }, [tracks]);

  const getClosestZoomLevel = useCallback((zoom: number): number => {
    return ZOOM_LEVELS.reduce((closest, level) =>
      Math.abs(level - zoom) < Math.abs(closest - zoom) ? level : closest
    );
  }, []);

  const distanceFilteredTracks = useMemo(() => {
    if (!precalculatedTracks || isCalculating) {
      return [];
    }

    const closestZoom = getClosestZoomLevel(currentZoom);
    return precalculatedTracks.get(closestZoom) || tracks;
  }, [currentZoom, precalculatedTracks, tracks, getClosestZoomLevel]);

  const position = useMemo(() => calculateCenter(tracks), [tracks]);

  const { updateVisibleTiles, getVisiblePoints, visibleTileCount } =
    useTileManager(distanceFilteredTracks);

  const handleViewportChange = useCallback(
    (bounds: ViewportBounds) => {
      updateVisibleTiles(bounds);
      setCurrentZoom(bounds.zoom);
    },
    [updateVisibleTiles]
  );

  const visiblePoints = getVisiblePoints(currentZoom);

  const renderedPointsCount = useMemo(() => {
    let totalLength = 0;
    for (const pointSet of visiblePoints.values()) {
      totalLength += pointSet.size;
    }
    return totalLength;
  }, [distanceFilteredTracks]);

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
      <ViewportTracker onViewportChange={handleViewportChange} />
      <MapUpdater tracks={tracks} />
      {distanceFilteredTracks.map((track, trackIndex) => {
        return track.segments.map((segment, segmentIndex) => {
          const visiblePointIndices =
            visiblePoints.get(trackIndex) || new Set();
          if (visiblePointIndices.size === 0) return null;
          return (
            <OptimizedDynamicPolyline
              key={`${trackIndex}-${segmentIndex}`}
              segment={segment}
              index={trackIndex}
              visiblePointIndices={visiblePointIndices}
            />
          );
        });
      })}
      <Fog
        tracks={distanceFilteredTracks}
        visiblePointsMap={visiblePoints}
        currentZoom={currentZoom}
      />
      <div
        style={{
          position: "absolute",
          left: 10,
          bottom: 10,
          background: "rgba(255,255,255,0.9)",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "12px",
          zIndex: 1000,
          minWidth: "200px",
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          <strong>Map Statistics</strong>
        </div>
        {isCalculating && (
          <div
            style={{
              marginBottom: "8px",
              padding: "4px 8px",
              backgroundColor: "#e3f2fd",
              borderRadius: "3px",
              color: "#1565c0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                className="animate-spin"
                style={{
                  width: "12px",
                  height: "12px",
                  border: "2px solid #1565c0",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                }}
              />
              Optimizing tracks...
            </div>
            <div style={{ fontSize: "10px", marginTop: "2px" }}>
              {calculationProgress.completed}/{calculationProgress.total} zoom
              levels
            </div>
          </div>
        )}
        Visible tiles: {visibleTileCount}
        <br />
        Zoom: {currentZoom.toFixed(1)}
        <br />
        Rendered tracks: {visiblePoints.size}
        <br />
        Rendered points: {renderedPointsCount}
        <br />
        Precalculated levels: {ZOOM_LEVELS.length}
      </div>
    </MapContainer>
  );
};

export default TileOptimizedMap;
