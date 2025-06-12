import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Track } from "~/types";
import { FogOfWar } from "./fog-of-war";

export type MapProps = {
  tracks: Array<Track>;
};

const Map = ({ tracks }: MapProps) => {
  const position = { lat: 50.45, lng: 30.5233 };

  return (
    <MapContainer center={position} zoom={13} className="h-screen w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {tracks.map((track, trackIndex) => (
        <Polyline
          key={trackIndex}
          positions={track.points}
          pathOptions={{
            color: "#ff0f00",
            weight: 8,
            opacity: 0.4,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}

      <FogOfWar tracks={tracks} />
    </MapContainer>
  );
};

export default Map;
