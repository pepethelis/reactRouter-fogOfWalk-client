import type { Track } from "~/types";
import { calculateTrackLengthWithUnits } from "./calculate-track-length";
import { discoveryRadiusMeters } from "~/lib/constants";
import { removeOutliersAndSmooth } from "../processing/smooth-elevation";

export function calculateTrackDuration(track: Track): number | null {
  const pointsWithTime = track.points.filter((point) => point.time);
  if (pointsWithTime.length < 2) {
    return null;
  }
  const startTime = pointsWithTime[0].time!;
  const endTime = pointsWithTime[pointsWithTime.length - 1].time!;
  return endTime.getTime() - startTime.getTime(); // milliseconds
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

export function calculatePace(distanceKm: number, durationMs: number): number {
  if (distanceKm === 0 || durationMs === 0) {
    return 0;
  }
  // Pace in minutes per kilometer
  const durationMinutes = durationMs / (1000 * 60);
  return durationMinutes / distanceKm;
}

export function formatPace(paceMinPerKm: number): string {
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

// Calculate distance between two GPS points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Calculate speed metrics
export function calculateSpeedMetrics(track: Track): {
  avgSpeed: number | null;
  maxSpeed: number | null;
  formattedAvgSpeed: string;
  formattedMaxSpeed: string;
} {
  const pointsWithTime = track.points.filter((point) => point.time);

  if (pointsWithTime.length < 2) {
    return {
      avgSpeed: null,
      maxSpeed: null,
      formattedAvgSpeed: "unknown",
      formattedMaxSpeed: "unknown",
    };
  }

  const speeds: number[] = [];
  let totalDistance = 0;

  for (let i = 1; i < pointsWithTime.length; i++) {
    const prevPoint = pointsWithTime[i - 1];
    const currPoint = pointsWithTime[i];

    const distance = calculateDistance(
      prevPoint.lat,
      prevPoint.lon,
      currPoint.lat,
      currPoint.lon
    );

    const timeDiff =
      (currPoint.time!.getTime() - prevPoint.time!.getTime()) / 1000; // seconds

    if (timeDiff > 0) {
      const speed = (distance * 1000) / timeDiff; // meters per second
      const speedKmh = speed * 3.6; // convert to km/h
      speeds.push(speedKmh);
      totalDistance += distance;
    }
  }

  if (speeds.length === 0) {
    return {
      avgSpeed: null,
      maxSpeed: null,
      formattedAvgSpeed: "unknown",
      formattedMaxSpeed: "unknown",
    };
  }

  const totalTime =
    (pointsWithTime[pointsWithTime.length - 1].time!.getTime() -
      pointsWithTime[0].time!.getTime()) /
    1000; // seconds

  const avgSpeed = (totalDistance * 3600) / totalTime; // km/h
  const maxSpeed = Math.max(...speeds);

  return {
    avgSpeed,
    maxSpeed,
    formattedAvgSpeed: `${avgSpeed.toFixed(1)} km/h`,
    formattedMaxSpeed: `${maxSpeed.toFixed(1)} km/h`,
  };
}

// Calculate asml metrics
export function calculateAsmlMetrics(track: Track): {
  minAsml: number | null;
  maxAsml: number | null;
  asmlGain: number;
  asmlLoss: number;
  formattedMinAsml: string;
  formattedMaxAsml: string;
  formattedAsmlGain: string;
  formattedAsmlLoss: string;
} {
  const pointsWithAsml = track.points.filter(
    (point) => point.asml !== undefined && point.asml !== null
  );

  if (pointsWithAsml.length === 0) {
    return {
      minAsml: null,
      maxAsml: null,
      asmlGain: 0,
      asmlLoss: 0,
      formattedMinAsml: "unknown",
      formattedMaxAsml: "unknown",
      formattedAsmlGain: "0 m",
      formattedAsmlLoss: "0 m",
    };
  }

  const asmls = pointsWithAsml.map((point) => point.asml!);
  const minAsml = Math.min(...asmls);
  const maxAsml = Math.max(...asmls);

  let asmlGain = 0;
  let asmlLoss = 0;

  // Calculate cumulative asml gain and loss
  for (let i = 1; i < pointsWithAsml.length; i++) {
    const prevAsml = pointsWithAsml[i - 1].asml!;
    const currAsml = pointsWithAsml[i].asml!;
    const diff = currAsml - prevAsml;

    if (diff > 0) {
      asmlGain += diff;
    } else {
      asmlLoss += Math.abs(diff);
    }
  }

  return {
    minAsml,
    maxAsml,
    asmlGain,
    asmlLoss,
    formattedMinAsml: `${minAsml.toFixed(0)} m`,
    formattedMaxAsml: `${maxAsml.toFixed(0)} m`,
    formattedAsmlGain: `${asmlGain.toFixed(0)} m`,
    formattedAsmlLoss: `${asmlLoss.toFixed(0)} m`,
  };
}

// Calculate area covered by circles around track points
export function calculateDiscoveredArea(
  track: Track,
  radiusKm: number
): {
  discoveredArea: number;
  formattedDiscoveredArea: string;
} {
  if (track.points.length === 0) {
    return {
      discoveredArea: 0,
      formattedDiscoveredArea: "0.0 km²",
    };
  }

  // Create a grid to track covered area
  // Grid resolution in degrees (roughly 100m at equator)
  const gridResolution = 0.001;
  const coveredCells = new Set<string>();

  // Convert radius from km to degrees (approximate)
  const radiusDegrees = radiusKm / 111.32; // 111.32 km per degree at equator

  track.points.forEach((point) => {
    // Calculate grid cells within the radius of this point
    const latMin = point.lat - radiusDegrees;
    const latMax = point.lat + radiusDegrees;
    const lonMin = point.lon - radiusDegrees;
    const lonMax = point.lon + radiusDegrees;

    // Iterate through grid cells in the bounding box
    for (let lat = latMin; lat <= latMax; lat += gridResolution) {
      for (let lon = lonMin; lon <= lonMax; lon += gridResolution) {
        // Check if this grid cell is within the radius
        const distance = calculateDistance(point.lat, point.lon, lat, lon);
        if (distance <= radiusKm) {
          const cellKey = `${Math.round(lat / gridResolution)},${Math.round(
            lon / gridResolution
          )}`;
          coveredCells.add(cellKey);
        }
      }
    }
  });

  // Calculate area: each cell represents approximately gridResolution² degrees
  // Convert to km²
  const cellAreaKm2 = Math.pow(gridResolution * 111.32, 2);
  const discoveredArea = coveredCells.size * cellAreaKm2;

  return {
    discoveredArea,
    formattedDiscoveredArea: `${discoveredArea.toFixed(1)} km²`,
  };
}

export function calculateSmoothedAsmlMetrics(track: Track): {
  minAsml: number | null;
  maxAsml: number | null;
  asmlGain: number;
  asmlLoss: number;
  smoothedMinAsml: number | null;
  smoothedMaxAsml: number | null;
  smoothedAsmlGain: number;
  smoothedAsmlLoss: number;
  formattedMinAsml: string;
  formattedMaxAsml: string;
  formattedAsmlGain: string;
  formattedAsmlLoss: string;
  formattedSmoothedMinAsml: string;
  formattedSmoothedMaxAsml: string;
  formattedSmoothedAsmlGain: string;
  formattedSmoothedAsmlLoss: string;
} {
  const pointsWithAsml = track.points.filter(
    (point) => point.asml !== undefined && point.asml !== null
  );

  if (pointsWithAsml.length === 0) {
    const unknownResult = {
      minAsml: null,
      maxAsml: null,
      asmlGain: 0,
      asmlLoss: 0,
      smoothedMinAsml: null,
      smoothedMaxAsml: null,
      smoothedAsmlGain: 0,
      smoothedAsmlLoss: 0,
      formattedMinAsml: "unknown",
      formattedMaxAsml: "unknown",
      formattedAsmlGain: "0 m",
      formattedAsmlLoss: "0 m",
      formattedSmoothedMinAsml: "unknown",
      formattedSmoothedMaxAsml: "unknown",
      formattedSmoothedAsmlGain: "0 m",
      formattedSmoothedAsmlLoss: "0 m",
    };
    return unknownResult;
  }

  const asmls = pointsWithAsml.map((point) => point.asml!);

  // Original elevation metrics
  const minAsml = Math.min(...asmls);
  const maxAsml = Math.max(...asmls);

  let asmlGain = 0;
  let asmlLoss = 0;

  // Calculate cumulative asml gain and loss from original data
  for (let i = 1; i < pointsWithAsml.length; i++) {
    const prevAsml = pointsWithAsml[i - 1].asml!;
    const currAsml = pointsWithAsml[i].asml!;
    const diff = currAsml - prevAsml;

    if (diff > 0) {
      asmlGain += diff;
    } else {
      asmlLoss += Math.abs(diff);
    }
  }

  // Smoothed elevation metrics
  const smoothedAsmls = removeOutliersAndSmooth(asmls, 30, 5); // Remove outliers up to 30m, then smooth

  const smoothedMinAsml = Math.min(...smoothedAsmls);
  const smoothedMaxAsml = Math.max(...smoothedAsmls);

  let smoothedAsmlGain = 0;
  let smoothedAsmlLoss = 0;

  // Calculate cumulative asml gain and loss from smoothed data
  for (let i = 1; i < smoothedAsmls.length; i++) {
    const prevAsml = smoothedAsmls[i - 1];
    const currAsml = smoothedAsmls[i];
    const diff = currAsml - prevAsml;

    if (diff > 0) {
      smoothedAsmlGain += diff;
    } else {
      smoothedAsmlLoss += Math.abs(diff);
    }
  }

  return {
    // Original metrics
    minAsml,
    maxAsml,
    asmlGain,
    asmlLoss,
    formattedMinAsml: `${minAsml.toFixed(0)} m`,
    formattedMaxAsml: `${maxAsml.toFixed(0)} m`,
    formattedAsmlGain: `${asmlGain.toFixed(0)} m`,
    formattedAsmlLoss: `${asmlLoss.toFixed(0)} m`,

    // Smoothed metrics
    smoothedMinAsml,
    smoothedMaxAsml,
    smoothedAsmlGain,
    smoothedAsmlLoss,
    formattedSmoothedMinAsml: `${smoothedMinAsml.toFixed(0)} m`,
    formattedSmoothedMaxAsml: `${smoothedMaxAsml.toFixed(0)} m`,
    formattedSmoothedAsmlGain: `${smoothedAsmlGain.toFixed(0)} m`,
    formattedSmoothedAsmlLoss: `${smoothedAsmlLoss.toFixed(0)} m`,
  };
}

// Enhanced getTrackMetrics that includes smoothed elevation data
export function getTrackMetrics(track: Track) {
  const distance = calculateTrackLengthWithUnits(track);
  const duration = calculateTrackDuration(track);
  const speedMetrics = calculateSpeedMetrics(track);
  const asmlMetrics = calculateSmoothedAsmlMetrics(track); // Use enhanced version
  const areaMetrics = calculateDiscoveredArea(
    track,
    discoveryRadiusMeters / 1000
  );

  if (!duration) {
    return {
      distance,
      duration: null,
      pace: null,
      formattedDuration: "unknown",
      formattedPace: "unknown",
      avgSpeed: speedMetrics.avgSpeed,
      maxSpeed: speedMetrics.maxSpeed,
      formattedAvgSpeed: speedMetrics.formattedAvgSpeed,
      formattedMaxSpeed: speedMetrics.formattedMaxSpeed,

      // Original elevation metrics
      minAsml: asmlMetrics.minAsml,
      maxAsml: asmlMetrics.maxAsml,
      asmlGain: asmlMetrics.asmlGain,
      asmlLoss: asmlMetrics.asmlLoss,
      formattedMinAsml: asmlMetrics.formattedMinAsml,
      formattedMaxAsml: asmlMetrics.formattedMaxAsml,
      formattedAsmlGain: asmlMetrics.formattedAsmlGain,
      formattedAsmlLoss: asmlMetrics.formattedAsmlLoss,

      // Smoothed elevation metrics
      smoothedMinAsml: asmlMetrics.smoothedMinAsml,
      smoothedMaxAsml: asmlMetrics.smoothedMaxAsml,
      smoothedAsmlGain: asmlMetrics.smoothedAsmlGain,
      smoothedAsmlLoss: asmlMetrics.smoothedAsmlLoss,
      formattedSmoothedMinAsml: asmlMetrics.formattedSmoothedMinAsml,
      formattedSmoothedMaxAsml: asmlMetrics.formattedSmoothedMaxAsml,
      formattedSmoothedAsmlGain: asmlMetrics.formattedSmoothedAsmlGain,
      formattedSmoothedAsmlLoss: asmlMetrics.formattedSmoothedAsmlLoss,

      discoveredArea: areaMetrics.discoveredArea,
      formattedDiscoveredArea: areaMetrics.formattedDiscoveredArea,
    };
  }

  const pace = calculatePace(distance.kilometers, duration);

  return {
    distance,
    duration,
    pace,
    formattedDuration: formatDuration(duration),
    formattedPace: formatPace(pace),
    avgSpeed: speedMetrics.avgSpeed,
    maxSpeed: speedMetrics.maxSpeed,
    formattedAvgSpeed: speedMetrics.formattedAvgSpeed,
    formattedMaxSpeed: speedMetrics.formattedMaxSpeed,

    // Original elevation metrics
    minAsml: asmlMetrics.minAsml,
    maxAsml: asmlMetrics.maxAsml,
    asmlGain: asmlMetrics.asmlGain,
    asmlLoss: asmlMetrics.asmlLoss,
    formattedMinAsml: asmlMetrics.formattedMinAsml,
    formattedMaxAsml: asmlMetrics.formattedMaxAsml,
    formattedAsmlGain: asmlMetrics.formattedAsmlGain,
    formattedAsmlLoss: asmlMetrics.formattedAsmlLoss,

    // Smoothed elevation metrics
    smoothedMinAsml: asmlMetrics.smoothedMinAsml,
    smoothedMaxAsml: asmlMetrics.smoothedMaxAsml,
    smoothedAsmlGain: asmlMetrics.smoothedAsmlGain,
    smoothedAsmlLoss: asmlMetrics.smoothedAsmlLoss,
    formattedSmoothedMinAsml: asmlMetrics.formattedSmoothedMinAsml,
    formattedSmoothedMaxAsml: asmlMetrics.formattedSmoothedMaxAsml,
    formattedSmoothedAsmlGain: asmlMetrics.formattedSmoothedAsmlGain,
    formattedSmoothedAsmlLoss: asmlMetrics.formattedSmoothedAsmlLoss,

    discoveredArea: areaMetrics.discoveredArea,
    formattedDiscoveredArea: areaMetrics.formattedDiscoveredArea,
  };
}
