import { XMLParser } from "fast-xml-parser";
import type { Point, Track } from "~/types";

async function parseSingleGpxFile(
  parser: XMLParser,
  file: File
): Promise<Track[]> {
  const fileContent = await file.text();
  const { gpx } = parser.parse(fileContent);

  if (!gpx.trk) {
    console.log("GPX file contains no tracks!", file.name);
    return [];
  }

  const tracksInGpx = Array.isArray(gpx.trk) ? gpx.trk : [gpx.trk];
  const parsedTracks: Track[] = [];

  for (const trk of tracksInGpx) {
    if (!trk || !trk.trkseg) {
      continue;
    }

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
        filename: file.name,
        points,
      });
    }
  }

  return parsedTracks;
}
export async function parseGpxFiles(
  files: FileList | File[]
): Promise<Track[]> {
  const parser = new XMLParser({
    attributesGroupName: "$",
    attributeNamePrefix: "",
    ignoreAttributes: false,
    parseAttributeValue: true,
  });

  let tracks: Track[] = [];
  for (const file of files) {
    const extractedTracks = await parseSingleGpxFile(parser, file);
    if (extractedTracks.length > 0) {
      tracks = [...tracks, ...extractedTracks];
    }
  }

  return tracks;
}
