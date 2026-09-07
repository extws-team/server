import { a as parsePayload, i as buildPayload, r as OutcomePayloadSocketEvent, s as CHANNEL_BROADCAST, t as OutcomePayloadChannelEvent } from "./outcome-event-CpX-1fLz.mjs";
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
/** Returns the data whose presence is enforced by ClientOptions. */
function getClientData(options) {
	return options.data;
}
var ExtWSClient = class extends NeoEventTarget {
	id;
	server;
	url;
	headers;
	ip;
	data;
	stat = { ts_last_active: Date.now() };
	constructor(server, options) {
		super();
		this.id = nanoid();
		this.server = server;
		this.url = options.url;
		this.headers = options.headers;
		this.ip = options.ip;
		this.data = getClientData(options);
	}
	join(group_id) {
		if (this.connection_state !== "connected") return;
		this.addToChannel("g-" + group_id);
	}
	addToChannel(_channel_id) {
		throw new Error("Method \"addToChannel(channel_id)\" must be defined by ExtWSClient extension.");
	}
	leave(group_id) {
		if (this.connection_state !== "connected") return;
		this.removeFromChannel("g-" + group_id);
	}
	removeFromChannel(_channel_id) {
		throw new Error("Method \"removeFromChannel(channel_id)\" must be defined by ExtWSClient extension.");
	}
	sendPayload(_payload) {
		throw new Error("Method \"sendPayload(payload)\" must be defined by ExtWSClient extension.");
	}
	send(arg0, arg1) {
		if (this.connection_state !== "connected") return;
		this.sendPayload(buildPayload(4, arg0, arg1));
	}
	ping() {
		if (this.connection_state !== "connected") return;
		this.sendPayload(buildPayload(2));
	}
	closeTransport() {
		throw new Error("Method \"closeTransport()\" must be defined by ExtWSClient extension.");
	}
	connection_state = "connected";
	/** Requests physical transport close and finalizes the core lifecycle. */
	disconnect() {
		if (this.connection_state !== "connected") return;
		this.connection_state = "disconnecting";
		try {
			this.closeTransport();
		} finally {
			this.finalizeDisconnect();
		}
	}
	/** Finalizes the core lifecycle after the transport closes externally. */
	transportClosed() {
		this.finalizeDisconnect();
	}
	finalizeDisconnect() {
		if (this.connection_state === "disconnected") return;
		this.connection_state = "disconnected";
		this.server.clients.delete(this.id);
		this.server.scheduleHealthcheck();
		const event = new ExtWSEvent("disconnect", this, void 0);
		try {
			this.dispatchEvent(event);
		} finally {
			try {
				this.server.dispatchEvent(event);
			} finally {
				this.destroy();
			}
		}
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
//#region src/main.ts
const MAX_TIMEOUT_MS = 2147483647;
/**
* Validates a healthcheck timeout value.
* @param name Option name used in validation errors.
* @param value Value to validate.
* @returns The validated timeout in seconds.
*/
function validateTimeout(name, value) {
	if (typeof value !== "number") throw new TypeError(`Healthcheck option "${name}" must be a number.`);
	if (!Number.isFinite(value) || value < 0) throw new RangeError(`Healthcheck option "${name}" must be a finite, non-negative number.`);
	return value;
}
var ExtWS = class extends NeoEventTarget {
	clients = /* @__PURE__ */ new Map();
	has_adapter = false;
	healthcheck;
	healthcheck_timeout;
	is_closed = false;
	constructor({ healthcheck = {} } = {}) {
		super();
		const idle_timeout = validateTimeout("idle_timeout", healthcheck.idle_timeout ?? 60);
		const timeframe_ping_disconnect = validateTimeout("timeframe_ping_disconnect", healthcheck.timeframe_ping_disconnect ?? 5);
		if (timeframe_ping_disconnect >= idle_timeout) throw new RangeError("Healthcheck option \"timeframe_ping_disconnect\" must be less than \"idle_timeout\".");
		const idle_timeout_disconnect_ms = idle_timeout * 1e3;
		const timeframe_ping_disconnect_ms = timeframe_ping_disconnect * 1e3;
		this.healthcheck = {
			idle_timeout,
			timeframe_ping_disconnect,
			idle_timeout_disconnect_ms,
			timeframe_ping_disconnect_ms,
			idle_timeout_ping_ms: idle_timeout_disconnect_ms - timeframe_ping_disconnect_ms
		};
	}
	/**
	* Removes state created by a failed client initialization.
	* @param client Client whose initialization failed.
	* @param initialization_error Error raised by the transport hook.
	*/
	rollbackClientConnection(client, initialization_error) {
		this.clients.delete(client.id);
		try {
			client.removeFromChannel(CHANNEL_BROADCAST);
		} catch (error) {
			throw new AggregateError([initialization_error, error], "Failed to initialize client and roll back its broadcast subscription.");
		}
	}
	onConnect(client) {
		if (this.is_closed) {
			client.disconnect();
			return;
		}
		this.clients.set(client.id, client);
		try {
			client.addToChannel(CHANNEL_BROADCAST);
			client.sendPayload(buildPayload(1, {
				id: client.id,
				idle_timeout: this.healthcheck.idle_timeout
			}));
		} catch (error) {
			this.rollbackClientConnection(client, error);
			throw error;
		}
		this.scheduleHealthcheck();
		const event = new ExtWSEvent("connect", client, void 0);
		client.dispatchEvent(event);
		this.dispatchEvent(event);
	}
	onMessage(client, payload) {
		if (Buffer.isBuffer(payload)) payload = payload.toString("utf8");
		client.stat.ts_last_active = Date.now();
		client.stat.ts_pinged_for_activity = void 0;
		this.scheduleHealthcheck();
		const { payload_type, event_type, data } = parsePayload(payload);
		switch (payload_type) {
			case 2:
				client.sendPayload(buildPayload(3));
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
		if (client instanceof ExtWSClient) {
			if (arg2 !== void 0) client.send(arg1, arg2);
			else if (arg1 === void 0) client.send();
			else client.send(arg1);
		} else if (this.has_adapter) this.dispatchEvent(new OutcomePayloadSocketEvent(socket_id, buildPayload(4, arg1, arg2)));
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
	scheduleHealthcheck() {
		if (this.healthcheck_timeout) {
			clearTimeout(this.healthcheck_timeout);
			this.healthcheck_timeout = void 0;
		}
		if (this.is_closed || this.clients.size === 0) return;
		const ts_now_ms = Date.now();
		let next_deadline_ms = Infinity;
		for (const client of this.clients.values()) {
			const { ts_last_active, ts_pinged_for_activity } = client.stat;
			const deadline_ms = ts_last_active + (ts_pinged_for_activity === ts_last_active ? this.healthcheck.idle_timeout_disconnect_ms : this.healthcheck.idle_timeout_ping_ms);
			next_deadline_ms = Math.min(next_deadline_ms, deadline_ms);
		}
		this.healthcheck_timeout = setTimeout(() => {
			this.healthcheck_timeout = void 0;
			this.checkClientsHealth();
		}, Math.min(MAX_TIMEOUT_MS, Math.max(0, next_deadline_ms - ts_now_ms)));
	}
	checkClientsHealth() {
		const ts_now_ms = Date.now();
		for (const client of this.clients.values()) {
			const { ts_last_active } = client.stat;
			const idle_ms = ts_now_ms - ts_last_active;
			if (idle_ms >= this.healthcheck.idle_timeout_ping_ms && client.stat.ts_pinged_for_activity !== ts_last_active) {
				client.stat.ts_pinged_for_activity = ts_last_active;
				try {
					client.ping();
				} catch {}
			}
			if (idle_ms >= this.healthcheck.idle_timeout_disconnect_ms) try {
				client.disconnect();
			} catch {}
		}
		this.scheduleHealthcheck();
	}
	close() {
		if (this.is_closed) return Promise.resolve();
		this.is_closed = true;
		if (this.healthcheck_timeout) {
			clearTimeout(this.healthcheck_timeout);
			this.healthcheck_timeout = void 0;
		}
		const errors = [];
		for (const client of this.clients.values()) try {
			client.disconnect();
		} catch (error) {
			errors.push(error);
		}
		if (errors.length > 0) return Promise.reject(new AggregateError(errors, "Failed to close one or more clients."));
		return Promise.resolve();
	}
};
//#endregion
export { ExtWS, ExtWSClient, ExtWSEvent };
