import { useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import type { ViewportBounds } from "~/utils/tile-system";

interface ViewportTrackerProps {
  onViewportChange: (bounds: ViewportBounds) => void;
  throttleMs?: number;
}

export const ViewportTracker: React.FC<ViewportTrackerProps> = ({
  onViewportChange,
  throttleMs = 100,
}) => {
  const map = useMap();

  const updateViewport = () => {
    const bounds = map.getBounds();
    const zoom = map.getZoom();

    const viewportBounds: ViewportBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
      zoom,
    };

    onViewportChange(viewportBounds);
  };

  useEffect(() => {
    updateViewport();

    map.on("moveend", updateViewport);
    map.on("zoomend", updateViewport);

    return () => {
      map.off("moveend", updateViewport);
      map.off("zoomend", updateViewport);
    };
  }, [map, throttleMs]);

  useMapEvents({
    moveend: () => {
      updateViewport();
    },
  });

  return null;
};
