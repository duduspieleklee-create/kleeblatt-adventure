/**
 * MultiplayerManager — client-side glue to the Colyseus "island" room.
 *
 * Design goals:
 *  - Resilient: a failed/absent Colyseus server must NEVER throw into the
 *    caller or crash the Phaser game loop. All network calls are async and
 *    guarded; connection failures degrade to "offline" silently.
 *  - Chat relay: incoming room messages are forwarded to the existing
 *    cross-layer `gameBridge` as "chat:message" events; outgoing chat is
 *    sent via `sendChat` and no-ops when not connected.
 *  - No Phaser/DOM imports here so the class stays unit-testable.
 */

import { Client, type Room } from "colyseus.js";
import { gameBridge } from "@kleeblatt/shared";

export const COLYSEUS_DEFAULT_URL = "http://localhost:4000";
export const ISLAND_ROOM_NAME = "island";

export class MultiplayerManager {
  private client: Client;
  private room?: Room;
  connected = false;

  constructor(
    url: string = import.meta.env.VITE_COLYSEUS_URL ?? COLYSEUS_DEFAULT_URL,
  ) {
    this.client = new Client(url);
  }

  /**
   * Join (or create) the island room. Never throws — on any failure the
   * manager simply stays disconnected and the game continues offline.
   */
  async connect(name: string): Promise<void> {
    try {
      this.room = await this.client.joinOrCreate(ISLAND_ROOM_NAME, { name });
      this.connected = true;

      // onAdd fires for the live backlog too, so late joiners receive history.
      this.room.state.messages.onAdd((msg: { name: string; text: string; ts: number }, _i: number) => {
        gameBridge.emit("chat:message", { name: msg.name, text: msg.text, ts: msg.ts });
      });

      this.room.onLeave((code) => {
        console.warn(`[MultiplayerManager] left island room (code ${code})`);
        this.connected = false;
      });

      this.room.onError((code, message) => {
        console.warn(`[MultiplayerManager] island room error (${code}): ${message ?? ""}`);
        this.connected = false;
      });
    } catch (err) {
      console.warn(
        "[MultiplayerManager] could not connect to Colyseus — running offline",
        err,
      );
      this.connected = false;
    }
  }

  /** Send a chat message. No-ops when not connected. */
  sendChat(text: string): void {
    if (this.room && this.connected) {
      this.room.send("chat", { text });
    }
  }

  /** Leave the room and drop the reference. Safe to call when never connected. */
  disconnect(): void {
    this.room?.leave();
    this.room = undefined;
    this.connected = false;
  }
}
