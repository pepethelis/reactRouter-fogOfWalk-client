export type Point = [number, number];

export type Track = {
  id?: string;
  filename?: string;
  name?: string;
  type?: string;
  source?: string;
  time?: Date;
  points: Point[];
};
