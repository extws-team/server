import { a as parsePayload, c as CHANNEL_GROUP_PREFIX, i as buildPayload, n as OutcomePayloadEventType, o as PayloadType, r as OutcomePayloadSocketEvent, s as CHANNEL_BROADCAST, t as OutcomePayloadChannelEvent } from "./outcome-event-DHb7k3bb.mjs";
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
export { CHANNEL_BROADCAST, CHANNEL_GROUP_PREFIX, OutcomePayloadChannelEvent, OutcomePayloadEventType, OutcomePayloadSocketEvent, PayloadType, buildPayload, deliverToChannel, deliverToSocket, parsePayload };
