import { Decoder, Stream } from "@garmin/fitsdk";
import type { Point, Track } from "~/types";

interface RecordMessage {
  positionLat?: number;
  positionLong?: number;
  timestamp?: Date;
  enhancedAltitude?: number;
  altitude?: number;
}

interface SessionMessage {
  sport?: string;
  subSport?: string;
  startTime?: Date;
  totalElapsedTime?: number;
}

interface FileIdMessage {
  type?: string;
  manufacturer?: string;
  product?: string | number;
  timeCreated?: Date;
}

interface ActivityMessage {
  timestamp?: Date;
  totalTimerTime?: number;
  localTimestamp?: Date;
}

/**
 * Parse multiple FIT files from file input into Track objects
 */
export async function parseFitFiles(
  files: FileList | File[]
): Promise<Track[]> {
  const tracks: Track[] = [];

  for (const file of files) {
    try {
      const track = await parseSingleFitFile(file);
      if (track) {
        tracks.push(track);
      }
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
      // Continue processing other files even if one fails
    }
  }

  return tracks;
}

/**
 * Parse a single FIT file into a Track object
 */
async function parseSingleFitFile(file: File): Promise<Track | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const stream = Stream.fromArrayBuffer(arrayBuffer);

        // Check if it's a valid FIT file
        // if (!Decoder.isFIT(stream)) {
        //   reject(new Error(`File ${file.name} is not a valid FIT file`));
        //   return;
        // }

        const decoder = new Decoder(stream);

        // Decode the file
        const { messages } = decoder.read();

        // if (errors.length > 0) {
        //   console.warn(`Errors found in file ${file.name}:`, errors);
        // }

        const points: Point[] = [];
        let trackName: string | undefined;
        let trackType: string | undefined;
        let trackSource: string | undefined;
        let trackTime: Date | undefined;

        // Process record messages for GPS points
        if (messages.recordMesgs) {
          messages.recordMesgs.forEach((record: RecordMessage) => {
            if (
              record.positionLat !== undefined &&
              record.positionLong !== undefined
            ) {
              // Convert semicircles to degrees
              const lat = record.positionLat * (180 / Math.pow(2, 31));
              const lon = record.positionLong * (180 / Math.pow(2, 31));

              // Validate coordinates are reasonable
              if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                points.push([lat, lon]);
              }
            }
          });
        }

        // Process session messages for activity info
        if (messages.sessionMesgs && messages.sessionMesgs.length > 0) {
          const session = messages.sessionMesgs[0] as SessionMessage;
          if (session.sport) {
            trackType = session.sport;
            if (session.subSport) {
              trackType += `_${session.subSport}`;
            }
          }
          if (session.startTime) {
            trackTime = session.startTime;
          }
        }

        // Process file ID for metadata
        if (messages.fileIdMesgs && messages.fileIdMesgs.length > 0) {
          const fileId = messages.fileIdMesgs[0] as FileIdMessage;
          if (fileId.manufacturer) {
            trackSource = fileId.manufacturer;
          }
          if (fileId.timeCreated && !trackTime) {
            trackTime = fileId.timeCreated;
          }
        }

        // Process activity messages for additional timing info
        if (messages.activityMesgs && messages.activityMesgs.length > 0) {
          const activity = messages.activityMesgs[0] as ActivityMessage;
          if (activity.timestamp && !trackTime) {
            trackTime = activity.timestamp;
          }
        }

        // Check if we have any GPS points
        if (points.length === 0) {
          console.warn(`No GPS points found in file: ${file.name}`);
          resolve(null);
          return;
        }

        // Generate track name
        trackName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        if (trackType && trackTime) {
          const dateStr = trackTime.toISOString().split("T")[0];
          trackName = `${trackType}_${dateStr}`;
        }

        const track: Track = {
          filename: file.name,
          name: trackName,
          type: trackType,
          source: trackSource,
          time: trackTime,
          points: points,
        };

        resolve(track);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Utility function to filter tracks by type
 */
export function filterTracksByType(tracks: Track[], type: string): Track[] {
  return tracks.filter((track) =>
    track.type?.toLowerCase().includes(type.toLowerCase())
  );
}

/**
 * Utility function to get track bounds
 */
export function getTrackBounds(track: Track): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} | null {
  if (track.points.length === 0) return null;

  let minLon = track.points[0][0];
  let maxLon = track.points[0][0];
  let minLat = track.points[0][1];
  let maxLat = track.points[0][1];

  track.points.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Utility function to calculate track distance in meters
 */
export function calculateTrackDistance(track: Track): number {
  if (track.points.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 1; i < track.points.length; i++) {
    const [lon1, lat1] = track.points[i - 1];
    const [lon2, lat2] = track.points[i];
    totalDistance += haversineDistance(lat1, lon1, lat2, lon2);
  }

  return totalDistance;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get available message types from decoded FIT file (for debugging)
 */
// export function getMessageTypes(file: File): Promise<string[]> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();

//     reader.onload = () => {
//       try {
//         const arrayBuffer = reader.result as ArrayBuffer;
//         const stream = Stream.fromArrayBuffer(arrayBuffer);

//         if (!Decoder.isFIT(stream)) {
//           reject(new Error("Not a valid FIT file"));
//           return;
//         }

//         const decoder = new Decoder(stream);
//         const { messages } = decoder.read();

//         const messageTypes = Object.keys(messages).filter(
//           (key) => Array.isArray(messages[key]) && messages[key].length > 0
//         );

//         resolve(messageTypes);
//       } catch (error) {
//         reject(error);
//       }
//     };

//     reader.onerror = () => reject(new Error("Failed to read file"));
//     reader.readAsArrayBuffer(file);
//   });
// }
