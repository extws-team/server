import { a as parsePayload, i as buildPayload, l as WATCHDOG_INTERVAL_MS, r as OutcomePayloadSocketEvent, s as CHANNEL_BROADCAST, t as OutcomePayloadChannelEvent } from "./outcome-event-3mnUU0hp.mjs";
import { NeoEvent, NeoEventTarget } from "neoevents";
import { customAlphabet } from "nanoid";
// src/event.ts
var ExtWSEvent = class extends NeoEvent {
	client;
	constructor(type, client, data) {
		super(type, data);
		this.client = client;
	}
};
// src/client.ts
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 16);
var ExtWSClient = class extends NeoEventTarget {
	id;
	server;
	url;
	headers;
	ip;
	/** Data returned by the `onBeforeUpgrade` hook. */
	data;
	stat = {
		ts_last_active: Date.now(),
		ts_ping: void 0
	};
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
		this.addToChannel("g-" + group_id);
	}
	/** @internal */
	addToChannel(_channel_id) {
		throw new Error("Method \"addToChannel(channel_id)\" must be defined by ExtWSClient extension.");
	}
	leave(group_id) {
		this.removeFromChannel("g-" + group_id);
	}
	/** @internal */
	removeFromChannel(_channel_id) {
		throw new Error("Method \"removeFromChannel(channel_id)\" must be defined by ExtWSClient extension.");
	}
	/** @internal */
	sendPayload(_payload) {
		throw new Error("Method \"sendPayload(payload)\" must be defined by ExtWSClient extension.");
	}
	send(arg0, arg1) {
		this.sendPayload(buildPayload(4, arg0, arg1));
	}
	ping() {
		this.sendPayload(buildPayload(2));
	}
	#is_disconnected = false;
	/**
	* Disconnects client.
	* @param _is_disconnected - If true, client is already disconnected from the Websocket server.
	*/
	disconnect(_is_disconnected = false) {
		if (this.#is_disconnected === false) {
			const event = new ExtWSEvent("disconnect", this, void 0);
			this.dispatchEvent(event);
			this.server.dispatchEvent(event);
			this.#is_disconnected = true;
			this.destroy();
		}
		this.server.clients.delete(this.id);
	}
};
// src/main.ts
var ExtWS = class extends NeoEventTarget {
	clients = /* @__PURE__ */ new Map();
	has_adapter = false;
	constructor({ idleTimeout = 60, pingTimeout = 5 } = {}) {
		super();
		if (!(Number.isFinite(idleTimeout) && pingTimeout > 0 && pingTimeout < idleTimeout)) throw new RangeError(`Options must satisfy 0 < pingTimeout < idleTimeout, got pingTimeout ${pingTimeout} and idleTimeout ${idleTimeout}.`);
		this.#idle_timeout = idleTimeout;
		this.#ping_timeout_ms = pingTimeout * 1e3;
		this.#idle_ping_ms = (idleTimeout - pingTimeout) * 1e3;
	}
	onConnect(client) {
		this.clients.set(client.id, client);
		if (this.#timeout_watchdog === void 0) this.#scheduleWatchdog(this.#idle_ping_ms);
		client.addToChannel(CHANNEL_BROADCAST);
		client.sendPayload(buildPayload(1, {
			id: client.id,
			idle_timeout: this.#idle_timeout
		}));
		const event = new ExtWSEvent("connect", client, void 0);
		client.dispatchEvent(event);
		this.dispatchEvent(event);
	}
	onMessage(client, payload) {
		if (Buffer.isBuffer(payload)) payload = payload.toString("utf8");
		client.stat.ts_last_active = Date.now();
		client.stat.ts_ping = void 0;
		const { payload_type, event_type, data } = parsePayload(payload);
		switch (payload_type) {
			case 2:
				client.sendPayload(buildPayload(3));
				break;
			case 4: {
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
			if (typeof arg1 === "string") client.send(arg1, arg2);
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
	* @internal
	* @param _channel_id -
	* @param _payload -
	*/
	publish(_channel_id, _payload) {
		throw new Error("Method not implemented.");
	}
	#idle_timeout;
	#ping_timeout_ms;
	#idle_ping_ms;
	#timeout_watchdog;
	#scheduleWatchdog(delay_ms) {
		this.#timeout_watchdog = setTimeout(() => {
			this.#runWatchdog();
		}, delay_ms).unref();
	}
	#runWatchdog() {
		const ts_now_ms = Date.now();
		for (const client of this.clients.values()) {
			const { stat } = client;
			if (stat.ts_ping !== void 0) {
				if (ts_now_ms - stat.ts_ping >= this.#ping_timeout_ms) client.disconnect();
			} else if (ts_now_ms - stat.ts_last_active >= this.#idle_ping_ms) {
				client.ping();
				stat.ts_ping = ts_now_ms;
			}
		}
		if (this.clients.size > 0) this.#scheduleWatchdog(WATCHDOG_INTERVAL_MS);
		else this.#timeout_watchdog = void 0;
	}
	/**
	* Stops the server. WebSocket server implementation should override this method and call `super.close()` once its own teardown is done.
	* @returns -
	*/
	close() {
		clearTimeout(this.#timeout_watchdog);
		this.destroy();
		return Promise.resolve();
	}
};
export { ExtWS, ExtWSClient, ExtWSEvent };
