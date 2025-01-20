var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/main.ts
var exports_main = {};
__export(exports_main, {
  ExtWSEvent: () => ExtWSEvent,
  ExtWSClient: () => ExtWSClient,
  ExtWS: () => ExtWS
});
module.exports = __toCommonJS(exports_main);
var import_neoevents4 = require("neoevents");

// src/consts.ts
var IDLE_TIMEOUT = 60;
var TIMEFRAME_PING_DISCONNECT = 5;
var IDLE_TIMEOUT_DISCONNECT_MS = IDLE_TIMEOUT * 1000;
var TIMEFRAME_PING_DISCONNECT_MS = TIMEFRAME_PING_DISCONNECT * 1000;
var IDLE_TIMEOUT_PING_MS = IDLE_TIMEOUT_DISCONNECT_MS - TIMEFRAME_PING_DISCONNECT_MS;
var GROUP_BROADCAST = "broadcast";
var GROUP_PREFIX = "g-";

// src/client.ts
var import_neoevents2 = require("neoevents");
var import_nanoid = require("nanoid");

// src/event.ts
var import_neoevents = require("neoevents");

class ExtWSEvent extends import_neoevents.NeoEvent {
  client;
  constructor(type, client, data) {
    super(type, data);
    this.client = client;
  }
}

// src/payload/json.ts
var PRINT_ERRORS = true;
function buildPayload(payload_type, argument1, argument2) {
  let payload = String(payload_type);
  let event_type;
  let data;
  if (argument2 === undefined && typeof argument1 !== "string") {
    data = argument1;
    event_type = undefined;
  } else if (typeof argument1 === "string") {
    data = argument2;
    event_type = argument1;
  }
  if (event_type) {
    payload += event_type;
  }
  if (data) {
    payload += JSON.stringify(data);
  }
  return payload;
}
var JSON_START = new Set(["[", "{"]);
var textDecoder = new TextDecoder;
function isTypedArray(value) {
  return value instanceof Int8Array || value instanceof Int16Array || value instanceof Int32Array || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Uint16Array || value instanceof Uint32Array || value instanceof Float32Array || value instanceof Float64Array || value instanceof BigInt64Array;
}
function parsePayload(payload) {
  if (typeof payload === "string") {
  } else if (payload instanceof ArrayBuffer || isTypedArray(payload)) {
    payload = textDecoder.decode(payload);
  } else if (Array.isArray(payload)) {
    payload = Buffer.concat(payload).toString();
  } else {
    throw new TypeError("Invalid payload type.");
  }
  const result = {
    payload_type: (payload.codePointAt(0) ?? 48) - 48
  };
  let start = 1;
  let event_type = "";
  for (let index = start;index < payload.length && JSON_START.has(payload[index]) === false; index++) {
    event_type += payload[index];
    start++;
  }
  if (event_type.length > 31) {
    if (PRINT_ERRORS) {
      console.error(`Event type cannot be longer than 31 characters, received "${event_type}"`);
    }
    return {
      payload_type: -1 /* ERROR */
    };
  }
  if (event_type.length > 0) {
    result.event_type = event_type;
  }
  if (start < payload.length) {
    const payload_raw = payload.slice(start);
    try {
      result.data = JSON.parse(payload_raw);
    } catch {
      if (PRINT_ERRORS) {
        console.error(`Cannot parse payload "${payload_raw}": invalid JSON`);
      }
      return {
        payload_type: -1 /* ERROR */
      };
    }
  }
  return result;
}

// src/client.ts
var nanoid = import_nanoid.customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 16);

class ExtWSClient extends import_neoevents2.NeoEventTarget {
  id;
  server;
  url;
  headers;
  ip;
  stat = {
    ts_last_active: Date.now()
  };
  constructor(server, {
    url,
    headers,
    ip
  }) {
    super();
    this.id = nanoid();
    this.server = server;
    this.url = url;
    this.headers = headers;
    this.ip = ip;
  }
  join(group_id) {
    this.addToGroup(GROUP_PREFIX + group_id);
  }
  addToGroup(_group_id) {
    throw new Error('Method "addToGroup(group_id)" must be defined by ExtWSClient extension.');
  }
  leave(group_id) {
    this.removeFromGroup(GROUP_PREFIX + group_id);
  }
  removeFromGroup(_group_id) {
    throw new Error('Method "removeFromGroup(group_id)" must be defined by ExtWSClient extension.');
  }
  sendPayload(_payload) {
    throw new Error('Method "sendPayload(payload)" must be defined by ExtWSClient extension.');
  }
  send(arg0, arg1) {
    this.sendPayload(buildPayload(4 /* MESSAGE */, arg0, arg1));
  }
  ping() {
    this.sendPayload(buildPayload(2 /* PING */));
  }
  is_disconnected = false;
  disconnect(_is_disconnected = false) {
    if (this.is_disconnected === false) {
      const event = new ExtWSEvent("disconnect", this, undefined);
      this.dispatchEvent(event);
      this.server.dispatchEvent(event);
      this.is_disconnected = true;
      this.destroy();
    }
    this.server.clients.delete(this.id);
  }
}

// src/payload/outcome-event.ts
var import_neoevents3 = require("neoevents");
var EVENT_TYPE_SOCKET = "p.socket";
var EVENT_TYPE_GROUP = "p.group";
var EVENT_TYPE_BROADCAST = "p.broadcast";
var OutcomePayloadEventType;
((OutcomePayloadEventType2) => {
  OutcomePayloadEventType2[OutcomePayloadEventType2["SOCKET"] = EVENT_TYPE_SOCKET] = "SOCKET";
  OutcomePayloadEventType2[OutcomePayloadEventType2["GROUP"] = EVENT_TYPE_GROUP] = "GROUP";
  OutcomePayloadEventType2[OutcomePayloadEventType2["BROADCAST"] = EVENT_TYPE_BROADCAST] = "BROADCAST";
})(OutcomePayloadEventType ||= {});

class OutcomePayloadSocketEvent extends import_neoevents3.NeoEvent {
  socket_id;
  constructor(socket_id, payload) {
    super(OutcomePayloadEventType.SOCKET, payload);
    this.socket_id = socket_id;
  }
}

class OutcomePayloadGroupEvent extends import_neoevents3.NeoEvent {
  group_id;
  constructor(group_id, payload) {
    super(OutcomePayloadEventType.GROUP, payload);
    this.group_id = group_id;
  }
}

class OutcomePayloadBroadcastEvent extends import_neoevents3.NeoEvent {
  constructor(payload) {
    super(OutcomePayloadEventType.BROADCAST, payload);
  }
}

// src/main.ts
class ExtWS extends import_neoevents4.NeoEventTarget {
  clients = new Map;
  has_adapter = false;
  constructor() {
    super();
    this.deferClientsWatch();
  }
  onConnect(client) {
    this.clients.set(client.id, client);
    client.addToGroup(GROUP_BROADCAST);
    client.sendPayload(buildPayload(1 /* INIT */, {
      id: client.id,
      idle_timeout: IDLE_TIMEOUT
    }));
    const event = new ExtWSEvent("connect", client, undefined);
    client.dispatchEvent(event);
    this.dispatchEvent(event);
  }
  onMessage(client, payload) {
    if (Buffer.isBuffer(payload)) {
      payload = payload.toString("utf8");
    }
    client.stat.ts_last_active = Date.now();
    const {
      payload_type,
      event_type,
      data
    } = parsePayload(payload);
    switch (payload_type) {
      case 2 /* PING */:
        client.sendPayload(buildPayload(3 /* PONG */));
        break;
      case 4 /* MESSAGE */:
        {
          const event = new ExtWSEvent(event_type ?? "message", client, data);
          client.dispatchEvent(event);
          this.dispatchEvent(event);
        }
        break;
    }
  }
  sendToSocket(socket_id, arg1, arg2) {
    const client = this.clients.get(socket_id);
    if (client instanceof ExtWSClient) {
      client.send(arg1, arg2);
    } else if (this.has_adapter) {
      this.dispatchEvent(new OutcomePayloadSocketEvent(socket_id, buildPayload(4 /* MESSAGE */, arg1, arg2)));
    }
  }
  sendToGroup(group_id, arg1, arg2) {
    const payload = buildPayload(4 /* MESSAGE */, arg1, arg2);
    this.publish(`${GROUP_PREFIX}${group_id}`, payload);
    if (this.has_adapter) {
      this.dispatchEvent(new OutcomePayloadGroupEvent(group_id, payload));
    }
  }
  broadcast(arg0, arg1) {
    const payload = buildPayload(4 /* MESSAGE */, arg0, arg1);
    this.publish(GROUP_BROADCAST, payload);
    if (this.has_adapter) {
      this.dispatchEvent(new OutcomePayloadBroadcastEvent(payload));
    }
  }
  publish(_channel, _payload) {
    throw new Error("Method not implemented.");
  }
  deferClientsWatch() {
    setTimeout(() => {
      this.pingSilentClients();
    }, IDLE_TIMEOUT_PING_MS);
  }
  pingSilentClients() {
    const ts_now_ms = Date.now();
    for (const client of this.clients.values()) {
      const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);
      if (idle_ms >= IDLE_TIMEOUT_PING_MS) {
        client.ping();
      }
    }
    setTimeout(() => {
      this.disconnectDeadClients();
    }, TIMEFRAME_PING_DISCONNECT_MS);
  }
  disconnectDeadClients() {
    const ts_now_ms = Date.now();
    for (const client of this.clients.values()) {
      const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);
      if (idle_ms >= IDLE_TIMEOUT_DISCONNECT_MS) {
        client.disconnect();
      }
    }
    this.deferClientsWatch();
  }
  close() {
    throw new Error("Method not implemented.");
  }
}
