import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Track } from "~/types";
import { FogOfWar } from "./fog-of-war";
import { DynamicPolyline } from "./dynamic-polyline";
import { useTracksFitBounds } from "~/hooks/use-tracks-fit-bounds";
import { calculateCenter } from "~/utils/calculate-center";

export type MapProps = {
  tracks: Array<Track>;
};

const MapUpdater = ({ tracks }: { tracks: Array<Track> }) => {
  const map = useMap();

  useTracksFitBounds(tracks, map);

  return null;
};

const Map = ({ tracks }: MapProps) => {
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
