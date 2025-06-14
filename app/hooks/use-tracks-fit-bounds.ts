import type { Map } from "leaflet";
import { useEffect } from "react";
import type { Track } from "~/types";

export function useTracksFitBounds(tracks: Array<Track>, map: Map) {
  useEffect(() => {
    if (tracks.length === 0) {
      return;
    }

    const bounds: [number, number][] = [];
    tracks.forEach((track) => {
      track.points.forEach((point) => {
        bounds.push([point[0], point[1]]);
      });
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [tracks, map]);
}
