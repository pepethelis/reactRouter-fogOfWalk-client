export interface TileKey {
  x: number;
  y: number;
  z: number;
}

export interface TileData {
  key: TileKey;
  points: Array<{
    lat: number;
    lng: number;
    trackIndex: number;
    segmentIndex: number;
    pointIndex: number;
  }>;
}

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom: number;
}

export class TileSystem {
  static latLngToTile(lat: number, lng: number, zoom: number): TileKey {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const y = Math.floor(
      ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n
    );
    return { x, y, z: zoom };
  }

  static tileToBounds(tile: TileKey): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    const n = Math.pow(2, tile.z);
    const west = (tile.x / n) * 360 - 180;
    const east = ((tile.x + 1) / n) * 360 - 180;
    const north =
      Math.atan(Math.sinh(Math.PI * (1 - (2 * tile.y) / n))) * (180 / Math.PI);
    const south =
      Math.atan(Math.sinh(Math.PI * (1 - (2 * (tile.y + 1)) / n))) *
      (180 / Math.PI);

    return { north, south, east, west };
  }

  // Get tiles that intersect with the given bounds
  static getTilesInBounds(
    bounds: ViewportBounds,
    buffer: number = 1
  ): TileKey[] {
    const tiles: TileKey[] = [];
    const zoom = Math.floor(bounds.zoom);

    const topLeft = this.latLngToTile(bounds.north, bounds.west, zoom);
    const bottomRight = this.latLngToTile(bounds.south, bounds.east, zoom);

    // Add buffer tiles around the viewport
    const minX = Math.max(0, topLeft.x - buffer);
    const maxX = Math.min(Math.pow(2, zoom) - 1, bottomRight.x + buffer);
    const minY = Math.max(0, topLeft.y - buffer);
    const maxY = Math.min(Math.pow(2, zoom) - 1, bottomRight.y + buffer);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }

    return tiles;
  }

  // Create a unique string key for a tile
  static tileToKey(tile: TileKey): string {
    return `${tile.z}-${tile.x}-${tile.y}`;
  }

  // Parse a tile key string back to TileKey
  static keyToTile(key: string): TileKey {
    const [z, x, y] = key.split("-").map(Number);
    return { x, y, z };
  }
}
