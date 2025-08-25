import { useState, useEffect } from "react";
import type { Map as MapType } from "leaflet";
import { useGeolocation } from "~/hooks/use-geolocation";

export type LocationControlProps = {
  map: MapType | null;
  className?: string;
};

const LocationControl = ({ map, className = "" }: LocationControlProps) => {
  const [shouldCenterOnLocation, setShouldCenterOnLocation] = useState(false);
  const { getCurrentPosition, position, isLoading } = useGeolocation();

  useEffect(() => {
    if (shouldCenterOnLocation && position && map && !isLoading) {
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 16));
      setShouldCenterOnLocation(false);
    }
  }, [position, map, isLoading, shouldCenterOnLocation]);

  const handleLocationClick = () => {
    if (!map) {
      return;
    }

    if (position) {
      // If we already have a position, center on it immediately
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 16));
    } else {
      // Otherwise, request a new position and set flag to center when received
      setShouldCenterOnLocation(true);
      getCurrentPosition();
    }
  };

  return (
    <button
      onClick={handleLocationClick}
      disabled={isLoading}
      className={`
        absolute top-4 right-4 z-[1000]
        w-10 h-10
        bg-white hover:bg-gray-50
        border border-gray-300
        rounded-md shadow-md
        flex items-center justify-center
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title="Center map on your location"
      aria-label="Center map on your location"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-700"
        >
          <polygon points="3,11 22,2 13,21 11,13 3,11" />
        </svg>
      )}
    </button>
  );
};

export default LocationControl;
