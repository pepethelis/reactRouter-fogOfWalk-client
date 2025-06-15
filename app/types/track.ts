export type Point = [number, number];

export type Track = {
  filename?: string;
  name?: string;
  type?: string;
  source?: string;
  time?: Date;
  points: Point[];
};
