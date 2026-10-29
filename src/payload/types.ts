import type { ExtWSClient } from '../main.js';

export type Promisable<T> = T | Promise<T>;

export type PayloadData = Record<string, unknown> | unknown[];
export interface Payload {
	payload_type: PayloadType;
	event_type?: string;
	data?: PayloadData;
}

export enum PayloadType {
	ERROR = -1,
	INIT = 1,
	PING = 2,
	PONG = 3,
	MESSAGE = 4,
}

export type ExtWSOnBeforeUpgradeHandler<TData> = (options: {
	url: ExtWSClient['url'];
	headers: ExtWSClient['headers'];
	ip: ExtWSClient['ip'];
}) => Promisable<Response | TData>;

/**
 * `onBeforeUpgrade` option of a WebSocket server implementation.
 * Becomes required once `TData` excludes `undefined`, since only the hook can produce the data.
 */
export type ExtWSOnBeforeUpgradeOptions<
	TData extends Record<string, unknown> | undefined,
> = undefined extends TData
	? {
			/** Hook that is called before a WebSocket upgrade. Useful to parse authorization and reject upgrade with custom headers such as `Set-Cookie`. Return a `Response` to reject the upgrade, or data to attach to the client as `client.data`. */
			onBeforeUpgrade?: ExtWSOnBeforeUpgradeHandler<TData>;
		}
	: {
			/** Hook that is called before a WebSocket upgrade. Useful to parse authorization and reject upgrade with custom headers such as `Set-Cookie`. Return a `Response` to reject the upgrade, or data to attach to the client as `client.data`. */
			onBeforeUpgrade: ExtWSOnBeforeUpgradeHandler<TData>;
		};
