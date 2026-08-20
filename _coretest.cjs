const c = require("@colyseus/core");
console.log("core loaded OK; Server=", typeof c.Server, "Room=", typeof c.Room, "Client=", typeof c.Client);
const s = require("@colyseus/schema");
console.log("schema loaded OK; Schema=", typeof s.Schema, "ArraySchema=", typeof s.ArraySchema);
