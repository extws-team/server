import { IP } from '@kirick/ip';
import { NeoEventTarget } from 'neoevents';
import { ExtWS } from './main.js';
import { type PayloadData } from './payload/types.js';
interface ExtWSClientStat {
    ts_last_active: number;
}
export interface ClientOptions {
    url: URL;
    headers: Map<string, string>;
    ip: IP;
}
export declare class ExtWSClient extends NeoEventTarget {
    id: string;
    server: ExtWS;
    url: URL;
    headers: Map<string, string>;
    ip: IP;
    stat: ExtWSClientStat;
    constructor(server: ExtWS, { url, headers, ip, }: ClientOptions);
    join(group_id: string): void;
    protected addToChannel(_channel_id: string): void;
    leave(group_id: string): void;
    protected removeFromChannel(_channel_id: string): void;
    protected sendPayload(_payload: string): void;
    send(): void;
    send(event_type: string): void;
    send(data: PayloadData): void;
    send(event_type: string, data: PayloadData): void;
    send(arg0?: string | PayloadData, arg1?: PayloadData): void;
    ping(): void;
    private is_disconnected;
    /**
     * Disconnects client.
     * @param _is_disconnected - If true, client is already disconnected from the Websocket server.
     */
    disconnect(_is_disconnected?: boolean): void;
}
export {};
