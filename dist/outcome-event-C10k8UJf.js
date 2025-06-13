import { NeoEvent } from "neoevents";

//#region src/consts.ts
const IDLE_TIMEOUT = 60;
const TIMEFRAME_PING_DISCONNECT = 5;
const IDLE_TIMEOUT_DISCONNECT_MS = IDLE_TIMEOUT * 1e3;
const TIMEFRAME_PING_DISCONNECT_MS = TIMEFRAME_PING_DISCONNECT * 1e3;
const IDLE_TIMEOUT_PING_MS = IDLE_TIMEOUT_DISCONNECT_MS - TIMEFRAME_PING_DISCONNECT_MS;
const CHANNEL_BROADCAST = "broadcast";
const CHANNEL_GROUP_PREFIX = "g-";

//#endregion
//#region src/payload/types.ts
let PayloadType = /* @__PURE__ */ function(PayloadType$1) {
	PayloadType$1[PayloadType$1["ERROR"] = -1] = "ERROR";
	PayloadType$1[PayloadType$1["INIT"] = 1] = "INIT";
	PayloadType$1[PayloadType$1["PING"] = 2] = "PING";
	PayloadType$1[PayloadType$1["PONG"] = 3] = "PONG";
	PayloadType$1[PayloadType$1["MESSAGE"] = 4] = "MESSAGE";
	return PayloadType$1;
}({});

//#endregion
//#region src/payload/json.ts
const PRINT_ERRORS = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
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
const JSON_START = new Set(["[", "{"]);
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
	for (let index = start; index < payload.length && JSON_START.has(payload[index]) === false; index++) {
		event_type += payload[index];
		start++;
	}
	if (event_type.length > 31) {
		if (PRINT_ERRORS) console.error(`Event type cannot be longer than 31 characters, received "${event_type}"`);
		return { payload_type: PayloadType.ERROR };
	}
	if (event_type.length > 0) result.event_type = event_type;
	if (start < payload.length) {
		const payload_raw = payload.slice(start);
		try {
			result.data = JSON.parse(payload_raw);
		} catch {
			if (PRINT_ERRORS) console.error(`Cannot parse payload "${payload_raw}": invalid JSON`);
			return { payload_type: PayloadType.ERROR };
		}
	}
	return result;
}

//#endregion
//#region src/payload/outcome-event.ts
let OutcomePayloadEventType = /* @__PURE__ */ function(OutcomePayloadEventType$1) {
	OutcomePayloadEventType$1["SOCKET"] = "p.socket";
	OutcomePayloadEventType$1["CHANNEL"] = "p.channel";
	return OutcomePayloadEventType$1;
}({});
var OutcomePayloadSocketEvent = class extends NeoEvent {
	constructor(socket_id, payload) {
		super(OutcomePayloadEventType.SOCKET, payload);
		this.socket_id = socket_id;
	}
};
var OutcomePayloadChannelEvent = class extends NeoEvent {
	constructor(channel_id, payload) {
		super(OutcomePayloadEventType.CHANNEL, payload);
		this.channel_id = channel_id;
	}
};

//#endregion
export { CHANNEL_BROADCAST, CHANNEL_GROUP_PREFIX, IDLE_TIMEOUT, IDLE_TIMEOUT_DISCONNECT_MS, IDLE_TIMEOUT_PING_MS, OutcomePayloadChannelEvent as OutcomePayloadChannelEvent$1, OutcomePayloadEventType as OutcomePayloadEventType$1, OutcomePayloadSocketEvent as OutcomePayloadSocketEvent$1, PayloadType as PayloadType$1, TIMEFRAME_PING_DISCONNECT_MS, buildPayload, parsePayload };