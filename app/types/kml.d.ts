interface IKmlPlacemark {
  name?: string;
  description?: string;
  LineString?: IKmlLinering;
  MultiTrack?: IKmlMultiTrack;
}

interface IKmlLinering {
    coordinates: string;
}

interface IKmlMultiTrack {
  altitudeMode: string;
  interpolate: string;
  Track: IKmlTrack[];
}

interface IKmlTrack {
  when: Date[];
  coord: string[];
}
