import { Client } from "colyseus.js";
import WebSocket from "ws";

// Node has no global WebSocket; colyseus.js uses it for the room socket.
globalThis.WebSocket = WebSocket;

const URL = "http://localhost:4000";
const TEXT = "hello from alice";

const clientA = new Client(URL);
const clientB = new Client(URL);

let resolveGot, rejectGot;
const got = new Promise((res, rej) => { resolveGot = res; rejectGot = rej; });
const timer = setTimeout(() => rejectGot(new Error("TIMEOUT: Bob never received Alice's message")), 8000);

const roomA = await clientA.joinOrCreate("island", { name: "Alice" });
const roomB = await clientB.joinOrCreate("island", { name: "Bob" });

roomB.state.messages.onAdd((msg) => {
  if (msg.name === "Alice" && msg.text === TEXT) {
    clearTimeout(timer);
    resolveGot({ name: msg.name, text: msg.text, ts: msg.ts });
  }
});

// Give B a tick to subscribe, then send.
await new Promise((r) => setTimeout(r, 300));
roomA.send("chat", { text: TEXT });

const m = await got;
console.log("RELAY OK -> received by Bob:", JSON.stringify(m));

// Backlog check: a freshly joined client should see the last message(s).
const clientC = new Client(URL);
const roomC = await clientC.joinOrCreate("island", { name: "Carol" });
const backlog = roomC.state.messages.map((x) => ({ name: x.name, text: x.text }));
console.log("BACKLOG for Carol:", JSON.stringify(backlog));

await roomA.leave();
await roomB.leave();
await roomC.leave();
process.exit(0);
