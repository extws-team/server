const require_outcome_event = require('./outcome-event-DMrRECXk.cjs');
const neoevents = require_outcome_event.__toESM(require("neoevents"));
require("@kirick/ip");
const nanoid = require_outcome_event.__toESM(require("nanoid"));

//#region src/event.ts
var ExtWSEvent = class extends neoevents.NeoEvent {
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
		this.addToChannel(require_outcome_event.CHANNEL_GROUP_PREFIX + group_id);
	}
	addToChannel(_channel_id) {
		throw new Error("Method \"addToChannel(channel_id)\" must be defined by ExtWSClient extension.");
	}
	leave(group_id) {
		this.removeFromChannel(require_outcome_event.CHANNEL_GROUP_PREFIX + group_id);
	}
	removeFromChannel(_channel_id) {
		throw new Error("Method \"removeFromChannel(channel_id)\" must be defined by ExtWSClient extension.");
	}
	sendPayload(_payload) {
		throw new Error("Method \"sendPayload(payload)\" must be defined by ExtWSClient extension.");
	}
	send(arg0, arg1) {
		this.sendPayload(require_outcome_event.buildPayload(require_outcome_event.PayloadType.MESSAGE, arg0, arg1));
	}
	ping() {
		this.sendPayload(require_outcome_event.buildPayload(require_outcome_event.PayloadType.PING));
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
	clients = new Map();
	has_adapter = false;
	constructor(options) {
		super();
		this.options = options;
		this.deferClientsWatch();
	}
	onConnect(client) {
		this.clients.set(client.id, client);
		client.addToChannel(require_outcome_event.CHANNEL_BROADCAST);
		client.sendPayload(require_outcome_event.buildPayload(require_outcome_event.PayloadType.INIT, {
			id: client.id,
			idle_timeout: require_outcome_event.IDLE_TIMEOUT
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
			case require_outcome_event.PayloadType.PING:
				client.sendPayload(require_outcome_event.buildPayload(require_outcome_event.PayloadType.PONG));
				break;
			case require_outcome_event.PayloadType.MESSAGE:
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
		if (client instanceof ExtWSClient) client.send(arg1, arg2);
		else if (this.has_adapter) this.dispatchEvent(new require_outcome_event.OutcomePayloadSocketEvent(socket_id, require_outcome_event.buildPayload(require_outcome_event.PayloadType.MESSAGE, arg1, arg2)));
	}
	sendToGroup(group_id, arg1, arg2) {
		const channel_id = require_outcome_event.CHANNEL_GROUP_PREFIX + group_id;
		const payload = require_outcome_event.buildPayload(require_outcome_event.PayloadType.MESSAGE, arg1, arg2);
		this.publish(channel_id, payload);
		if (this.has_adapter) this.dispatchEvent(new require_outcome_event.OutcomePayloadChannelEvent(channel_id, payload));
	}
	broadcast(arg0, arg1) {
		const payload = require_outcome_event.buildPayload(require_outcome_event.PayloadType.MESSAGE, arg0, arg1);
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
	deferClientsWatch() {
		setTimeout(() => {
			this.pingSilentClients();
		}, require_outcome_event.IDLE_TIMEOUT_PING_MS);
	}
	pingSilentClients() {
		const ts_now_ms = Date.now();
		for (const client of this.clients.values()) {
			const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);
			if (idle_ms >= require_outcome_event.IDLE_TIMEOUT_PING_MS) client.ping();
		}
		setTimeout(() => {
			this.disconnectDeadClients();
		}, require_outcome_event.TIMEFRAME_PING_DISCONNECT_MS);
	}
	disconnectDeadClients() {
		const ts_now_ms = Date.now();
		for (const client of this.clients.values()) {
			const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);
			if (idle_ms >= require_outcome_event.IDLE_TIMEOUT_DISCONNECT_MS) client.disconnect();
		}
		this.deferClientsWatch();
	}
	close() {
		throw new Error("Method not implemented.");
	}
};

//#endregion
exports.ExtWS = ExtWS;
exports.ExtWSClient = ExtWSClient;
exports.ExtWSEvent = ExtWSEvent;