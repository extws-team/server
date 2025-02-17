"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPayload = buildPayload;
exports.parsePayload = parsePayload;
const types_js_1 = require("./types.cjs");
const PRINT_ERRORS = process.env.NODE_ENV === 'development'
    || process.env.NODE_ENV === 'test';
/**
 * Builds a payload.
 * @param payload_type The type of the payload.
 * @param argument1 (Optional) Event type or payload data.
 * @param argument2 (Optional) Payload data.
 * @returns -
 */
function buildPayload(payload_type, argument1, argument2) {
    let payload = String(payload_type);
    let event_type;
    let data;
    if (undefined === argument2
        && typeof argument1 !== 'string') {
        data = argument1;
        event_type = undefined;
    }
    else if (typeof argument1 === 'string') {
        data = argument2;
        event_type = argument1;
    }
    if (event_type) {
        payload += event_type;
    }
    if (data) {
        payload += JSON.stringify(data);
    }
    return payload;
}
const JSON_START = new Set(['[', '{']);
const textDecoder = new TextDecoder();
/**
 * Check if the value is a typed array.
 * @param value - The value to check.
 * @returns - Whether the value is a typed array.
 */
function isTypedArray(value) {
    return value instanceof Int8Array
        || value instanceof Int16Array
        || value instanceof Int32Array
        || value instanceof Uint8Array
        || value instanceof Uint8ClampedArray
        || value instanceof Uint16Array
        || value instanceof Uint32Array
        || value instanceof Float32Array
        || value instanceof Float64Array
        || value instanceof BigInt64Array;
}
/**
 * Parse payload
 * @param payload The payload to parse.
 * @returns The parsed payload.
 */
function parsePayload(payload) {
    if (typeof payload === 'string') {
        // do nothing
    }
    else if (payload instanceof ArrayBuffer || isTypedArray(payload)) {
        payload = textDecoder.decode(payload);
    }
    else if (Array.isArray(payload)) {
        payload = Buffer.concat(payload).toString();
    }
    else {
        throw new TypeError('Invalid payload type.');
    }
    const result = {
        payload_type: (payload.codePointAt(0) ?? 48) - 48,
    };
    let start = 1;
    let event_type = '';
    for (let index = start; index < payload.length && JSON_START.has(payload[index]) === false; index++) {
        event_type += payload[index];
        start++;
    }
    if (event_type.length > 31) {
        if (PRINT_ERRORS) {
            // eslint-disable-next-line no-console
            console.error(`Event type cannot be longer than 31 characters, received "${event_type}"`);
        }
        return {
            payload_type: types_js_1.PayloadType.ERROR,
        };
    }
    if (event_type.length > 0) {
        result.event_type = event_type;
    }
    if (start < payload.length) {
        const payload_raw = payload.slice(start);
        try {
            result.data = JSON.parse(payload_raw);
        }
        catch {
            if (PRINT_ERRORS) {
                // eslint-disable-next-line no-console
                console.error(`Cannot parse payload "${payload_raw}": invalid JSON`);
            }
            return {
                payload_type: types_js_1.PayloadType.ERROR,
            };
        }
    }
    return result;
}
