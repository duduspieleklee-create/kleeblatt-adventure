export const InputEvents = {
  INTERACT: "input:interact",
  INTERACT_TARGET: "input:interactTarget",
  OPEN_QUESTBOOK: "input:openQuestbook",
  CANCEL: "input:cancel",
} as const;

export const QuestEvents = {
  UPDATE: "quest:update",
  PROGRESS_CHANGED: "quest:progressChanged",
  COMPLETED: "quest:completed",
} as const;

export const ItemEvents = {
  COLLECTED: "item:collected",
} as const;

export type InteractTargetPayload = {
  targetId: string;
  x: number;
  y: number;
};
