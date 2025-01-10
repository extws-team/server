export var OutcomePayloadEventType;
(function (OutcomePayloadEventType) {
    OutcomePayloadEventType["SOCKET"] = "p.socket";
    OutcomePayloadEventType["GROUP"] = "p.group";
    OutcomePayloadEventType["BROADCAST"] = "p.broadcast";
})(OutcomePayloadEventType || (OutcomePayloadEventType = {}));
class OutcomePayloadEvent extends Event {
    payload;
    constructor(type, payload) {
        super(type);
        this.payload = payload;
    }
}
export class OutcomePayloadSocketEvent extends OutcomePayloadEvent {
    socket_id;
    constructor(socket_id, payload) {
        super(OutcomePayloadEventType.SOCKET, payload);
        this.socket_id = socket_id;
    }
}
export class OutcomePayloadGroupEvent extends OutcomePayloadEvent {
    group_id;
    constructor(group_id, payload) {
        super(OutcomePayloadEventType.GROUP, payload);
        this.group_id = group_id;
    }
}
export class OutcomePayloadBroadcastEvent extends OutcomePayloadEvent {
    constructor(payload) {
        super(OutcomePayloadEventType.BROADCAST, payload);
    }
}
