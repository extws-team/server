import { CHANNEL_BROADCAST, CHANNEL_GROUP_PREFIX, IDLE_TIMEOUT, IDLE_TIMEOUT_DISCONNECT_MS, IDLE_TIMEOUT_PING_MS, OutcomePayloadChannelEvent$1 as OutcomePayloadChannelEvent, OutcomePayloadSocketEvent$1 as OutcomePayloadSocketEvent, PayloadType$1 as PayloadType, TIMEFRAME_PING_DISCONNECT_MS, buildPayload, parsePayload } from "./outcome-event-C10k8UJf.js";
import { NeoEvent, NeoEventTarget } from "neoevents";
import { customAlphabet } from "nanoid";

//#region src/event.ts
var ExtWSEvent = class extends NeoEvent {
	constructor(type, client, data) {
		super(type, data);
		this.client = client;
	}
};

//#endregion
//#region src/client.ts
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 16);
var ExtWSClient = class extends NeoEventTarget {
	id;
	server;
	url;
	headers;
	ip;
	stat = { ts_last_active: Date.now() };
	constructor(server, { url, headers, ip }) {
		super();
		this.id = nanoid();
		this.server = server;
		this.url = url;
		this.headers = headers;
		this.ip = ip;
	}
	join(group_id) {
		this.addToChannel(CHANNEL_GROUP_PREFIX + group_id);
	}
	addToChannel(_channel_id) {
		throw new Error("Method \"addToChannel(channel_id)\" must be defined by ExtWSClient extension.");
	}
	leave(group_id) {
		this.removeFromChannel(CHANNEL_GROUP_PREFIX + group_id);
	}
	removeFromChannel(_channel_id) {
		throw new Error("Method \"removeFromChannel(channel_id)\" must be defined by ExtWSClient extension.");
	}
	sendPayload(_payload) {
		throw new Error("Method \"sendPayload(payload)\" must be defined by ExtWSClient extension.");
	}
	send(arg0, arg1) {
		this.sendPayload(buildPayload(PayloadType.MESSAGE, arg0, arg1));
	}
	ping() {
		this.sendPayload(buildPayload(PayloadType.PING));
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
var ExtWS = class extends NeoEventTarget {
	clients = new Map();
	has_adapter = false;
	constructor() {
		super();
		this.deferClientsWatch();
	}
	onConnect(client) {
		this.clients.set(client.id, client);
		client.addToChannel(CHANNEL_BROADCAST);
		client.sendPayload(buildPayload(PayloadType.INIT, {
			id: client.id,
			idle_timeout: IDLE_TIMEOUT
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
			case PayloadType.PING:
				client.sendPayload(buildPayload(PayloadType.PONG));
				break;
			case PayloadType.MESSAGE:
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
		else if (this.has_adapter) this.dispatchEvent(new OutcomePayloadSocketEvent(socket_id, buildPayload(PayloadType.MESSAGE, arg1, arg2)));
	}
	sendToGroup(group_id, arg1, arg2) {
		const channel_id = CHANNEL_GROUP_PREFIX + group_id;
		const payload = buildPayload(PayloadType.MESSAGE, arg1, arg2);
		this.publish(channel_id, payload);
		if (this.has_adapter) this.dispatchEvent(new OutcomePayloadChannelEvent(channel_id, payload));
	}
	broadcast(arg0, arg1) {
		const payload = buildPayload(PayloadType.MESSAGE, arg0, arg1);
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
	deferClientsWatch() {
		setTimeout(() => {
			this.pingSilentClients();
		}, IDLE_TIMEOUT_PING_MS);
	}
	pingSilentClients() {
		const ts_now_ms = Date.now();
		for (const client of this.clients.values()) {
			const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);
			if (idle_ms >= IDLE_TIMEOUT_PING_MS) client.ping();
		}
		setTimeout(() => {
			this.disconnectDeadClients();
		}, TIMEFRAME_PING_DISCONNECT_MS);
	}
	disconnectDeadClients() {
		const ts_now_ms = Date.now();
		for (const client of this.clients.values()) {
			const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);
			if (idle_ms >= IDLE_TIMEOUT_DISCONNECT_MS) client.disconnect();
		}
		this.deferClientsWatch();
	}
	close() {
		throw new Error("Method not implemented.");
	}
};

//#endregion
export { ExtWS, ExtWSClient, ExtWSEvent };