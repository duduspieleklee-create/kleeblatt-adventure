import { Client } from "colyseus.js";

const URL = process.env.COLYSEUS_URL || "http://localhost:4000";
const connect = (name) => new Client(URL).joinOrCreate("island", { name });

// 1) Alice joins and posts a message -> creates backlog on the server.
const alice = await connect("Alice");
await new Promise((r) => setTimeout(r, 200));
alice.send("chat", { text: "backlog message one" });
await new Promise((r) => setTimeout(r, 400));

// 2) Bob joins LATE, registers handlers, requests history.
const bob = await connect("Bob");
let history = [];
bob.onMessage("chat", (m) => console.log("BOB live chat:", JSON.stringify(m)));
bob.onMessage("history", (list) => { history = list; console.log("BOB history:", list.length, "msgs"); });
bob.send("requestHistory");

await new Promise((r) => setTimeout(r, 600));

// 3) Live relay check: Carol joins, Alice sends, Carol receives.
const carol = await connect("Carol");
let live = null;
carol.onMessage("chat", (m) => { live = m; });
carol.onMessage("history", () => {});
carol.send("requestHistory");
await new Promise((r) => setTimeout(r, 200));
alice.send("chat", { text: "live message two" });
await new Promise((r) => setTimeout(r, 600));

let ok = true;
if (!(history.length >= 1 && history.some((m) => m.text === "backlog message one"))) {
  console.log("BACKLOG FAIL: history =", JSON.stringify(history));
  ok = false;
}
if (!(live && live.text === "live message two")) {
  console.log("LIVE FAIL: live =", JSON.stringify(live));
  ok = false;
}
console.log(ok ? "ALL OK" : "FAILED");
process.exit(ok ? 0 : 1);
