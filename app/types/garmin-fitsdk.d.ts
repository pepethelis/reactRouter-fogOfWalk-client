declare module "@garmin/fitsdk" {
  export class Stream {
    static fromBuffer(buffer: Buffer): Stream;
    static fromUint8Array(uint8Array: Uint8Array): Stream;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Stream;
  }

  export class Decoder {
    constructor(stream: Stream);
    read(): {
      messages: {
        sessionMesgs?: Array<{
          startTime?: Date;
          sport?: string;
          [key: string]: any;
        }>;
        activityMesgs?: Array<{
          timestamp?: Date;
          [key: string]: any;
        }>;
        fileIdMesgs?: Array<{
          timeCreated?: Date;
          [key: string]: any;
        }>;
        recordMesgs?: Array<{
          positionLat?: number;
          positionLong?: number;
          [key: string]: any;
        }>;
        [key: string]: any;
      };
    };
  }
}
