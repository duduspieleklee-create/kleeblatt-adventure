export interface WorldMap {
  id: string;
  name: string;
  mapId: string;
  width: number;
  height: number;
  tileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldMapTile {
  id: string;
  mapId: string;
  x: number;
  y: number;
  tilesetKey: string;
  tileIndex: number;
  layer: string;
  createdAt: Date;
}

export interface WorldEnemy {
  id: string;
  mapId: string;
  userId: string;
  enemyType: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  state: string;
  spawnPointX: number;
  spawnPointY: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldChest {
  id: string;
  mapId: string;
  x: number;
  y: number;
  chestId: string;
  itemTemplateId?: string;
  opened: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldNpcPosition {
  id: string;
  mapId: string;
  npcId: string;
  x: number;
  y: number;
  createdAt: Date;
  updatedAt: Date;
}