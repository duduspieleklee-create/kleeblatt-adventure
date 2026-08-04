export default class Building {
  scene: Phaser.Scene;
  image: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  name: string;
  isCollidable: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    name: string,
  ) {
    this.scene = scene;
    this.name = name;
    this.isCollidable = false;

    this.image = scene.add.image(x, y, textureKey);
    scene.physics.add.existing(this.image);

    this.label = scene.add.text(x, y - 30, name, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.label.setOrigin(0.5, 1);
  }

  setCollision() {
    this.isCollidable = true;
    return this;
  }

  setPosition(x: number, y: number) {
    this.image.setPosition(x, y);
    this.label.setPosition(x, y - 30);
  }

  setScale(x: number, y: number) {
    this.image.setScale(x, y);
  }

  setLabel(text: string) {
    this.name = text;
    this.label.setText(text);
  }

  setLabelStyle(style: Phaser.Types.GameObjects.Text.TextStyle) {
    this.label.setStyle(style);
  }

  getBody(): Phaser.GameObjects.Image {
    return this.image;
  }

  destroy() {
    this.image.destroy();
    this.label.destroy();
  }
}