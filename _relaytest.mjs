import { Client } from "colyseus.js";

const URL = "ws://localhost:4000";
const clientA = new Client(URL);
const clientB = new Client(URL);

let done = false;
function finish(ok, msg) {
  if (done) return;
  done = true;
  console.log(ok ? "RELAY_OK" : "RELAY_FAIL", "-", msg);
  process.exit(ok ? 0 : 1);
}

const roomA = await clientA.joinOrCreate("island", { name: "Alice" });
const roomB = await clientB.joinOrCreate("island", { name: "Bob" });
console.log("joined room", roomA.roomId, "same?", roomA.roomId === roomB.roomId);
console.log("B.state type:", typeof roomB.state, "has messages:", roomB.state && "messages" in roomB.state);

roomB.onStateChange((state) => {
  const msgs = state && state.messages;
  console.log("STATE_CHANGE B: messages=", msgs ? "len=" + msgs.length : "undefined",
    "first=", msgs && msgs.length ? JSON.stringify({ name: msgs[0].name, text: msgs[0].text }) : null);
  if (msgs && msgs.length) {
    const last = msgs[msgs.length - 1];
    if (last.text === "hi from alice") finish(true, "relay rcvd");
  }
});

setTimeout(() => roomA.send("chat", { text: "hi from alice" }), 500);
setTimeout(() => finish(false, "timeout"), 5000);
