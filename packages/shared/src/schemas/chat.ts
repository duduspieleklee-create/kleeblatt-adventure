/**
 * Shared chat types for the island room.
 *
 * Chat is relayed via Colyseus message-passing (onMessage/broadcast), so it
 * does NOT depend on @colyseus/schema. This keeps the proof robust against the
 * schema-version skew between @colyseus/core@0.16.x and modern @colyseus/schema.
 * Player/sync state can be added later with a pinned schema version.
 */

export interface ChatMessage {
  sessionId: string;
  name: string;
  text: string;
  ts: number;
}
