export type Point = {
  lat: number;
  lon: number;
  time?: Date;
  asml?: number;
};

export type Track = {
  id?: string;
  filename?: string;
  name?: string;
  type?: string;
  source?: string;
  time?: Date;
  points: Point[];
};
