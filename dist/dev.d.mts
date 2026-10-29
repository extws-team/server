import { c as ExtWSOnBeforeUpgradeOptions, d as PayloadData, f as PayloadType, i as OutcomePayloadSocketEvent, l as ExtWSOptions, n as OutcomePayloadChannelEvent, p as Promisable, r as OutcomePayloadEventType, s as ExtWSOnBeforeUpgradeHandler, t as ExtWS, u as Payload } from "./main-BbuUR_Zp.mjs";
type AnyExtWS = ExtWS<Record<string, unknown> | undefined>;
/**
 * Sends a payload received from another server to a socket connected to this server.
 * @param server Server the socket is connected to.
 * @param socket_id ID of the socket.
 * @param payload Payload built by the other server.
 */
export declare function deliverToSocket(server: AnyExtWS, socket_id: string, payload: string): void;
/**
 * Publishes a payload received from another server to subscribers of a channel on this server, without passing it to adapters again.
 * @param server Server to publish on.
 * @param channel_id ID of the channel.
 * @param payload Payload built by the other server.
 */
export declare function deliverToChannel(server: AnyExtWS, channel_id: string, payload: string): void;
export declare const CHANNEL_BROADCAST = "broadcast";
export declare const CHANNEL_GROUP_PREFIX = "g-";
/**
 * Builds a payload.
 * @param payload_type The type of the payload.
 * @param argument1 (Optional) Event type or payload data.
 * @param argument2 (Optional) Payload data.
 * @returns -
 */
export declare function buildPayload(payload_type: PayloadType, argument1?: string | PayloadData, argument2?: PayloadData): string;
type TypedArray = Int8Array | Int16Array | Int32Array | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array | Float32Array | Float64Array | BigInt64Array;
/**
 * Parse payload
 * @param payload The payload to parse.
 * @returns The parsed payload.
 */
export declare function parsePayload(payload: string | ArrayBuffer | TypedArray | Buffer[]): Payload;
export { type ExtWSOnBeforeUpgradeHandler, type ExtWSOnBeforeUpgradeOptions, type ExtWSOptions, OutcomePayloadChannelEvent, OutcomePayloadEventType, OutcomePayloadSocketEvent, type PayloadData, PayloadType, type Promisable };