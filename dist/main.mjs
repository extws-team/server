import { a as parsePayload, i as buildPayload, r as OutcomePayloadSocketEvent, s as CHANNEL_BROADCAST, t as OutcomePayloadChannelEvent } from "./outcome-event-DERqO2eH.mjs";
import { NeoEvent, NeoEventTarget } from "neoevents";
import { customAlphabet } from "nanoid";
//#region src/event.ts
var ExtWSEvent = class extends NeoEvent {
	client;
	constructor(type, client, data) {
		super(type, data);
		this.client = client;
	}
};
//#endregion
//#region src/client.ts
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 16);
var ExtWSClient = class extends NeoEventTarget {
	data;
	id;
	server;
	url;
	headers;
	ip;
	stat = { ts_last_active: Date.now() };
	constructor(server, { url, headers, ip, data }) {
		super();
		this.id = nanoid();
		this.server = server;
		this.url = url;
		this.headers = headers;
		this.ip = ip;
		this.data = data;
	}
	join(group_id) {
		this._addToChannel("g-" + group_id);
	}
	/** @internal */
	_addToChannel(_channel_id) {
		throw new Error("Method \"addToChannel(channel_id)\" must be defined by ExtWSClient extension.");
	}
	leave(group_id) {
		this._removeFromChannel("g-" + group_id);
	}
	/** @internal */
	_removeFromChannel(_channel_id) {
		throw new Error("Method \"removeFromChannel(channel_id)\" must be defined by ExtWSClient extension.");
	}
	/** @internal */
	_sendPayload(_payload) {
		throw new Error("Method \"sendPayload(payload)\" must be defined by ExtWSClient extension.");
	}
	send(event_type_or_data, data) {
		this._sendPayload(buildPayload(4, event_type_or_data, data));
	}
	ping() {
		this._sendPayload(buildPayload(2));
	}
	is_disconnected = false;
	/**
	* Disconnects client.
	* @param _is_disconnected - If true, client is already disconnected from the Websocket server.
	*/
	disconnect(_is_disconnected = false) {
		if (this.is_disconnected === false) {
			const event = new ExtWSEvent("disconnect", this, void 0);
			this.dispatchEvent(event);
			this.server.dispatchEvent(event);
			this.is_disconnected = true;
			this.destroy();
		}
		this.server.clients.delete(this.id);
	}
};
//#endregion
//#region src/reserved-events.ts
const RESERVED_EVENT_TYPES = /* @__PURE__ */ new Set([
	"connect",
	"disconnect",
	"p.socket",
	"p.channel"
]);
//#endregion
//#region src/utils.ts
/**
* Validates a healthcheck timeout value.
* @param value Value to validate.
* @returns The validated timeout in seconds.
*/
function validateTimeout(value) {
	if (typeof value !== "number") throw new TypeError(`Healthcheck option must be a number.`);
	if (!Number.isFinite(value) || value < 0) throw new RangeError(`Healthcheck option must be a finite, non-negative number.`);
	return value;
}
/** Creates healthcheck object */
function createHealthcheck(idle_timeout) {
	idle_timeout = validateTimeout(idle_timeout ?? 60);
	const timeframe_ping_disconnect = 5;
	if (timeframe_ping_disconnect >= idle_timeout) throw new RangeError("Healthcheck option \"timeframe_ping_disconnect\" must be less than \"idle_timeout\".");
	const idle_timeout_disconnect_ms = idle_timeout * 1e3;
	const timeframe_ping_disconnect_ms = timeframe_ping_disconnect * 1e3;
	return {
		idle_timeout,
		timeframe_ping_disconnect,
		timeframe_ping_disconnect_ms,
		idle_timeout_disconnect_ms,
		idle_timeout_ping_ms: idle_timeout_disconnect_ms - timeframe_ping_disconnect_ms
	};
}
//#endregion
//#region src/main.ts
var ExtWS = class extends NeoEventTarget {
	clients = /* @__PURE__ */ new Map();
	has_adapter = false;
	healthcheck;
	clients_watch_timer;
	clients_watch_stopped = false;
	constructor({ idle_timeout } = {}) {
		super();
		this.healthcheck = createHealthcheck(idle_timeout);
		this._deferClientsWatch();
	}
	onConnect(client) {
		this.clients.set(client.id, client);
		client._addToChannel(CHANNEL_BROADCAST);
		client._sendPayload(buildPayload(1, {
			id: client.id,
			idle_timeout: this.healthcheck.idle_timeout
		}));
		const event = new ExtWSEvent("connect", client, void 0);
		client.dispatchEvent(event);
		this.dispatchEvent(event);
	}
	onMessage(client, payload) {
		if (Buffer.isBuffer(payload)) payload = payload.toString("utf8");
		client.stat.ts_last_active = Date.now();
		const { payload_type, event_type, data } = parsePayload(payload);
		switch (payload_type) {
			case 2:
				client._sendPayload(buildPayload(3));
				break;
			case 4: {
				if (event_type && RESERVED_EVENT_TYPES.has(event_type)) break;
				const event = new ExtWSEvent(event_type ?? "message", client, data);
				client.dispatchEvent(event);
				this.dispatchEvent(event);
				break;
			}
		}
	}
	sendToSocket(socket_id, arg1, arg2) {
		const client = this.clients.get(socket_id);
		if (client instanceof ExtWSClient) client.send(arg1, arg2);
		else if (this.has_adapter) this.dispatchEvent(new OutcomePayloadSocketEvent(socket_id, buildPayload(4, arg1, arg2)));
	}
	sendToGroup(group_id, arg1, arg2) {
		const channel_id = "g-" + group_id;
		const payload = buildPayload(4, arg1, arg2);
		this.publish(channel_id, payload);
		if (this.has_adapter) this.dispatchEvent(new OutcomePayloadChannelEvent(channel_id, payload));
	}
	broadcast(arg0, arg1) {
		const payload = buildPayload(4, arg0, arg1);
		this.publish(CHANNEL_BROADCAST, payload);
		if (this.has_adapter) this.dispatchEvent(new OutcomePayloadChannelEvent(CHANNEL_BROADCAST, payload));
	}
	/**
	* Sends a message to a specific group of clients. THis method should be implemented by WebSocket server implementation.
	* @param _channel_id -
	* @param _payload -
	*/
	publish(_channel_id, _payload) {
		throw new Error("Method not implemented.");
	}
	_deferClientsWatch() {
		if (this.clients_watch_stopped) return;
		this.clients_watch_timer = setTimeout(() => {
			this._pingSilentClients();
		}, this.healthcheck.idle_timeout_ping_ms);
	}
	_pingSilentClients() {
		const ts_now_ms = Date.now();
		for (const client of this.clients.values()) if (ts_now_ms - (client.stat.ts_last_active ?? 0) >= this.healthcheck.idle_timeout_ping_ms) client.ping();
		if (this.clients_watch_stopped) return;
		this.clients_watch_timer = setTimeout(() => {
			this._disconnectDeadClients();
		}, this.healthcheck.timeframe_ping_disconnect_ms);
	}
	stopClientsWatch() {
		this.clients_watch_stopped = true;
		if (this.clients_watch_timer !== void 0) {
			clearTimeout(this.clients_watch_timer);
			this.clients_watch_timer = void 0;
		}
	}
	_disconnectDeadClients() {
		const ts_now_ms = Date.now();
		for (const client of this.clients.values()) if (ts_now_ms - (client.stat.ts_last_active ?? 0) >= this.healthcheck.idle_timeout_disconnect_ms) client.disconnect();
		this._deferClientsWatch();
	}
	close() {
		throw new Error("Method not implemented.");
	}
};
//#endregion
export { ExtWS, ExtWSClient, ExtWSEvent };
