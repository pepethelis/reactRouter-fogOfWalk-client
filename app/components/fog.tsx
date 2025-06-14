import { Pane, useMap } from "react-leaflet";
import * as d3 from "d3";
import L from "leaflet";
import { useEffect } from "react";
import type { Track } from "~/types";

const buffer = 2000;

interface FogOfWarProps {
  tracks: Array<Track>;
  visiblePointsMap: Map<number, Set<number>>;
  currentZoom: number;
}

export const Fog = ({
  tracks,
  visiblePointsMap,
  currentZoom,
}: FogOfWarProps) => {
  const map = useMap();

  useEffect(() => {
    const svg = L.svg({ pane: "fogPane", padding: buffer }).addTo(map);
    const container = d3.select(map.getPanes().fogPane).select("svg");

    const renderFog = () => {
      container.selectAll("*").remove();

      const bounds = map.getBounds();
      const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
      const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());

      const width = bottomRight.x - topLeft.x;
      const height = bottomRight.y - topLeft.y;
      const fogX = topLeft.x - buffer;
      const fogY = topLeft.y - buffer;
      const fogWidth = width + 2 * buffer;
      const fogHeight = height + 2 * buffer;

      const mask = container.append("mask").attr("id", "fog-mask");

      mask
        .append("rect")
        .attr("x", fogX)
        .attr("y", fogY)
        .attr("width", fogWidth)
        .attr("height", fogHeight)
        .attr("fill", "white");

      // Only process tracks that have visible points
      tracks.forEach((track, trackIndex) => {
        const trackVisiblePoints = visiblePointsMap.get(trackIndex);
        if (
          !trackVisiblePoints ||
          trackVisiblePoints.size === 0 ||
          track.segments.length === 0
        ) {
          return;
        }

        const radiusMeters = 250;

        track.segments.map((segment) => {
          const firstPoint = segment[0];
          const latlng = new L.LatLng(firstPoint[0], firstPoint[1]);
          const offsetLatLng = L.latLng(firstPoint[0] + 0.001, firstPoint[1]);
          const radiusPixels = Math.max(
            2,
            map
              .latLngToLayerPoint(latlng)
              .distanceTo(map.latLngToLayerPoint(offsetLatLng)) *
              (radiusMeters / latlng.distanceTo(offsetLatLng))
          );

          const visibleIndices = Array.from(trackVisiblePoints).sort(
            (a, b) => a - b
          );
          if (visibleIndices.length === 0) {
            return;
          }

          const minIndex = Math.max(0, Math.min(...visibleIndices) - 3);
          const maxIndex = Math.min(
            segment.length - 1,
            Math.max(...visibleIndices) + 3
          );

          // Create optimized path with only visible + context points
          const visiblePoints: Array<{
            lat: number;
            lng: number;
            index: number;
          }> = [];
          for (let i = minIndex; i <= maxIndex; i++) {
            const point = segment[i];
            if (point) {
              visiblePoints.push({ lat: point[0], lng: point[1], index: i });
            }
          }

          if (visiblePoints.length < 2) return;

          const pathData = visiblePoints
            .map((point, index) => {
              const layerPoint = map.latLngToLayerPoint(
                new L.LatLng(point.lat, point.lng)
              );
              return `${index === 0 ? "M" : "L"} ${layerPoint.x} ${
                layerPoint.y
              }`;
            })
            .join(" ");

          if (pathData && visiblePoints.length > 1) {
            mask
              .append("path")
              .attr("d", pathData)
              .attr("stroke", "black")
              .attr("stroke-width", radiusPixels * 2)
              .attr("stroke-linecap", "round")
              .attr("stroke-linejoin", "round")
              .attr("fill", "none");
          }

          // Add circles at key points (fewer circles at lower zoom)
          const circleStep = Math.max(1, Math.floor(12 - currentZoom));
          visiblePoints.forEach((point, index) => {
            if (index % circleStep === 0) {
              const layerPoint = map.latLngToLayerPoint(
                new L.LatLng(point.lat, point.lng)
              );
              mask
                .append("circle")
                .attr("cx", layerPoint.x)
                .attr("cy", layerPoint.y)
                .attr("r", radiusPixels)
                .attr("fill", "black");
            }
          });
        });
      });

      // Add the fog overlay
      container
        .append("rect")
        .attr("x", fogX)
        .attr("y", fogY)
        .attr("width", fogWidth)
        .attr("height", fogHeight)
        .attr("fill", "rgba(0,0,0,0.8)")
        .attr("mask", "url(#fog-mask)");
    };

    renderFog();
    map.on("zoomend moveend", renderFog);

    return () => {
      map.off("zoomend moveend", renderFog);
      svg.remove();
    };
  }, [map, tracks, visiblePointsMap, currentZoom]);

  return <Pane name="fogPane" />;
};
