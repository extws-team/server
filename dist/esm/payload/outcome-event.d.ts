export declare enum OutcomePayloadEventType {
    SOCKET = "p.socket",
    GROUP = "p.group",
    BROADCAST = "p.broadcast"
}
declare class OutcomePayloadEvent extends Event {
    payload: string;
    constructor(type: OutcomePayloadEventType, payload: string);
}
export declare class OutcomePayloadSocketEvent extends OutcomePayloadEvent {
    socket_id: string;
    constructor(socket_id: string, payload: string);
}
export declare class OutcomePayloadGroupEvent extends OutcomePayloadEvent {
    group_id: string;
    constructor(group_id: string, payload: string);
}
export declare class OutcomePayloadBroadcastEvent extends OutcomePayloadEvent {
    constructor(payload: string);
}
export {};
