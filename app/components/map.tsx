import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Track } from "~/types";
import { FogOfWar } from "./fog-of-war";
import { useEffect, useState } from "react";

export type MapProps = {
  tracks: Array<Track>;
};

const metersToPixels = (meters: number, zoom: number, latitude: number) => {
  const earthCircumference = 40075016.686; // Earth's circumference in meters
  const pixelsPerTile = 256; // Standard tile size in pixels
  const tiles = Math.pow(2, zoom); // Number of tiles at this zoom level
  const metersPerPixel =
    (earthCircumference * Math.cos((latitude * Math.PI) / 180)) /
    (tiles * pixelsPerTile);
  return Math.min(meters / metersPerPixel, 20); // Limit to 20 meters equivalent
};

const DynamicPolyline = ({ track, index }: { track: Track; index: number }) => {
  const map = useMap();
  const [weight, setWeight] = useState(8);

  useEffect(() => {
    const updateWeight = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      const pixelWeight = metersToPixels(20, zoom, center.lat); // 20 meters
      setWeight(pixelWeight);
    };

    updateWeight(); // Initial calculation
    map.on("zoomend moveend", updateWeight); // Update on zoom or move

    return () => {
      map.off("zoomend moveend", updateWeight); // Cleanup listeners
    };
  }, [map]);

  return (
    <Polyline
      key={index}
      positions={track.points}
      pathOptions={{
        color: "#ff0f00",
        weight: weight,
        opacity: 0.4,
        lineCap: "round",
        lineJoin: "round",
      }}
    />
  );
};

const Map = ({ tracks }: MapProps) => {
  const position = { lat: 50.45, lng: 30.5233 };

  return (
    <MapContainer
      center={position}
      zoom={13}
      className="relative h-screen w-full z-0"
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {tracks.map((track, trackIndex) => (
        <DynamicPolyline key={trackIndex} track={track} index={trackIndex} />
      ))}

      <FogOfWar tracks={tracks} />
    </MapContainer>
  );
};

export default Map;
