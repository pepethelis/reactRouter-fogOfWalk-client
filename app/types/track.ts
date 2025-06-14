import type { Point } from "./point";

export type Track = {
  filename?: string;
  name?: string;
  type?: string;
  source?: string;
  time?: Date;
  points: Point[];
};
