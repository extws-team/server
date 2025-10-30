import type { IP } from '@kirick/ip';
import { customAlphabet } from 'nanoid';
import { NeoEventTarget } from 'neoevents';
import { CHANNEL_GROUP_PREFIX } from './consts.js';
import { ExtWSEvent } from './event.js';
import type { ExtWS } from './main.js';
import { buildPayload } from './payload/json.js';
import { type PayloadData, PayloadType } from './payload/types.js';

const nanoid = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	16,
);

interface ExtWSClientStat {
	ts_last_active: number;
}

export interface ClientOptions {
	url: URL;
	headers: Headers;
	ip: IP;
}

export class ExtWSClient extends NeoEventTarget {
	id: string;
	server: ExtWS;
	url: URL;
	headers: Headers;
	ip: IP;
	stat: ExtWSClientStat = {
		ts_last_active: Date.now(),
	};

	constructor(server: ExtWS, { url, headers, ip }: ClientOptions) {
		super();

		this.id = nanoid();
		this.server = server;
		this.url = url;
		this.headers = headers;
		this.ip = ip;
	}

	join(group_id: string): void {
		this.addToChannel(CHANNEL_GROUP_PREFIX + group_id);
	}

	// oxlint-disable-next-line class-methods-use-this
	protected addToChannel(_channel_id: string): void {
		throw new Error(
			'Method "addToChannel(channel_id)" must be defined by ExtWSClient extension.',
		);
	}

	leave(group_id: string): void {
		this.removeFromChannel(CHANNEL_GROUP_PREFIX + group_id);
	}

	// oxlint-disable-next-line class-methods-use-this
	protected removeFromChannel(_channel_id: string): void {
		throw new Error(
			'Method "removeFromChannel(channel_id)" must be defined by ExtWSClient extension.',
		);
	}

	// oxlint-disable-next-line class-methods-use-this
	protected sendPayload(_payload: string): void {
		throw new Error(
			'Method "sendPayload(payload)" must be defined by ExtWSClient extension.',
		);
	}

	send(): void;
	send(event_type: string): void;
	send(data: PayloadData): void;
	send(event_type: string, data: PayloadData): void;
	send(arg0?: string | PayloadData, arg1?: PayloadData): void;
	send(arg0?: string | PayloadData, arg1?: PayloadData) {
		this.sendPayload(buildPayload(PayloadType.MESSAGE, arg0, arg1));
	}

	ping(): void {
		this.sendPayload(buildPayload(PayloadType.PING));
	}

	private is_disconnected = false;

	/**
	 * Disconnects client.
	 * @param _is_disconnected - If true, client is already disconnected from the Websocket server.
	 */
	disconnect(_is_disconnected = false): void {
		if (this.is_disconnected === false) {
			const event = new ExtWSEvent('disconnect', this, undefined);

			this.dispatchEvent(event);
			this.server.dispatchEvent(event);

			this.is_disconnected = true;

			this.destroy();
		}

		this.server.clients.delete(this.id);
	}
}
