import { XMLParser } from "fast-xml-parser";
import type { Point, Track } from "~/types";

export async function parseGPXFiles(files: string[]): Promise<Track[]> {
  const parser = new XMLParser({
    attributesGroupName: "$",
    attributeNamePrefix: "",
    ignoreAttributes: false,
    parseAttributeValue: true,
  });

  let tracks: Track[] = [];
  for (const file of files) {
    const extract = getTracksFromGPXFile(parser, file, file);
    if (extract.length > 0) {
      tracks = [...tracks, ...extract];
    }
  }

  return tracks;
}

function getTracksFromGPXFile(
  parser: XMLParser,
  file: string,
  filename: string
): Track[] {
  const { gpx } = parser.parse(file);

  if (!gpx.trk) {
    console.log("GPX file contains no tracks!", filename);
    return [];
  }

  // Ensure gpx.trk is an array to handle single or multiple tracks
  const tracksInGpx = Array.isArray(gpx.trk) ? gpx.trk : [gpx.trk];
  const parsedTracks: Track[] = [];

  for (const trk of tracksInGpx) {
    if (!trk || !trk.trkseg) continue;

    const points: Point[] = [];
    // Ensure trk.trkseg is an array for single or multiple segments
    const segments = Array.isArray(trk.trkseg) ? trk.trkseg : [trk.trkseg];

    for (const seg of segments) {
      if (seg && seg.trkpt) {
        for (const trkpt of seg.trkpt) {
          if (trkpt?.$?.lat && trkpt?.$?.lon) {
            points.push([parseFloat(trkpt.$.lat), parseFloat(trkpt.$.lon)]);
          }
        }
      }
    }

    if (points.length > 0) {
      parsedTracks.push({
        name: trk.name,
        type: trk.type,
        time: new Date(gpx.metadata?.time),
        source: gpx.$?.creator,
        filename,
        points,
      });
    }
  }

  return parsedTracks;
}
