import type { Track } from "~/types";

const douglasPeucker = (
  points: Track["points"],
  tolerance: number
): Track["points"] => {
  if (points.length <= 2) {
    return points;
  }

  let maxDistance = 0;
  let maxIndex = 0;
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const leftPart = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const rightPart = douglasPeucker(points.slice(maxIndex), tolerance);

    return [...leftPart.slice(0, -1), ...rightPart];
  } else {
    return [firstPoint, lastPoint];
  }
};

const perpendicularDistance = (
  point: number[],
  lineStart: number[],
  lineEnd: number[]
): number => {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  // Calculate the perpendicular distance using the formula:
  // |((y2-y1)*px - (x2-x1)*py + x2*y1 - y2*x1)| / sqrt((y2-y1)^2 + (x2-x1)^2)
  const numerator = Math.abs(
    (y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1
  );
  const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

  return denominator === 0 ? 0 : numerator / denominator;
};

const simplifyTracks = (
  tracks: Array<Track>,
  tolerance: number
): Array<Track> => {
  return tracks.map((track) => ({
    ...track,
    points: douglasPeucker(track.points, tolerance),
    originalPointCount: track.points.length,
  }));
};
