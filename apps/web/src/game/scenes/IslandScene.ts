import Phaser from "phaser";
import { NPC } from "../objects/NPC";
import { SunnysidePlayer } from "../objects/SunnysidePlayer";
import {
  loadIslandMap,
  getNpcSpawns,
  getPlayerSpawn,
  MAP_DEPTH,
} from "../maps/MapLoader";
import { KeyboardInputManager } from "../input/KeyboardInputManager";
import { InputEvents } from "../input/InputEvents";
import { gameBridge } from "@kleeblatt/shared";

/**
 * Core island world (ported from kleeblock).
 * Quests / dialog managers / pointer follow in later commits.
 */
export class IslandScene extends Phaser.Scene {
  private player!: SunnysidePlayer;
  private npcGroup!: Phaser.Physics.Arcade.StaticGroup;
  private map!: Phaser.Tilemaps.Tilemap;
  private collisionLayer!: Phaser.Tilemaps.TilemapLayer;
  private inputManager?: KeyboardInputManager;

  constructor() {
    super({ key: "IslandScene" });
  }

  create(): void {
    const loaded = loadIslandMap(this);
    if (!loaded) {
      console.error("[IslandScene] Map setup failed");
      this.add
        .text(this.scale.width / 2, this.scale.height / 2, "Map load failed", {
          color: "#ff6b6b",
          fontSize: "18px",
        })
        .setOrigin(0.5);
      return;
    }

    this.map = loaded.map;
    this.collisionLayer = loaded.layers.collision;

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.setupPlayer();
    this.setupNPCs();
    this.setupCamera();
    this.setupInput();

    this.events.on(Phaser.Scenes.Events.UPDATE, this.updateDepth, this);
    this.events.on(InputEvents.INTERACT, this.onInteract, this);

    gameBridge.emit("scene:loaded", { scene: "IslandScene" });

    if (import.meta.env.DEV) {
      console.log("[IslandScene] ready — WASD/arrows to move, E to interact");
    }
  }

  private setupPlayer(): void {
    const spawn = getPlayerSpawn(this.map);
    const x = spawn?.x ?? 160;
    const y = spawn?.y ?? 180;

    this.player = new SunnysidePlayer(this, x, y);
    this.player.setDepth(MAP_DEPTH.ENTITIES);
    this.physics.add.collider(this.player, this.collisionLayer);
  }

  private setupNPCs(): void {
    this.npcGroup = this.physics.add.staticGroup();

    const npcSpawns = getNpcSpawns(this.map);
    const list =
      npcSpawns.length > 0
        ? npcSpawns.map((obj) => ({
            x: obj.x,
            y: obj.y,
            dialogueId:
              (typeof obj.properties.dialogueId === "string"
                ? obj.properties.dialogueId
                : null) ||
              obj.name ||
              "unknown",
          }))
        : [
            { x: 160, y: 120, dialogueId: "welcome_npc" },
            { x: 200, y: 180, dialogueId: "vibes_npc" },
          ];

    for (const data of list) {
      const npc = new NPC(this, data.x, data.y, data.dialogueId);
      npc.setDepth(MAP_DEPTH.ENTITIES);
      this.npcGroup.add(npc);
    }

    this.physics.add.collider(this.npcGroup, this.collisionLayer);
    this.physics.add.collider(this.player, this.npcGroup);
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setZoom(2);
    cam.setRoundPixels(true);
  }

  private setupInput(): void {
    this.inputManager = new KeyboardInputManager(this, this.player, 80);
  }

  private onInteract(): void {
    const npcs = this.npcGroup.getChildren() as NPC[];
    let nearest: NPC | null = null;
    let best = 40;

    for (const npc of npcs) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (d < best) {
        best = d;
        nearest = npc;
      }
    }

    if (!nearest) return;

    const dialogues = this.cache.json.get("dialogues") as
      | Record<string, { sequence: string[] }>
      | undefined;
    const sequence = dialogues?.[nearest.dialogueId]?.sequence ?? [
      `(${nearest.dialogueId})`,
    ];

    // Temporary in-world toast until DialogBox / UIScene is ported
    const text = sequence[0] ?? "…";
    const toast = this.add
      .text(this.player.x, this.player.y - 36, text, {
        fontSize: "10px",
        color: "#fff",
        backgroundColor: "#000000aa",
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.time.delayedCall(2200, () => toast.destroy());

    gameBridge.emit("dialog:start", {
      npcId: nearest.dialogueId,
      dialogueId: nearest.dialogueId,
      lines: sequence,
    });
  }

  private updateDepth = (): void => {
    this.player.setDepth(MAP_DEPTH.ENTITIES + this.player.y * 0.01);
    this.npcGroup.getChildren().forEach((child) => {
      const sprite = child as Phaser.GameObjects.Sprite;
      sprite.setDepth(MAP_DEPTH.ENTITIES + sprite.y * 0.01);
    });
  };

  update(): void {
    if (!this.inputManager || !this.player) return;
    const result = this.inputManager.update();
    this.player.applyMovementResult(result);
  }

  shutdown(): void {
    this.inputManager?.shutdown();
    this.events.off(Phaser.Scenes.Events.UPDATE, this.updateDepth, this);
    this.events.off(InputEvents.INTERACT, this.onInteract, this);
  }
}
