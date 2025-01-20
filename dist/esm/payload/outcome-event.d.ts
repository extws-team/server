import { NeoEvent } from 'neoevents';
export declare const EVENT_TYPE_SOCKET = "p.socket";
export declare const EVENT_TYPE_GROUP = "p.group";
export declare const EVENT_TYPE_BROADCAST = "p.broadcast";
export declare enum OutcomePayloadEventType {
    SOCKET = "p.socket",
    GROUP = "p.group",
    BROADCAST = "p.broadcast"
}
export declare class OutcomePayloadSocketEvent extends NeoEvent<string> {
    socket_id: string;
    constructor(socket_id: string, payload: string);
}
export declare class OutcomePayloadGroupEvent extends NeoEvent<string> {
    group_id: string;
    constructor(group_id: string, payload: string);
}
export declare class OutcomePayloadBroadcastEvent extends NeoEvent<string> {
    constructor(payload: string);
}
