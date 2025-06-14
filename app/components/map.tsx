import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import type { Track } from "~/types";
import { FogOfWar } from "./fog-of-war";
import { DynamicPolyline } from "./dynamic-polyline";

export type MapProps = {
  tracks: Array<Track>;
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

const Map = ({ tracks }: MapProps) => {
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

      <MapUpdater tracks={tracks} />

      {tracks.map((track, trackIndex) => (
        <DynamicPolyline key={trackIndex} track={track} index={trackIndex} />
      ))}

      <FogOfWar tracks={tracks} />
    </MapContainer>
  );
};

export default Map;
