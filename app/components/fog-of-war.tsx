import { useMap } from "react-leaflet";
import * as d3 from "d3";
import L from "leaflet";
import { useEffect } from "react";
import type { Track } from "~/types";

export const FogOfWar = ({ tracks }: { tracks: Array<Track> }) => {
  const map = useMap();

  useEffect(() => {
    const svg = L.svg({ pane: "fogPane" }).addTo(map);
    const container = d3.select(map.getPanes().fogPane).select("svg");

    const renderFog = () => {
      container.selectAll("*").remove();

      const bounds = map.getBounds();
      const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());

      container
        .append("mask")
        .attr("id", "fog-mask")
        .append("rect")
        .attr("x", topLeft.x)
        .attr("y", topLeft.y)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "white");

      tracks.forEach((track) => {
        track.points.forEach(([lat, lng]) => {
          const latlng = new L.LatLng(lat, lng);
          const point = map.latLngToLayerPoint(latlng);

          const radiusMeters = 100;
          const offsetLatLng = L.latLng(lat + 0.001, lng);
          const radiusPixels =
            map
              .latLngToLayerPoint(latlng)
              .distanceTo(map.latLngToLayerPoint(offsetLatLng)) *
            (radiusMeters / latlng.distanceTo(offsetLatLng));

          container
            .select("mask")
            .append("circle")
            .attr("cx", point.x)
            .attr("cy", point.y)
            .attr("r", radiusPixels)
            .attr("fill", "black");
        });
      });

      container
        .append("rect")
        .attr("x", topLeft.x)
        .attr("y", topLeft.y)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "rgba(0,0,0,0.6)")
        .attr("mask", "url(#fog-mask)");
    };

    renderFog();

    map.on("zoomend moveend", renderFog);

    return () => {
      map.off("zoomend moveend", renderFog);
      svg.remove();
    };
  }, [map, tracks]);

  return null;
};
