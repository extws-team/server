import type { ExtWSClient } from '../main.js';
export type Promisable<T> = T | Promise<T>;
export type PayloadData = Record<string, unknown> | unknown[];
export interface Payload {
    payload_type: PayloadType;
    event_type?: string;
    data?: PayloadData;
}
export declare enum PayloadType {
    ERROR = -1,
    INIT = 1,
    PING = 2,
    PONG = 3,
    MESSAGE = 4
}
export type ExtWSHttpResponse = {
    status: number;
    headers?: ExtWSClient['headers'];
    body?: string;
};
export type ExtWSOnBeforeUpgradeHandler = (url: ExtWSClient['url'], headers: ExtWSClient['headers']) => Promisable<ExtWSHttpResponse | undefined>;
