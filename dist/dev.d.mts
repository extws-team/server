import { a as Promisable, d as OutcomePayloadChannelEvent, f as OutcomePayloadEventType, i as PayloadType, n as Payload, p as OutcomePayloadSocketEvent, r as PayloadData, t as ExtWSOnBeforeUpgradeHandler } from "./types-BE-Os_Hi.mjs";
//#region src/consts.d.ts
export declare const CHANNEL_BROADCAST = "broadcast";
export declare const CHANNEL_GROUP_PREFIX = "g-";
//#endregion
//#region src/payload/json.d.ts
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
//#endregion
export { type ExtWSOnBeforeUpgradeHandler, OutcomePayloadChannelEvent, OutcomePayloadEventType, OutcomePayloadSocketEvent, type PayloadData, PayloadType, type Promisable };