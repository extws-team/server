import { NeoEventTarget } from 'neoevents';
import { ExtWSClient } from './client.js';
import { type PayloadData } from './payload/types.js';
export declare class ExtWS extends NeoEventTarget {
    clients: Map<string, ExtWSClient>;
    has_adapter: boolean;
    constructor();
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
