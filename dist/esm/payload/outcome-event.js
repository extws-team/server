import { NeoEvent } from 'neoevents';
export const EVENT_TYPE_SOCKET = 'p.socket';
export const EVENT_TYPE_GROUP = 'p.group';
export const EVENT_TYPE_BROADCAST = 'p.broadcast';
export var OutcomePayloadEventType;
(function (OutcomePayloadEventType) {
    OutcomePayloadEventType["SOCKET"] = "p.socket";
    OutcomePayloadEventType["GROUP"] = "p.group";
    OutcomePayloadEventType["BROADCAST"] = "p.broadcast";
})(OutcomePayloadEventType || (OutcomePayloadEventType = {}));
export class OutcomePayloadSocketEvent extends NeoEvent {
    socket_id;
    constructor(socket_id, payload) {
        super(OutcomePayloadEventType.SOCKET, payload);
        this.socket_id = socket_id;
    }
}
export class OutcomePayloadGroupEvent extends NeoEvent {
    group_id;
    constructor(group_id, payload) {
        super(OutcomePayloadEventType.GROUP, payload);
        this.group_id = group_id;
    }
}
export class OutcomePayloadBroadcastEvent extends NeoEvent {
    constructor(payload) {
        super(OutcomePayloadEventType.BROADCAST, payload);
    }
}
