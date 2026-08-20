import { IslandRoomState, ChatMessage } from "@kleeblatt/shared";

const s = new IslandRoomState();
const m = new ChatMessage();
m.sessionId = "abc";
m.name = "Alice";
m.text = "hi from alice";
m.ts = Date.now();
s.messages.push(m);
console.log("toJSON:", JSON.stringify(s.toJSON()));
console.log("messages len:", s.messages.length, "first text:", s.messages[0] && s.messages[0].text);
