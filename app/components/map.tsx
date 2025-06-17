import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import { useState, useCallback, useMemo, useRef } from "react";
import type { Map as MapType } from "leaflet";
import type { Track } from "~/types";
import { Fog } from "./fog";
import { ViewportTracker } from "./viewport-tracker";
import { useTileManager } from "~/hooks/use-tile-manager";
import { useTracksFitBounds } from "~/hooks/use-tracks-fit-bounds";
import { calculateCenter } from "~/utils/calculate-center";
import type { ViewportBounds } from "~/utils/tile-system";
import { OptimizedPolyline } from "./optimised-polyline";
import { getDistanceFilteredTracks } from "~/utils/distance-track-filtering";
import { deduplicateByTilesMap } from "~/utils/track-deduplication";
import "leaflet/dist/leaflet.css";

export type MapProps = {
  tracks: Array<Track>;
  selectedTrack: Track | null;
  onTrackClick?: (targetTrack: Track) => void;
};

const Map = ({ tracks, selectedTrack, onTrackClick }: MapProps) => {
  const [currentZoom, setCurrentZoom] = useState(13);
  const mapRef = useRef<MapType>(null);

  useTracksFitBounds(tracks, mapRef.current);

  const distanceFilteredTracks = useMemo(() => {
    const filteredTracks = getDistanceFilteredTracks(tracks, currentZoom);
    return deduplicateByTilesMap(filteredTracks, 50);
  }, [currentZoom, tracks]);

  const dedupedTracks = useMemo(() => {
    return deduplicateByTilesMap(distanceFilteredTracks, 70);
  }, [distanceFilteredTracks]);

  const position = useMemo(() => calculateCenter(tracks), [tracks]);
  const { updateVisibleTiles, getVisiblePoints, visibleTileCount } =
    useTileManager(dedupedTracks);

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
      ref={mapRef}
      center={[position.lat, position.lng]}
      zoom={13}
      className="relative h-screen w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      <ViewportTracker onViewportChange={handleViewportChange} />

      {dedupedTracks.map((track, trackIndex) => {
        const visiblePointIndices = visiblePoints.get(trackIndex) || new Set();
        if (visiblePointIndices.size === 0) {
          return null;
        }

        return (
          <OptimizedPolyline
            key={trackIndex}
            muted={!!selectedTrack}
            track={track}
            visiblePointIndices={visiblePointIndices}
            onClick={() => onTrackClick?.(track)} // TODO: put real track, not optimized
          />
        );
      })}

      {!!selectedTrack && (
        <Polyline
          positions={selectedTrack.points}
          className="z-10"
          pathOptions={{
            color: "red",
            weight: 3,
            opacity: 0.8,
          }}
        />
      )}

      <Fog
        tracks={dedupedTracks}
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
        <br />
        Deduped points:{" "}
        {dedupedTracks.reduce((sum, track) => sum + track.points.length, 0)}
        <br />
        Rendered points:{" "}
        {[...visiblePoints.values()].reduce(
          (total, set) => total + set.size,
          0
        )}
      </div>
    </MapContainer>
  );
};

export default Map;
