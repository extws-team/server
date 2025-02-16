import { NeoEventTarget } from 'neoevents';
import { ExtWSClient } from './client.js';
import { ExtWSEvent } from './event.js';
import { type PayloadData, type ExtWSOnBeforeUpgradeHandler } from './payload/types.js';
import { EVENT_TYPE_SOCKET, EVENT_TYPE_GROUP, EVENT_TYPE_BROADCAST, OutcomePayloadSocketEvent, OutcomePayloadGroupEvent, OutcomePayloadBroadcastEvent } from './payload/outcome-event.js';
type EventMap = {
    connect: ExtWSEvent<undefined>;
    disconnect: ExtWSEvent<undefined>;
    [EVENT_TYPE_SOCKET]: OutcomePayloadSocketEvent;
    [EVENT_TYPE_GROUP]: OutcomePayloadGroupEvent;
    [EVENT_TYPE_BROADCAST]: OutcomePayloadBroadcastEvent;
} & {
    [key: string]: ExtWSEvent;
};
export declare class ExtWS extends NeoEventTarget<EventMap> {
    protected options: {
        onBeforeUpgrade?: ExtWSOnBeforeUpgradeHandler;
    };
    clients: Map<string, ExtWSClient>;
    has_adapter: boolean;
    constructor(options: {
        onBeforeUpgrade?: ExtWSOnBeforeUpgradeHandler;
    });
    protected onConnect(client: ExtWSClient): void;
    protected onMessage(client: ExtWSClient, payload: string | Buffer): void;
    sendToSocket(socket_id: string): void;
    sendToSocket(socket_id: string, event_type: string): void;
    sendToSocket(socket_id: string, data: PayloadData): void;
    sendToSocket(socket_id: string, event_type: string, data: PayloadData): void;
    sendToGroup(group_id: string): void;
    sendToGroup(group_id: string, event_type: string): void;
    sendToGroup(group_id: string, data: PayloadData): void;
    sendToGroup(group_id: string, event_type: string, data: PayloadData): void;
    broadcast(): void;
    broadcast(event_type: string): void;
    broadcast(data: PayloadData): void;
    broadcast(event_type: string, data: PayloadData): void;
    /**
     * Sends a message to a specific group of clients. THis method should be implemented by WebSocket server implementation.
     * @param _channel -
     * @param _payload -
     */
    protected publish(_channel: string, _payload: string): void;
    private deferClientsWatch;
    private pingSilentClients;
    private disconnectDeadClients;
    close(): Promise<void>;
}
export { ExtWSClient } from './client.js';
export { ExtWSEvent } from './event.js';
