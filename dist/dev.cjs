Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_outcome_event = require("./outcome-event-B6RV9p-O.cjs");
// src/adapter.ts
/**
* Sends a payload received from another server to a socket connected to this server.
* @param server Server the socket is connected to.
* @param socket_id ID of the socket.
* @param payload Payload built by the other server.
*/
function deliverToSocket(server, socket_id, payload) {
	server.clients.get(socket_id)?.sendPayload(payload);
}
/**
* Publishes a payload received from another server to subscribers of a channel on this server, without passing it to adapters again.
* @param server Server to publish on.
* @param channel_id ID of the channel.
* @param payload Payload built by the other server.
*/
function deliverToChannel(server, channel_id, payload) {
	server.publish(channel_id, payload);
}
exports.CHANNEL_BROADCAST = require_outcome_event.CHANNEL_BROADCAST;
exports.CHANNEL_GROUP_PREFIX = require_outcome_event.CHANNEL_GROUP_PREFIX;
exports.OutcomePayloadChannelEvent = require_outcome_event.OutcomePayloadChannelEvent;
exports.OutcomePayloadEventType = require_outcome_event.OutcomePayloadEventType;
exports.OutcomePayloadSocketEvent = require_outcome_event.OutcomePayloadSocketEvent;
exports.PayloadType = require_outcome_event.PayloadType;
exports.buildPayload = require_outcome_event.buildPayload;
exports.deliverToChannel = deliverToChannel;
exports.deliverToSocket = deliverToSocket;
exports.parsePayload = require_outcome_event.parsePayload;
