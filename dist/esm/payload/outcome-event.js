import { NeoEvent } from 'neoevents';
export const EVENT_TYPE_SOCKET = 'p.socket';
export const EVENT_TYPE_CHANNEL = 'p.channel';
export var OutcomePayloadEventType;
(function (OutcomePayloadEventType) {
    OutcomePayloadEventType["SOCKET"] = "p.socket";
    OutcomePayloadEventType["CHANNEL"] = "p.channel";
})(OutcomePayloadEventType || (OutcomePayloadEventType = {}));
export class OutcomePayloadSocketEvent extends NeoEvent {
    socket_id;
    constructor(socket_id, payload) {
        super(OutcomePayloadEventType.SOCKET, payload);
        this.socket_id = socket_id;
    }
}
export class OutcomePayloadChannelEvent extends NeoEvent {
    channel_id;
    constructor(channel_id, payload) {
        super(OutcomePayloadEventType.CHANNEL, payload);
        this.channel_id = channel_id;
    }
}
