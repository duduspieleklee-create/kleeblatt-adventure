export interface BuildingOptions {
  color: number;
  roofColor: number;
  width?: number;
  height?: number;
}

/**
 * Gebäude werden komplett mit Graphics gezeichnet (Wand + Dach + Tür).
 * Früher wurde der GANZE Tileset-Atlas (640×640px) als Sprite verwendet –
 * das ergab schwebende Atlas-Kollagen und eine unsichtbare 640×640px-Kollision.
 */
export default class Building {
  scene: Phaser.Scene;
  image: Phaser.GameObjects.GameObject;
  label: Phaser.GameObjects.Text;
  name: string;
  isCollidable: boolean;

  private visuals!: Phaser.GameObjects.Graphics;
  private footprint: Phaser.GameObjects.Rectangle | null = null;
  private readonly width: number;
  private readonly height: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    options?: Partial<BuildingOptions>,
  ) {
    this.scene = scene;
    this.name = name;
    this.isCollidable = false;
    this.width = options?.width ?? 56;
    this.height = options?.height ?? 48;

    this.visuals = scene.add.graphics();
    this.draw(options?.color ?? 0x8b7355, options?.roofColor ?? 0x6b4f12);
    this.visuals.setPosition(x, y);
    this.visuals.setDepth(1);
    this.image = this.visuals;

    this.label = scene.add.text(x, y - this.height / 2 - 14, name, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.label.setOrigin(0.5, 1);
    this.label.setDepth(2);
  }

  private draw(color: number, roofColor: number): void {
    const g = this.visuals;
    const w = this.width;
    const h = this.height;
    g.fillStyle(color, 1);
    g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle(roofColor, 1);
    g.fillTriangle(-w / 2 - 5, -h / 2, w / 2 + 5, -h / 2, 0, -h / 2 - 26);
    g.fillStyle(0x3a2a0a, 1);
    g.fillRect(-4, h / 2 - 14, 8, 14);
  }

  setCollision() {
    this.isCollidable = true;
    const rect = this.scene.add.rectangle(
      this.visuals.x,
      this.visuals.y,
      this.width,
      this.height,
      0xffffff,
      0,
    );
    this.scene.physics.add.existing(rect);
    (rect.body as Phaser.Physics.Arcade.StaticBody).setSize(this.width, this.height);
    this.footprint = rect;
    return this;
  }

  setPosition(x: number, y: number) {
    this.visuals.setPosition(x, y);
    this.footprint?.setPosition(x, y);
    this.label.setPosition(x, y - this.height / 2 - 14);
  }

  setScale(x: number, y: number) {
    this.visuals.setScale(x, y);
  }

  setLabel(text: string) {
    this.name = text;
    this.label.setText(text);
  }

  setLabelStyle(style: Phaser.Types.GameObjects.Text.TextStyle) {
    this.label.setStyle(style);
  }

  getBody(): Phaser.GameObjects.GameObject {
    return this.footprint ?? this.visuals;
  }

  destroy() {
    this.visuals.destroy();
    this.footprint?.destroy();
    this.label.destroy();
  }
}
