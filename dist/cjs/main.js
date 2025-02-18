"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtWSEvent = exports.ExtWSClient = exports.ExtWS = void 0;
const neoevents_1 = require("neoevents");
const consts_js_1 = require("./consts.js");
const client_js_1 = require("./client.js");
const event_js_1 = require("./event.js");
const json_js_1 = require("./payload/json.js");
const types_js_1 = require("./payload/types.js");
const outcome_event_js_1 = require("./payload/outcome-event.js");
class ExtWS extends neoevents_1.NeoEventTarget {
    options;
    clients = new Map();
    has_adapter = false;
    constructor(options) {
        super();
        this.options = options;
        this.deferClientsWatch();
    }
    onConnect(client) {
        this.clients.set(client.id, client);
        // @ts-expect-error Property is protected
        client.addToChannel(consts_js_1.CHANNEL_BROADCAST);
        // @ts-expect-error Property is protected
        client.sendPayload((0, json_js_1.buildPayload)(types_js_1.PayloadType.INIT, {
            id: client.id,
            idle_timeout: consts_js_1.IDLE_TIMEOUT,
        }));
        const event = new event_js_1.ExtWSEvent('connect', client, undefined);
        client.dispatchEvent(event);
        this.dispatchEvent(event);
    }
    onMessage(client, payload) {
        if (Buffer.isBuffer(payload)) {
            payload = payload.toString('utf8');
        }
        client.stat.ts_last_active = Date.now();
        const { payload_type, event_type, data, } = (0, json_js_1.parsePayload)(payload);
        switch (payload_type) {
            case types_js_1.PayloadType.PING:
                // @ts-expect-error using private property
                client.sendPayload((0, json_js_1.buildPayload)(types_js_1.PayloadType.PONG));
                break;
            case types_js_1.PayloadType.MESSAGE:
                {
                    const event = new event_js_1.ExtWSEvent(event_type ?? 'message', client, data);
                    client.dispatchEvent(event);
                    this.dispatchEvent(event);
                }
                break;
            // no default
        }
    }
    sendToSocket(socket_id, arg1, arg2) {
        const client = this.clients.get(socket_id);
        if (client instanceof client_js_1.ExtWSClient) {
            client.send(arg1, arg2);
        }
        else if (this.has_adapter) {
            this.dispatchEvent(new outcome_event_js_1.OutcomePayloadSocketEvent(socket_id, (0, json_js_1.buildPayload)(types_js_1.PayloadType.MESSAGE, arg1, arg2)));
        }
    }
    sendToGroup(group_id, arg1, arg2) {
        const channel_id = consts_js_1.CHANNEL_GROUP_PREFIX + group_id;
        const payload = (0, json_js_1.buildPayload)(types_js_1.PayloadType.MESSAGE, arg1, arg2);
        this.publish(channel_id, payload);
        if (this.has_adapter) {
            this.dispatchEvent(new outcome_event_js_1.OutcomePayloadChannelEvent(channel_id, payload));
        }
    }
    broadcast(arg0, arg1) {
        const payload = (0, json_js_1.buildPayload)(types_js_1.PayloadType.MESSAGE, arg0, arg1);
        this.publish(consts_js_1.CHANNEL_BROADCAST, payload);
        if (this.has_adapter) {
            this.dispatchEvent(new outcome_event_js_1.OutcomePayloadChannelEvent(consts_js_1.CHANNEL_BROADCAST, payload));
        }
    }
    /**
     * Sends a message to a specific group of clients. THis method should be implemented by WebSocket server implementation.
     * @param _channel -
     * @param _payload -
     */
    // eslint-disable-next-line class-methods-use-this
    publish(_channel, _payload) {
        throw new Error('Method not implemented.');
    }
    deferClientsWatch() {
        setTimeout(() => {
            this.pingSilentClients();
        }, consts_js_1.IDLE_TIMEOUT_PING_MS);
    }
    pingSilentClients() {
        const ts_now_ms = Date.now();
        for (const client of this.clients.values()) {
            const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);
            if (idle_ms >= consts_js_1.IDLE_TIMEOUT_PING_MS) {
                client.ping();
            }
        }
        setTimeout(() => {
            this.disconnectDeadClients();
        }, consts_js_1.TIMEFRAME_PING_DISCONNECT_MS);
    }
    disconnectDeadClients() {
        const ts_now_ms = Date.now();
        for (const client of this.clients.values()) {
            const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);
            if (idle_ms >= consts_js_1.IDLE_TIMEOUT_DISCONNECT_MS) {
                client.disconnect();
            }
        }
        this.deferClientsWatch();
    }
    // eslint-disable-next-line class-methods-use-this
    close() {
        throw new Error('Method not implemented.');
    }
}
exports.ExtWS = ExtWS;
var client_js_2 = require("./client.js");
Object.defineProperty(exports, "ExtWSClient", { enumerable: true, get: function () { return client_js_2.ExtWSClient; } });
var event_js_2 = require("./event.js");
Object.defineProperty(exports, "ExtWSEvent", { enumerable: true, get: function () { return event_js_2.ExtWSEvent; } });
