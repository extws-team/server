import type { ExtWSClient } from '../main.js';

export type Promisable<T> = T | Promise<T>;

export type PayloadData = Record<string, unknown> | unknown[] | string;
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

export type ExtWSOnBeforeUpgradeHandler<ClientData = undefined> = (options: {
	url: ExtWSClient<ClientData>['url'];
	headers: ExtWSClient<ClientData>['headers'];
	ip: ExtWSClient<ClientData>['ip'];
}) => Promisable<Response | ClientData>;
