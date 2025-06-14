import { Polyline, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import type { Segment } from "~/types";
import { metersToPixels } from "~/utils/meters-to-pixels";

const defaultPolylineWeight = 8;

export const DynamicPolyline = ({
  segment,
  index,
}: {
  segment: Segment;
  index: number;
}) => {
  const map = useMap();
  const [weight, setWeight] = useState(defaultPolylineWeight);

  useEffect(() => {
    const updateWeight = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      const pixelWeight = Math.min(
        metersToPixels(20, zoom, center.lat),
        defaultPolylineWeight
      );
      setWeight(pixelWeight);
    };

    updateWeight();
    map.on("zoomend moveend", updateWeight);

    return () => {
      map.off("zoomend moveend", updateWeight);
    };
  }, [map]);

  return (
    <Polyline
      key={`polyline-${index}`}
      positions={segment}
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
