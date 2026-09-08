Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_outcome_event = require("./outcome-event-CzELapRu.cjs");
let neoevents = require("neoevents");
let nanoid = require("nanoid");
//#region src/event.ts
var ExtWSEvent = class extends neoevents.NeoEvent {
	client;
	constructor(type, client, data) {
		super(type, data);
		this.client = client;
	}
};
//#endregion
//#region src/client.ts
const nanoid$1 = (0, nanoid.customAlphabet)("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 16);
var ExtWSClient = class extends neoevents.NeoEventTarget {
	id;
	server;
	url;
	headers;
	ip;
	stat = { ts_last_active: Date.now() };
	constructor(server, { url, headers, ip }) {
		super();
		this.id = nanoid$1();
		this.server = server;
		this.url = url;
		this.headers = headers;
		this.ip = ip;
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
		this._sendPayload(require_outcome_event.buildPayload(4, event_type_or_data, data));
	}
	ping() {
		this._sendPayload(require_outcome_event.buildPayload(2));
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
//#region src/main.ts
var ExtWS = class extends neoevents.NeoEventTarget {
	clients = /* @__PURE__ */ new Map();
	has_adapter = false;
	constructor() {
		super();
		this._deferClientsWatch();
	}
	onConnect(client) {
		this.clients.set(client.id, client);
		client._addToChannel(require_outcome_event.CHANNEL_BROADCAST);
		client._sendPayload(require_outcome_event.buildPayload(1, {
			id: client.id,
			idle_timeout: 60
		}));
		const event = new ExtWSEvent("connect", client, void 0);
		client.dispatchEvent(event);
		this.dispatchEvent(event);
	}
	onMessage(client, payload) {
		if (Buffer.isBuffer(payload)) payload = payload.toString("utf8");
		client.stat.ts_last_active = Date.now();
		const { payload_type, event_type, data } = require_outcome_event.parsePayload(payload);
		switch (payload_type) {
			case 2:
				client._sendPayload(require_outcome_event.buildPayload(3));
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
		if (client instanceof ExtWSClient) client.send(arg1, arg2);
		else if (this.has_adapter) this.dispatchEvent(new require_outcome_event.OutcomePayloadSocketEvent(socket_id, require_outcome_event.buildPayload(4, arg1, arg2)));
	}
	sendToGroup(group_id, arg1, arg2) {
		const channel_id = "g-" + group_id;
		const payload = require_outcome_event.buildPayload(4, arg1, arg2);
		this.publish(channel_id, payload);
		if (this.has_adapter) this.dispatchEvent(new require_outcome_event.OutcomePayloadChannelEvent(channel_id, payload));
	}
	broadcast(arg0, arg1) {
		const payload = require_outcome_event.buildPayload(4, arg0, arg1);
		this.publish(require_outcome_event.CHANNEL_BROADCAST, payload);
		if (this.has_adapter) this.dispatchEvent(new require_outcome_event.OutcomePayloadChannelEvent(require_outcome_event.CHANNEL_BROADCAST, payload));
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
		setTimeout(() => {
			this._pingSilentClients();
		}, require_outcome_event.IDLE_TIMEOUT_PING_MS);
	}
	_pingSilentClients() {
		const ts_now_ms = Date.now();
		for (const client of this.clients.values()) if (ts_now_ms - (client.stat.ts_last_active ?? 0) >= 55e3) client.ping();
		setTimeout(() => {
			this._disconnectDeadClients();
		}, require_outcome_event.TIMEFRAME_PING_DISCONNECT_MS);
	}
	_disconnectDeadClients() {
		const ts_now_ms = Date.now();
		for (const client of this.clients.values()) if (ts_now_ms - (client.stat.ts_last_active ?? 0) >= 6e4) client.disconnect();
		this._deferClientsWatch();
	}
	close() {
		throw new Error("Method not implemented.");
	}
};
//#endregion
exports.ExtWS = ExtWS;
exports.ExtWSClient = ExtWSClient;
exports.ExtWSEvent = ExtWSEvent;
