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
        const trackPoints = Array.isArray(seg.trkpt) ? seg.trkpt : [seg.trkpt];

        for (const trkpt of trackPoints) {
          if (trkpt?.$?.lat && trkpt?.$?.lon) {
            const point: Point = {
              lat: parseFloat(trkpt.$.lat),
              lon: parseFloat(trkpt.$.lon),
              time: trkpt.time ? new Date(trkpt.time) : undefined,
              asml: trkpt.ele ? parseFloat(trkpt.ele) : undefined,
            };
            points.push(point);
          }
        }
      }
    }

    if (points.length > 0) {
      parsedTracks.push({
        name: trk.name,
        type: trk.type,
        time: gpx.metadata?.time ? new Date(gpx.metadata.time) : undefined,
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
      continue;
    }
    console.log("Could not parse", file.name);
  }

  return tracks;
}
