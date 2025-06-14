export type Point = [number, number];

export type Segment = Array<Point>;

export type Track = {
  filename?: string;
  name?: string;
  type?: string;
  source?: string;
  time?: Date;
  segments: Array<Segment>;
};
