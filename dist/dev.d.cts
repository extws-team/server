import { ExtWSOnBeforeUpgradeHandler, OutcomePayloadChannelEvent, OutcomePayloadEventType, OutcomePayloadSocketEvent, Payload, PayloadData, PayloadType, Promisable } from "./types-4pgZA4us.cjs";

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
export { CHANNEL_BROADCAST, CHANNEL_GROUP_PREFIX, ExtWSOnBeforeUpgradeHandler, OutcomePayloadChannelEvent, OutcomePayloadEventType, OutcomePayloadSocketEvent, PayloadData, PayloadType, Promisable, buildPayload, parsePayload };