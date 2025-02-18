"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutcomePayloadChannelEvent = exports.OutcomePayloadSocketEvent = exports.OutcomePayloadEventType = exports.EVENT_TYPE_CHANNEL = exports.EVENT_TYPE_SOCKET = void 0;
const neoevents_1 = require("neoevents");
exports.EVENT_TYPE_SOCKET = 'p.socket';
exports.EVENT_TYPE_CHANNEL = 'p.channel';
var OutcomePayloadEventType;
(function (OutcomePayloadEventType) {
    OutcomePayloadEventType["SOCKET"] = "p.socket";
    OutcomePayloadEventType["CHANNEL"] = "p.channel";
})(OutcomePayloadEventType || (exports.OutcomePayloadEventType = OutcomePayloadEventType = {}));
class OutcomePayloadSocketEvent extends neoevents_1.NeoEvent {
    socket_id;
    constructor(socket_id, payload) {
        super(OutcomePayloadEventType.SOCKET, payload);
        this.socket_id = socket_id;
    }
}
exports.OutcomePayloadSocketEvent = OutcomePayloadSocketEvent;
class OutcomePayloadChannelEvent extends neoevents_1.NeoEvent {
    channel_id;
    constructor(channel_id, payload) {
        super(OutcomePayloadEventType.CHANNEL, payload);
        this.channel_id = channel_id;
    }
}
exports.OutcomePayloadChannelEvent = OutcomePayloadChannelEvent;
