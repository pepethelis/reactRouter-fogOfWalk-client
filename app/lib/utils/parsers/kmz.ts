import { XMLParser } from "fast-xml-parser";
import type { Point, Track } from "~/types";

import JSZip from "jszip";
import { parseKmlFiles } from "./kml";

const zip = new JSZip();

async function unpackKML(kmz: File): Promise<File> {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(kmz);

    // Find KML files in the archive
    let kmlEntry = null;
    let kmlFilename = "";

    // Look for common KML file names first
    const commonNames = ["doc.kml", "index.kml", "main.kml"];
    for (const name of commonNames) {
      if (contents.files[name] && !contents.files[name].dir) {
        kmlEntry = contents.files[name];
        kmlFilename = name;
        break;
      }
    }

    // If not found, look for any .kml file
    if (!kmlEntry) {
      for (const [filename, zipEntry] of Object.entries(contents.files)) {
        if (filename.endsWith(".kml") && !zipEntry.dir) {
          kmlEntry = zipEntry;
          kmlFilename = filename;
          break;
        }
      }
    }

    if (!kmlEntry) {
      throw new Error("No KML files found in KMZ archive");
    }

    // Extract KML content as text
    const kmlContent = await kmlEntry.async("text");

    // Create a new File object with the KML content
    const kmlBlob = new Blob([kmlContent], {
      type: "application/vnd.google-earth.kml+xml",
    });
    const kmlFile = new File([kmlBlob], kmlFilename, {
      type: "application/vnd.google-earth.kml+xml",
      lastModified: Date.now(),
    });

    return kmlFile;
  } catch (error) {
    console.error("Error reading KMZ file:", error);
    throw error;
  }
}

export async function parseKmzFiles(
  files: FileList | File[]
): Promise<Track[]> {
  const kmlFilePromises: Promise<File>[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".kmz")) {
      kmlFilePromises.push(unpackKML(file));
    }
  }

  const kmlFiles = await Promise.all(kmlFilePromises);

  const tracks = await parseKmlFiles(kmlFiles);

  return tracks;
}
