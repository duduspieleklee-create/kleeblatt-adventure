import Phaser from "phaser";

export function isPointWalkable(
  map: Phaser.Tilemaps.Tilemap,
  collisionLayer: Phaser.Tilemaps.TilemapLayer,
  worldX: number,
  worldY: number,
): boolean {
  if (
    worldX < 0 ||
    worldY < 0 ||
    worldX >= map.widthInPixels ||
    worldY >= map.heightInPixels
  ) {
    return false;
  }

  const tile = collisionLayer.getTileAtWorldXY(worldX, worldY, true);
  if (!tile || tile.index === -1) return true;
  return !tile.collides;
}

export function isFootprintWalkable(
  map: Phaser.Tilemaps.Tilemap,
  collisionLayer: Phaser.Tilemaps.TilemapLayer,
  worldX: number,
  worldY: number,
  halfW = 5,
  halfH = 4,
): boolean {
  const samples: Array<[number, number]> = [
    [0, 0],
    [-halfW, 0],
    [halfW, 0],
    [0, -halfH],
    [0, halfH],
    [-halfW, -halfH],
    [halfW, -halfH],
    [-halfW, halfH],
    [halfW, halfH],
  ];

  return samples.every(([dx, dy]) =>
    isPointWalkable(map, collisionLayer, worldX + dx, worldY + dy),
  );
}
