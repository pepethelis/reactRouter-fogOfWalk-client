import { XMLParser } from "fast-xml-parser";
import type { Point, Track } from "~/types";

async function parseKmlLineStringPlacemark(
  placemark: IKmlPlacemark,
  fileName: string
): Promise<Track[] | null> {
  if (
    !placemark.LineString?.coordinates ||
    !placemark.LineString.coordinates.length
  ) {
    return null;
  }

  let points: Point[] = [];

  // Extract coordinates of points from the LineString
  const pointsStr = placemark.LineString.coordinates.trim().split(" ");

  for (const seg of pointsStr) {
    const [lon, lat] = seg.split(",").map(Number);
    if (!isNaN(lon) && !isNaN(lat)) {
      points.push({ lat, lon });
    }
  }

  return [
    {
      name: placemark?.name,
      filename: fileName,
      points: points,
    },
  ];
}

async function parseKmlMultiTrackPlacemark(
  placemark: IKmlPlacemark,
  fileName: string
): Promise<Track[] | null> {
  try {
    if (!placemark.MultiTrack?.Track || !placemark.MultiTrack.Track.length) {
      return null;
    }

    const tracks: Track[] = [];

    for (const track of placemark.MultiTrack.Track) {
      if (!track || !track.coord?.length) {
        continue;
      }

      const points: Point[] = [];

      for (const point of track.coord) {
        const [lon, lat] = point.split(" ").map(Number);

        if (isNaN(lon) || isNaN(lat)) {
          console.warn(
            "Invalid coordinates in KML MultiTrack placemark:",
            point
          );
          continue;
        }

        points.push({
          lat,
          lon,
        });
      }

      if (points.length > 0) {
        tracks.push({
          name: placemark?.name,
          filename: fileName,
          points: points,
        });
      }
    }

    return tracks;
  } catch (error) {
    console.error("Error parsing KML MultiTrack placemark:", placemark, error);
    return null;
  }
}

function getKmlParser(placemark: IKmlPlacemark) {
  if (placemark.LineString) {
    return parseKmlLineStringPlacemark;
  }
  if (placemark.MultiTrack) {
    return parseKmlMultiTrackPlacemark;
  }
  return null;
}

async function parseSingleKmlFile(
  parser: XMLParser,
  file: File
): Promise<Track[]> {
  try {
    const fileContent = await file.text();
    const { kml } = parser.parse(fileContent);

    if (!kml.Document) {
      return [];
    }

    const placemarksInKml: IKmlPlacemark[] = Array.isArray(
      kml.Document.Placemark
    )
      ? kml.Document.Placemark
      : [kml.Document.Placemark];

    if (!placemarksInKml.length) {
      return [];
    }

    const parsedTracks: Track[] = [];

    for (const trk of placemarksInKml) {
      const parserFunc = getKmlParser(trk);
      if (!parserFunc) {
        console.log("Unsupported placemark type, skipping", trk);
        continue;
      }

      const tracks = await parserFunc(trk, file.name);

      if (!tracks?.length) {
        console.log("No points found in placemark, skipping", trk);
        continue;
      }

      parsedTracks.push(...tracks);
    }

    return parsedTracks;
  } catch (error) {
    console.error("Error parsing KML file:", file.name, error);
    return [];
  }
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
