import { PayloadData, PayloadType, type Payload } from './types.js';
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
export {};
