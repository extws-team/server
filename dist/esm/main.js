import { NeoEventTarget } from 'neoevents';
import { CHANNEL_GROUP_PREFIX, CHANNEL_BROADCAST, IDLE_TIMEOUT, IDLE_TIMEOUT_DISCONNECT_MS, TIMEFRAME_PING_DISCONNECT_MS, IDLE_TIMEOUT_PING_MS, } from './consts.js';
import { ExtWSClient } from './client.js';
import { ExtWSEvent } from './event.js';
import { buildPayload, parsePayload, } from './payload/json.js';
import { PayloadType, } from './payload/types.js';
import { EVENT_TYPE_SOCKET, EVENT_TYPE_CHANNEL, OutcomePayloadSocketEvent, OutcomePayloadChannelEvent, } from './payload/outcome-event.js';
export class ExtWS extends NeoEventTarget {
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
        client.addToChannel(CHANNEL_BROADCAST);
        // @ts-expect-error Property is protected
        client.sendPayload(buildPayload(PayloadType.INIT, {
            id: client.id,
            idle_timeout: IDLE_TIMEOUT,
        }));
        const event = new ExtWSEvent('connect', client, undefined);
        client.dispatchEvent(event);
        this.dispatchEvent(event);
    }
    onMessage(client, payload) {
        if (Buffer.isBuffer(payload)) {
            payload = payload.toString('utf8');
        }
        client.stat.ts_last_active = Date.now();
        const { payload_type, event_type, data, } = parsePayload(payload);
        switch (payload_type) {
            case PayloadType.PING:
                // @ts-expect-error using private property
                client.sendPayload(buildPayload(PayloadType.PONG));
                break;
            case PayloadType.MESSAGE:
                {
                    const event = new ExtWSEvent(event_type ?? 'message', client, data);
                    client.dispatchEvent(event);
                    this.dispatchEvent(event);
                }
                break;
            // no default
        }
    }
    sendToSocket(socket_id, arg1, arg2) {
        const client = this.clients.get(socket_id);
        if (client instanceof ExtWSClient) {
            client.send(arg1, arg2);
        }
        else if (this.has_adapter) {
            this.dispatchEvent(new OutcomePayloadSocketEvent(socket_id, buildPayload(PayloadType.MESSAGE, arg1, arg2)));
        }
    }
    sendToGroup(group_id, arg1, arg2) {
        const channel_id = CHANNEL_GROUP_PREFIX + group_id;
        const payload = buildPayload(PayloadType.MESSAGE, arg1, arg2);
        this.publish(channel_id, payload);
        if (this.has_adapter) {
            this.dispatchEvent(new OutcomePayloadChannelEvent(channel_id, payload));
        }
    }
    broadcast(arg0, arg1) {
        const payload = buildPayload(PayloadType.MESSAGE, arg0, arg1);
        this.publish(CHANNEL_BROADCAST, payload);
        if (this.has_adapter) {
            this.dispatchEvent(new OutcomePayloadChannelEvent(CHANNEL_BROADCAST, payload));
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
    // eslint-disable-next-line class-methods-use-this
    close() {
        throw new Error('Method not implemented.');
    }
}
export { ExtWSClient } from './client.js';
export { ExtWSEvent } from './event.js';
