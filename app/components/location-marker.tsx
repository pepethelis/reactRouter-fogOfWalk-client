import { Marker, Circle } from "react-leaflet";
import { divIcon } from "leaflet";
import type { UserGeolocationPosition } from "~/hooks/use-geolocation";

export type LocationMarkerProps = {
  position: UserGeolocationPosition;
  showAccuracy?: boolean;
  color?: string;
};

const LocationMarker = ({
  position,
  showAccuracy = true,
  color = "#007AFF",
}: LocationMarkerProps) => {
  const locationIcon = divIcon({
    className: "location-marker",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <>
      <Marker
        position={[position.lat, position.lng]}
        icon={locationIcon}
        zIndexOffset={1000}
      />
      {showAccuracy && position.accuracy && (
        <Circle
          center={[position.lat, position.lng]}
          radius={position.accuracy}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.4,
          }}
        />
      )}
    </>
  );
};

export default LocationMarker;
