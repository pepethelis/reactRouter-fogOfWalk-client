import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Track } from "~/types";
import { FogOfWar } from "./fog-of-war";
import { DynamicPolyline } from "./dynamic-polyline";

export type MapProps = {
  tracks: Array<Track>;
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
