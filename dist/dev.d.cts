import { a as Promisable, c as OutcomePayloadEventType, i as PayloadType, l as OutcomePayloadSocketEvent, n as Payload, r as PayloadData, s as OutcomePayloadChannelEvent, t as ExtWSOnBeforeUpgradeHandler } from "./types-htgcWSrl.cjs";

//#region src/consts.d.ts

declare const CHANNEL_BROADCAST: string;
declare const CHANNEL_GROUP_PREFIX: string;
//#endregion
//#region src/payload/json.d.ts
/**
* Builds a payload.
* @param payload_type The type of the payload.
* @param argument1 (Optional) Event type or payload data.
* @param argument2 (Optional) Payload data.
* @returns -
*/
declare function buildPayload(payload_type: PayloadType, argument1?: string | PayloadData, argument2?: PayloadData): string;
type TypedArray = Int8Array | Int16Array | Int32Array | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array | Float32Array | Float64Array | BigInt64Array;
/**
* Parse payload
* @param payload The payload to parse.
* @returns The parsed payload.
*/
declare function parsePayload(payload: string | ArrayBuffer | TypedArray | Buffer[]): Payload;
//#endregion
export { CHANNEL_BROADCAST, CHANNEL_GROUP_PREFIX, type ExtWSOnBeforeUpgradeHandler, OutcomePayloadChannelEvent, OutcomePayloadEventType, OutcomePayloadSocketEvent, type PayloadData, PayloadType, type Promisable, buildPayload, parsePayload };