import type { Track } from "~/types";
import { parseFitFiles } from "./fit";
import { parseGpxFiles } from "./gpx";
import { parseKmlFiles } from "./kml";
import { parseKmzFiles } from "./kmz";
import { generateLightId } from "../helpers/light-id";

export async function parseActivityFiles(
  files: FileList | File[]
): Promise<Track[]> {
  const fitFiles: File[] = [];
  const gpxFiles: File[] = [];
  const kmlFiles: File[] = [];
  const kmzFiles: File[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".fit")) {
      fitFiles.push(file);
    } else if (file.name.toLowerCase().endsWith(".gpx")) {
      gpxFiles.push(file);
    } else if (file.name.toLowerCase().endsWith(".kml")) {
      kmlFiles.push(file);
    } else if (file.name.toLowerCase().endsWith(".kmz")) {
      kmzFiles.push(file);
    } else {
      console.warn(`Unsupported file type: ${file.name}`);
    }
  }

  const tracks: Track[] = [];

  // Parse FIT files
  if (fitFiles.length > 0) {
    try {
      const fitTracks = await parseFitFiles(fitFiles);
      tracks.push(...fitTracks);
    } catch (error) {
      console.error("Error parsing FIT files:", error);
    }
  }

  // Parse GPX files
  if (gpxFiles.length > 0) {
    try {
      const gpxTracks = await parseGpxFiles(gpxFiles);
      tracks.push(...gpxTracks);
    } catch (error) {
      console.error("Error parsing GPX files:", error);
    }
  }

  // Parse KML files
  if (kmlFiles.length > 0) {
    try {
      const kmlTracks = await parseKmlFiles(kmlFiles);
      tracks.push(...kmlTracks);
    } catch (error) {
      console.error("Error parsing KML files:", error);
    }
  }

  if (kmzFiles.length > 0) {
    try {
      const kmzTracks = await parseKmzFiles(kmzFiles);
      tracks.push(...kmzTracks);
    } catch (error) {
      console.error("Error parsing KMZ files:", error);
    }
  }

  return tracks.map((track) => ({ ...track, id: generateLightId(12) }));
}
