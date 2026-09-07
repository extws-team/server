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

export interface ExtWSClientStat {
	ts_last_active: number;
	ts_pinged_for_activity?: number;
}

interface ClientBaseOptions {
	url: URL;
	headers: Headers;
	ip: IP;
}

export type ClientOptions<ClientData = undefined> = ClientBaseOptions &
	(undefined extends ClientData ? { data?: ClientData } : { data: ClientData });

export type ExtWSClientEventMap<ClientData> = {
	connect: ExtWSEvent<undefined, ClientData>;
	disconnect: ExtWSEvent<undefined, ClientData>;
} & Record<string, ExtWSEvent<unknown, ClientData>>;

/** Returns the data whose presence is enforced by ClientOptions. */
function getClientData<ClientData>(
	options: ClientOptions<ClientData>,
): ClientData;
/** Returns the data whose presence is enforced by ClientOptions. */
function getClientData(
	options: ClientBaseOptions & { data?: unknown },
): unknown {
	return options.data;
}

export class ExtWSClient<ClientData = undefined> extends NeoEventTarget<
	ExtWSClientEventMap<ClientData>
> {
	id: string;
	server: ExtWS<ClientData>;
	url: URL;
	headers: Headers;
	ip: IP;
	data: ClientData;
	stat: ExtWSClientStat = {
		ts_last_active: Date.now(),
	};

	constructor(server: ExtWS<ClientData>, options: ClientOptions<ClientData>) {
		super();

		this.id = nanoid();
		this.server = server;
		this.url = options.url;
		this.headers = options.headers;
		this.ip = options.ip;
		this.data = getClientData(options);
	}

	join(group_id: string): void {
		if (this.connection_state !== 'connected') {
			return;
		}

		this.addToChannel(CHANNEL_GROUP_PREFIX + group_id);
	}

	// oxlint-disable-next-line class-methods-use-this
	protected addToChannel(_channel_id: string): void {
		throw new Error(
			'Method "addToChannel(channel_id)" must be defined by ExtWSClient extension.',
		);
	}

	leave(group_id: string): void {
		if (this.connection_state !== 'connected') {
			return;
		}

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

	send(event_type_or_data?: PayloadData): void;
	send(event_type: string, data: PayloadData): void;
	send(arg0?: string | PayloadData, arg1?: PayloadData): void {
		if (this.connection_state !== 'connected') {
			return;
		}

		this.sendPayload(buildPayload(PayloadType.MESSAGE, arg0, arg1));
	}

	ping(): void {
		if (this.connection_state !== 'connected') {
			return;
		}

		this.sendPayload(buildPayload(PayloadType.PING));
	}

	// oxlint-disable-next-line class-methods-use-this
	protected closeTransport(): void {
		throw new Error(
			'Method "closeTransport()" must be defined by ExtWSClient extension.',
		);
	}

	private connection_state: 'connected' | 'disconnecting' | 'disconnected' =
		'connected';

	/** Requests physical transport close and finalizes the core lifecycle. */
	disconnect(): void {
		if (this.connection_state !== 'connected') {
			return;
		}

		this.connection_state = 'disconnecting';

		try {
			this.closeTransport();
		} finally {
			this.finalizeDisconnect();
		}
	}

	/** Finalizes the core lifecycle after the transport closes externally. */
	transportClosed(): void {
		this.finalizeDisconnect();
	}

	private finalizeDisconnect(): void {
		if (this.connection_state === 'disconnected') {
			return;
		}

		this.connection_state = 'disconnected';
		this.server.clients.delete(this.id);
		// @ts-expect-error Core lifecycle coordination with ExtWS.
		this.server.scheduleHealthcheck();

		const event = new ExtWSEvent('disconnect', this, undefined);

		try {
			this.dispatchEvent(event);
		} finally {
			try {
				this.server.dispatchEvent(event);
			} finally {
				this.destroy();
			}
		}
	}
}
