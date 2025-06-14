import type { Point, Track, Segment } from "~/types";
import L from "leaflet";

export const getDistanceFilteredTracks = (
  tracks: Array<Track>,
  zoom: number,
  minPixelDistance: number = 10
) => {
  const simplifiedTracks = tracks.map((track) => ({
    ...track,
    segments: track.segments
      .map((segment) =>
        getDistanceFilteredPoints(segment, zoom, minPixelDistance)
      )
      .filter((segment) => segment.length >= 2),
  }));

  return removeRedundantSegments(simplifiedTracks, zoom, minPixelDistance);
};

export const getDistanceFilteredPoints = (
  segment: Segment,
  zoom: number,
  minPixelDistance: number = 5
): Segment => {
  if (segment.length <= 2) {
    return segment;
  }

  const optimized = [segment[0]];
  let lastIncluded = segment[0];

  for (let i = 1; i < segment.length - 1; i++) {
    const current = segment[i];
    const pixelDistance = calculatePixelDistance(lastIncluded, current, zoom);
    if (pixelDistance >= minPixelDistance) {
      optimized.push(current);
      lastIncluded = current;
    }
  }
  optimized.push(segment[segment.length - 1]);
  return optimized;
};

const removeRedundantSegments = (
  tracks: Array<Track>,
  zoom: number,
  minPixelDistance: number
): Array<Track> => {
  if (tracks.length <= 1) return tracks;

  const result = tracks.map((track) => ({ ...track }));
  const minSegmentLength = minPixelDistance * 3;

  for (let i = 0; i < result.length; i++) {
    const currentTrack = result[i];
    const newSegments: Array<Segment> = [];

    for (
      let segmentIdx = 0;
      segmentIdx < currentTrack.segments.length;
      segmentIdx++
    ) {
      const currentSegment = currentTrack.segments[segmentIdx];
      const segmentsToRemove = new Set<number>();

      const segmentLength = calculateSegmentLength(currentSegment, zoom);
      if (segmentLength < minSegmentLength) {
        newSegments.push(currentSegment);
        continue;
      }

      for (let lineIdx = 0; lineIdx < currentSegment.length - 1; lineIdx++) {
        if (segmentsToRemove.has(lineIdx)) continue;

        const currentLineStart = currentSegment[lineIdx];
        const currentLineEnd = currentSegment[lineIdx + 1];

        const lineLength = calculatePixelDistance(
          currentLineStart,
          currentLineEnd,
          zoom
        );
        if (lineLength < minPixelDistance) continue;

        let foundOverlap = false;
        for (let j = 0; j < result.length; j++) {
          if (i === j) continue;

          const otherTrack = result[j];

          for (
            let otherSegIdx = 0;
            otherSegIdx < otherTrack.segments.length;
            otherSegIdx++
          ) {
            const otherSegment = otherTrack.segments[otherSegIdx];

            for (
              let otherLineIdx = 0;
              otherLineIdx < otherSegment.length - 1;
              otherLineIdx++
            ) {
              const otherLineStart = otherSegment[otherLineIdx];
              const otherLineEnd = otherSegment[otherLineIdx + 1];

              if (
                segmentsAreParallel(
                  currentLineStart,
                  currentLineEnd,
                  otherLineStart,
                  otherLineEnd,
                  zoom,
                  minPixelDistance
                )
              ) {
                const wouldCreateShortSegment =
                  wouldSplittingCreateShortSegments(
                    currentSegment,
                    lineIdx,
                    zoom,
                    minSegmentLength
                  );

                if (!wouldCreateShortSegment && i > j) {
                  segmentsToRemove.add(lineIdx);
                }
                foundOverlap = true;
                break;
              }
            }

            if (foundOverlap) break;
          }

          if (foundOverlap) break;
        }
      }

      if (segmentsToRemove.size > 0) {
        const splitSegments = removeLineSegmentsFromSegment(
          currentSegment,
          segmentsToRemove
        );

        const validSegments = splitSegments.filter(
          (seg) =>
            seg.length >= 2 &&
            calculateSegmentLength(seg, zoom) >= minSegmentLength
        );
        if (validSegments.length > 0) {
          newSegments.push(...validSegments);
        } else {
          newSegments.push(currentSegment);
        }
      } else {
        newSegments.push(currentSegment);
      }
    }

    currentTrack.segments = newSegments.filter(
      (segment) => segment.length >= 2
    );
  }

  return result.filter((track) => track.segments.length > 0);
};

const segmentsAreParallel = (
  seg1Start: Point,
  seg1End: Point,
  seg2Start: Point,
  seg2End: Point,
  zoom: number,
  minPixelDistance: number
): boolean => {
  const numSamples = 3;

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const point1 = interpolatePoint(seg1Start, seg1End, t);

    const closestDistance = distancePointToSegment(
      point1,
      seg2Start,
      seg2End,
      zoom
    );

    if (closestDistance >= minPixelDistance) {
      return false;
    }
  }

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const point2 = interpolatePoint(seg2Start, seg2End, t);

    const closestDistance = distancePointToSegment(
      point2,
      seg1Start,
      seg1End,
      zoom
    );

    if (closestDistance >= minPixelDistance) {
      return false;
    }
  }

  return true;
};

const distancePointToSegment = (
  point: Point,
  segStart: Point,
  segEnd: Point,
  zoom: number
): number => {
  const A = point[0] - segStart[0];
  const B = point[1] - segStart[1];
  const C = segEnd[0] - segStart[0];
  const D = segEnd[1] - segStart[1];

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let closestPoint: Point;
  if (param < 0) {
    closestPoint = segStart;
  } else if (param > 1) {
    closestPoint = segEnd;
  } else {
    closestPoint = [segStart[0] + param * C, segStart[1] + param * D];
  }

  return calculatePixelDistance(point, closestPoint, zoom);
};

const interpolatePoint = (start: Point, end: Point, t: number): Point => {
  return [
    start[0] + (end[0] - start[0]) * t,
    start[1] + (end[1] - start[1]) * t,
  ];
};

const removeLineSegmentsFromSegment = (
  segment: Segment,
  lineSegmentsToRemove: Set<number>
): Array<Segment> => {
  if (lineSegmentsToRemove.size === 0) return [segment];

  const segments: Array<Segment> = [];
  let currentSegment: Segment = [];

  for (let i = 0; i < segment.length; i++) {
    currentSegment.push(segment[i]);

    if (i < segment.length - 1 && lineSegmentsToRemove.has(i)) {
      if (currentSegment.length >= 2) {
        segments.push(currentSegment);
      }

      currentSegment = [segment[i + 1]];
      i++;
    }
  }

  if (currentSegment.length >= 2) {
    segments.push(currentSegment);
  }

  return segments.length > 0
    ? segments
    : [[segment[0], segment[segment.length - 1]]];
};

const calculateSegmentLength = (segment: Segment, zoom: number): number => {
  if (segment.length < 2) return 0;

  let totalLength = 0;
  for (let i = 0; i < segment.length - 1; i++) {
    totalLength += calculatePixelDistance(segment[i], segment[i + 1], zoom);
  }
  return totalLength;
};

const wouldSplittingCreateShortSegments = (
  segment: Segment,
  splitIndex: number,
  zoom: number,
  minLength: number
): boolean => {
  const beforeSplit = segment.slice(0, splitIndex + 1);
  const afterSplit = segment.slice(splitIndex + 1);

  const beforeLength = calculateSegmentLength(beforeSplit, zoom);
  const afterLength = calculateSegmentLength(afterSplit, zoom);

  return beforeLength < minLength || afterLength < minLength;
};

const calculatePixelDistance = (
  point1: Point,
  point2: Point,
  zoom: number
): number => {
  const latLng1 = L.latLng(point1);
  const latLng2 = L.latLng(point2);
  const metersPerPixel =
    (156543.03392 * Math.cos((latLng1.lat * Math.PI) / 180)) /
    Math.pow(2, zoom);
  const distance = latLng1.distanceTo(latLng2);
  return distance / metersPerPixel;
};

export default calculatePixelDistance;
