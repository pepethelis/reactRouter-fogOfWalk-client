import { Pane, useMap } from "react-leaflet";
import * as d3 from "d3";
import L from "leaflet";
import { useEffect } from "react";
import type { Track } from "~/types";

const buffer = 2000;

export const FogOfWar = ({ tracks }: { tracks: Array<Track> }) => {
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

      tracks.forEach((track) => {
        if (track.points.length === 0) return;

        const radiusMeters = 100;
        const firstPoint = track.points[0];
        const latlng = new L.LatLng(firstPoint[0], firstPoint[1]);
        const offsetLatLng = L.latLng(firstPoint[0] + 0.001, firstPoint[1]);
        const radiusPixels =
          map
            .latLngToLayerPoint(latlng)
            .distanceTo(map.latLngToLayerPoint(offsetLatLng)) *
          (radiusMeters / latlng.distanceTo(offsetLatLng));

        const pathData = track.points
          .map(([lat, lng], index) => {
            const point = map.latLngToLayerPoint(new L.LatLng(lat, lng));
            return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
          })
          .join(" ");

        mask
          .append("path")
          .attr("d", pathData)
          .attr("stroke", "black")
          .attr("stroke-width", radiusPixels * 2)
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("fill", "none");

        track.points.forEach(([lat, lng]) => {
          const point = map.latLngToLayerPoint(new L.LatLng(lat, lng));
          mask
            .append("circle")
            .attr("cx", point.x)
            .attr("cy", point.y)
            .attr("r", radiusPixels)
            .attr("fill", "black");
        });
      });

      container
        .append("rect")
        .attr("x", fogX)
        .attr("y", fogY)
        .attr("width", fogWidth)
        .attr("height", fogHeight)
        .attr("fill", "rgba(0,0,0,0.8)")
        .attr("filter", "blur(10px)")
        .attr("mask", "url(#fog-mask)");
    };

    renderFog();
    map.on("zoomend moveend", renderFog);

    return () => {
      map.off("zoomend moveend", renderFog);
      svg.remove();
    };
  }, [map, tracks]);

  return <Pane name="fogPane" style={{ filter: "blur(10px)" }} />;
};
