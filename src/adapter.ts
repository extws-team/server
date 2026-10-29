import type { ExtWS } from './main.js';

type AnyExtWS = ExtWS<Record<string, unknown> | undefined>;

/**
 * Sends a payload received from another server to a socket connected to this server.
 * @param server Server the socket is connected to.
 * @param socket_id ID of the socket.
 * @param payload Payload built by the other server.
 */
export function deliverToSocket(
	server: AnyExtWS,
	socket_id: string,
	payload: string,
): void {
	server.clients.get(socket_id)?.sendPayload(payload);
}

/**
 * Publishes a payload received from another server to subscribers of a channel on this server, without passing it to adapters again.
 * @param server Server to publish on.
 * @param channel_id ID of the channel.
 * @param payload Payload built by the other server.
 */
export function deliverToChannel(
	server: AnyExtWS,
	channel_id: string,
	payload: string,
): void {
	server.publish(channel_id, payload);
}
