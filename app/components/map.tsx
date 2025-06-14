import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useCallback, useMemo } from "react";
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

const MapUpdater = ({ tracks }: { tracks: Array<Track> }) => {
  const map = useMap();
  useTracksFitBounds(tracks, map);
  return null;
};

const TileOptimizedMap = ({ tracks }: MapProps) => {
  const [currentZoom, setCurrentZoom] = useState(13);

  const distanceFilteredTracks = useMemo(
    () => getDistanceFilteredTracks(tracks, currentZoom),
    [currentZoom, tracks]
  );
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
        const visiblePointIndices = visiblePoints.get(trackIndex) || new Set();
        if (visiblePointIndices.size === 0) return null;

        return (
          <OptimizedDynamicPolyline
            key={trackIndex}
            track={track}
            index={trackIndex}
            visiblePointIndices={visiblePointIndices}
          />
        );
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
        }}
      >
        Visible tiles: {visibleTileCount}
        <br />
        Zoom: {currentZoom.toFixed(1)}
        <br />
        Visible tracks: {visiblePoints.size}
      </div>
    </MapContainer>
  );
};

export default TileOptimizedMap;
