import { IP } from '@kirick/ip';
import { customAlphabet } from 'nanoid';
import { GROUP_PREFIX } from './consts.js';
import {
	ExtWSEvent,
	ExtWSEventTarget,
} from './event-target.js';
import { ExtWS } from './main.js';
import { buildPayload } from './payload/json.js';
import {
	PayloadType,
	type PayloadData,
} from './payload/types.js';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);

interface ExtWSClientStat {
	ts_last_active: number;
}

export interface ClientOptions {
	url: URL;
	headers: Map<string, string>; // Headers;
	ip: IP;
}

export class ExtWSClient extends ExtWSEventTarget {
	id: string;
	server: ExtWS;
	url: URL;
	headers: Map<string, string>; // Headers;
	ip: IP;
	stat: ExtWSClientStat = {
		ts_last_active: Date.now(),
	};

	constructor(
		server: ExtWS,
		{
			url,
			headers,
			ip,
		}: ClientOptions,
	) {
		super();

		this.id = nanoid();
		this.server = server;
		this.url = url;
		this.headers = headers;
		this.ip = ip;
	}

	join(group_id: string) {
		this.addToGroup(
			GROUP_PREFIX + group_id,
		);
	}

	// eslint-disable-next-line class-methods-use-this
	protected addToGroup(_group_id: string) {
		throw new Error('Method "addToGroup(group_id)" must be defined by ExtWSClient extension.');
	}

	leave(group_id: string) {
		this.removeFromGroup(
			GROUP_PREFIX + group_id,
		);
	}

	// eslint-disable-next-line class-methods-use-this
	protected removeFromGroup(_group_id: string) {
		throw new Error('Method "removeFromGroup(group_id)" must be defined by ExtWSClient extension.');
	}

	// eslint-disable-next-line class-methods-use-this
	protected sendPayload(_payload: string) {
		throw new Error('Method "sendPayload(payload)" must be defined by ExtWSClient extension.');
	}

	send(): void;
	send(event_type: string): void;
	send(data: PayloadData): void;
	send(event_type: string, data: PayloadData): void;
	send(arg0?: string | PayloadData, arg1?: PayloadData): void;
	send(
		arg0?: string | PayloadData,
		arg1?: PayloadData,
	) {
		this.sendPayload(
			buildPayload(
				PayloadType.MESSAGE,
				arg0,
				arg1,
			),
		);
	}

	ping() {
		this.sendPayload(
			buildPayload(
				PayloadType.PING,
			),
		);
	}

	private is_disconnected: boolean = false;

	disconnect() {
		if (this.is_disconnected === false) {
			const event = new ExtWSEvent(
				'disconnect',
				this,
				undefined,
			);

			this.dispatchEvent(event);
			this.server.dispatchEvent(event);

			this.is_disconnected = true;

			this.destroy();
		}

		this.server.clients.delete(this.id);
	}
}
