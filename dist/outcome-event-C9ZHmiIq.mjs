import { NeoEvent } from "neoevents";
const IDLE_TIMEOUT_DISCONNECT_MS = 6e4;
const TIMEFRAME_PING_DISCONNECT_MS = 5e3;
const IDLE_TIMEOUT_PING_MS = 55e3;
const CHANNEL_BROADCAST = "broadcast";
const CHANNEL_GROUP_PREFIX = "g-";
//#endregion
//#region src/payload/types.ts
let PayloadType = /* @__PURE__ */ function(PayloadType) {
	PayloadType[PayloadType["ERROR"] = -1] = "ERROR";
	PayloadType[PayloadType["INIT"] = 1] = "INIT";
	PayloadType[PayloadType["PING"] = 2] = "PING";
	PayloadType[PayloadType["PONG"] = 3] = "PONG";
	PayloadType[PayloadType["MESSAGE"] = 4] = "MESSAGE";
	return PayloadType;
}({});
//#endregion
//#region src/payload/json.ts
const SHOULD_PRINT_ERRORS = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
/**
* Builds a payload.
* @param payload_type The type of the payload.
* @param argument1 (Optional) Event type or payload data.
* @param argument2 (Optional) Payload data.
* @returns -
*/
function buildPayload(payload_type, argument1, argument2) {
	let payload = String(payload_type);
	let event_type;
	let data;
	if (void 0 === argument2 && typeof argument1 !== "string") {
		data = argument1;
		event_type = void 0;
	} else if (typeof argument1 === "string") {
		data = argument2;
		event_type = argument1;
	}
	if (event_type) payload += event_type;
	if (data) payload += JSON.stringify(data);
	return payload;
}
const JSON_START = /* @__PURE__ */ new Set(["[", "{"]);
const textDecoder = new TextDecoder();
/**
* Check if the value is a typed array.
* @param value - The value to check.
* @returns - Whether the value is a typed array.
*/
function isTypedArray(value) {
	return value instanceof Int8Array || value instanceof Int16Array || value instanceof Int32Array || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Uint16Array || value instanceof Uint32Array || value instanceof Float32Array || value instanceof Float64Array || value instanceof BigInt64Array;
}
/**
* Parse payload
* @param payload The payload to parse.
* @returns The parsed payload.
*/
function parsePayload(payload) {
	if (typeof payload === "string") {} else if (payload instanceof ArrayBuffer || isTypedArray(payload)) payload = textDecoder.decode(payload);
	else if (Array.isArray(payload)) payload = Buffer.concat(payload).toString();
	else throw new TypeError("Invalid payload type.");
	const result = { payload_type: (payload.codePointAt(0) ?? 48) - 48 };
	let start = 1;
	let event_type = "";
	for (let index = start; index < payload.length && !JSON_START.has(payload[index]); index++) {
		event_type += payload[index];
		start++;
	}
	if (event_type.length > 31) {
		if (SHOULD_PRINT_ERRORS) console.error(`Event type cannot be longer than 31 characters, received "${event_type}"`);
		return { payload_type: -1 };
	}
	if (event_type.length > 0) result.event_type = event_type;
	if (start < payload.length) {
		const payload_raw = payload.slice(start);
		try {
			result.data = JSON.parse(payload_raw);
		} catch {
			if (SHOULD_PRINT_ERRORS) console.error(`Cannot parse payload "${payload_raw}": invalid JSON`);
			return { payload_type: -1 };
		}
	}
	return result;
}
//#endregion
//#region src/payload/outcome-event.ts
let OutcomePayloadEventType = /* @__PURE__ */ function(OutcomePayloadEventType) {
	OutcomePayloadEventType["SOCKET"] = "p.socket";
	OutcomePayloadEventType["CHANNEL"] = "p.channel";
	return OutcomePayloadEventType;
}({});
var OutcomePayloadSocketEvent = class extends NeoEvent {
	socket_id;
	constructor(socket_id, payload) {
		super("p.socket", payload);
		this.socket_id = socket_id;
	}
};
var OutcomePayloadChannelEvent = class extends NeoEvent {
	channel_id;
	constructor(channel_id, payload) {
		super("p.channel", payload);
		this.channel_id = channel_id;
	}
};
//#endregion
export { parsePayload as a, CHANNEL_GROUP_PREFIX as c, TIMEFRAME_PING_DISCONNECT_MS as d, buildPayload as i, IDLE_TIMEOUT_DISCONNECT_MS as l, OutcomePayloadEventType as n, PayloadType as o, OutcomePayloadSocketEvent as r, CHANNEL_BROADCAST as s, OutcomePayloadChannelEvent as t, IDLE_TIMEOUT_PING_MS as u };
