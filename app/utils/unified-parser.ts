import type { Track } from "~/types";
import { parseFitFiles } from "./fit";
import { parseGpxFiles } from "./gpx";

export async function parseActivityFiles(
  files: FileList | File[]
): Promise<Track[]> {
  const fitFiles: File[] = [];
  const gpxFiles: File[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".fit")) {
      fitFiles.push(file);
    } else if (file.name.toLowerCase().endsWith(".gpx")) {
      gpxFiles.push(file);
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

  return tracks;
}
