import { XMLParser } from "fast-xml-parser";
import type { Point, Track } from "~/types";

interface KmlPlacemark {
  name?: string;
  LookAt: {
    longitude?: number;
    latitude?: number;
    altitude?: number;
    heading?: number;
    tilt?: number;
    fovy?: number;
    range?: number;
    altitudeMode?: string;
  };
  styleUrl?: string;
  LineString?: {
    coordinates?: string;
  };
}

async function parseSingleKmlFile(
  parser: XMLParser,
  file: File
): Promise<Track[]> {
  const fileContent = await file.text();
  const { kml } = parser.parse(fileContent);

  if (!kml.Document) {
    console.log("KML file contains no tracks!", file.name);
    return [];
  }

  const tracksInKml = kml.Document.Placemark as KmlPlacemark[];
  const parsedTracks: Track[] = [];

  for (const trk of tracksInKml) {
    if (
      !trk ||
      !trk.LineString?.coordinates ||
      !trk.LineString.coordinates.length
    ) {
      continue;
    }

    const points: Point[] = [];

    // Extract coordinates of points from the LineString
    const pointsStr = trk.LineString.coordinates.trim().split(" ");

    for (const seg of pointsStr) {
      const [lon, lat] = seg.split(",").map(Number);
      if (!isNaN(lon) && !isNaN(lat)) {
        points.push({ lat, lon });
      }
    }

    if (points.length > 0) {
      parsedTracks.push({
        name: trk.name,
        filename: file.name,
        points,
      });
    }
  }

  return parsedTracks;
}

export async function parseKmlFiles(
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
    const extractedTracks = await parseSingleKmlFile(parser, file);
    if (extractedTracks.length > 0) {
      tracks = [...tracks, ...extractedTracks];
      continue;
    }
    console.log("Could not parse", file.name);
  }

  return tracks;
}
