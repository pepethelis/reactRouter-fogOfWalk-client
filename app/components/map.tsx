import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Track } from "~/types";

export type MapProps = {
  tracks: Array<Track>;
};

const Map = ({ tracks }: MapProps) => {
  const position = { lat: 42.438917, lng: -71.116146 };

  return (
    <MapContainer center={position} zoom={13} className="h-screen w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
    </MapContainer>
  );
};

export default Map;
