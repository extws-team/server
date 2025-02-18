import { NeoEvent } from 'neoevents';
export declare const EVENT_TYPE_SOCKET = "p.socket";
export declare const EVENT_TYPE_CHANNEL = "p.channel";
export declare enum OutcomePayloadEventType {
    SOCKET = "p.socket",
    CHANNEL = "p.channel"
}
export declare class OutcomePayloadSocketEvent extends NeoEvent<string> {
    socket_id: string;
    constructor(socket_id: string, payload: string);
}
export declare class OutcomePayloadChannelEvent extends NeoEvent<string> {
    channel_id: string;
    constructor(channel_id: string, payload: string);
}
