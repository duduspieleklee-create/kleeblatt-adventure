import { Schema, ArraySchema, type } from "@colyseus/schema";

/**
 * A single chat message broadcast within an island room.
 */
export class ChatMessage extends Schema {
  @type("string")
  sessionId = "";

  @type("string")
  name = "";

  @type("string")
  text = "";

  @type("number")
  ts = 0;
}

/**
 * Authoritative Colyseus room state for an island room.
 * Single source of truth for both the API (server) and the web (client).
 */
export class IslandRoomState extends Schema {
  @type([ChatMessage])
  messages = new ArraySchema<ChatMessage>();
}
