"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutcomePayloadBroadcastEvent = exports.OutcomePayloadGroupEvent = exports.OutcomePayloadSocketEvent = exports.OutcomePayloadEventType = exports.EVENT_TYPE_BROADCAST = exports.EVENT_TYPE_GROUP = exports.EVENT_TYPE_SOCKET = void 0;
const neoevents_1 = require("neoevents");
exports.EVENT_TYPE_SOCKET = 'p.socket';
exports.EVENT_TYPE_GROUP = 'p.group';
exports.EVENT_TYPE_BROADCAST = 'p.broadcast';
var OutcomePayloadEventType;
(function (OutcomePayloadEventType) {
    OutcomePayloadEventType["SOCKET"] = "p.socket";
    OutcomePayloadEventType["GROUP"] = "p.group";
    OutcomePayloadEventType["BROADCAST"] = "p.broadcast";
})(OutcomePayloadEventType || (exports.OutcomePayloadEventType = OutcomePayloadEventType = {}));
class OutcomePayloadSocketEvent extends neoevents_1.NeoEvent {
    socket_id;
    constructor(socket_id, payload) {
        super(OutcomePayloadEventType.SOCKET, payload);
        this.socket_id = socket_id;
    }
}
exports.OutcomePayloadSocketEvent = OutcomePayloadSocketEvent;
class OutcomePayloadGroupEvent extends neoevents_1.NeoEvent {
    group_id;
    constructor(group_id, payload) {
        super(OutcomePayloadEventType.GROUP, payload);
        this.group_id = group_id;
    }
}
exports.OutcomePayloadGroupEvent = OutcomePayloadGroupEvent;
class OutcomePayloadBroadcastEvent extends neoevents_1.NeoEvent {
    constructor(payload) {
        super(OutcomePayloadEventType.BROADCAST, payload);
    }
}
exports.OutcomePayloadBroadcastEvent = OutcomePayloadBroadcastEvent;
