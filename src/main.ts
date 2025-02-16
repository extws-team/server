import { NeoEventTarget } from 'neoevents';
import {
	GROUP_PREFIX,
	GROUP_BROADCAST,
	IDLE_TIMEOUT,
	IDLE_TIMEOUT_DISCONNECT_MS,
	TIMEFRAME_PING_DISCONNECT_MS,
	IDLE_TIMEOUT_PING_MS,
} from './consts.js';
import { ExtWSClient } from './client.js';
import { ExtWSEvent } from './event.js';
import {
	buildPayload,
	parsePayload,
} from './payload/json.js';
import {
	PayloadType,
	type PayloadData,
	type ExtWSOnBeforeUpgradeHandler,
} from './payload/types.js';
import {
	EVENT_TYPE_SOCKET,
	EVENT_TYPE_GROUP,
	EVENT_TYPE_BROADCAST,
	OutcomePayloadSocketEvent,
	OutcomePayloadGroupEvent,
	OutcomePayloadBroadcastEvent,
} from './payload/outcome-event.js';

type EventMap = {
	connect: ExtWSEvent<undefined>,
	disconnect: ExtWSEvent<undefined>,
	[EVENT_TYPE_SOCKET]: OutcomePayloadSocketEvent,
	[EVENT_TYPE_GROUP]: OutcomePayloadGroupEvent,
	[EVENT_TYPE_BROADCAST]: OutcomePayloadBroadcastEvent,
} & {
	[key: string]: ExtWSEvent,
};

export class ExtWS extends NeoEventTarget<EventMap> {
	clients: Map<string, ExtWSClient> = new Map();
	has_adapter: boolean = false;

	constructor(protected options: {
		// TODO: replace with Response
		onBeforeUpgrade?: ExtWSOnBeforeUpgradeHandler,
	}) {
		super();

		this.deferClientsWatch();
	}

	protected onConnect(client: ExtWSClient) {
		this.clients.set(
			client.id,
			client,
		);

		// @ts-expect-error Property is protected
		client.addToGroup(
			GROUP_BROADCAST,
		);
		// @ts-expect-error Property is protected
		client.sendPayload(
			buildPayload(
				PayloadType.INIT,
				{
					id: client.id,
					idle_timeout: IDLE_TIMEOUT,
				},
			),
		);

		const event = new ExtWSEvent(
			'connect',
			client,
			undefined,
		);

		client.dispatchEvent(event);
		this.dispatchEvent(event);
	}

	protected onMessage(
		client: ExtWSClient,
		payload: string | Buffer,
	) {
		if (Buffer.isBuffer(payload)) {
			payload = payload.toString('utf8');
		}

		client.stat.ts_last_active = Date.now();

		const {
			payload_type,
			event_type,
			data,
		} = parsePayload(payload);

		switch (payload_type) {
			case PayloadType.PING:
				// @ts-expect-error using private property
				client.sendPayload(
					buildPayload(
						PayloadType.PONG,
					),
				);
				break;

			case PayloadType.MESSAGE: {
				const event = new ExtWSEvent(
					event_type ?? 'message',
					client,
					data,
				);

				client.dispatchEvent(event);
				this.dispatchEvent(event);
			} break;

			// no default
		}
	}

	sendToSocket(socket_id: string): void;
	sendToSocket(socket_id: string, event_type: string): void;
	sendToSocket(socket_id: string, data: PayloadData): void;
	sendToSocket(socket_id: string, event_type: string, data: PayloadData): void;
	sendToSocket(
		socket_id: string,
		arg1?: string | PayloadData,
		arg2?: PayloadData,
	) {
		const client = this.clients.get(socket_id);
		if (client instanceof ExtWSClient) {
			client.send(arg1, arg2);
		}
		else if (this.has_adapter) {
			this.dispatchEvent(
				new OutcomePayloadSocketEvent(
					socket_id,
					buildPayload(
						PayloadType.MESSAGE,
						arg1,
						arg2,
					),
				),
			);
		}
	}

	sendToGroup(group_id: string): void;
	sendToGroup(group_id: string, event_type: string): void;
	sendToGroup(group_id: string, data: PayloadData): void;
	sendToGroup(group_id: string, event_type: string, data: PayloadData): void;
	sendToGroup(
		group_id: string,
		arg1?: string | PayloadData,
		arg2?: PayloadData,
	) {
		const payload = buildPayload(
			PayloadType.MESSAGE,
			arg1,
			arg2,
		);

		this.publish(
			`${GROUP_PREFIX}${group_id}`,
			payload,
		);

		if (this.has_adapter) {
			this.dispatchEvent(
				new OutcomePayloadGroupEvent(
					group_id,
					payload,
				),
			);
		}
	}

	broadcast(): void;
	broadcast(event_type: string): void;
	broadcast(data: PayloadData): void;
	broadcast(event_type: string, data: PayloadData): void;
	broadcast(
		arg0?: string | PayloadData,
		arg1?: PayloadData,
	): void {
		const payload = buildPayload(
			PayloadType.MESSAGE,
			arg0,
			arg1,
		);

		this.publish(
			GROUP_BROADCAST,
			payload,
		);

		if (this.has_adapter) {
			this.dispatchEvent(
				new OutcomePayloadBroadcastEvent(payload),
			);
		}
	}

	/**
	 * Sends a message to a specific group of clients. THis method should be implemented by WebSocket server implementation.
	 * @param _channel -
	 * @param _payload -
	 */
	// eslint-disable-next-line class-methods-use-this
	protected publish(
		_channel: string,
		_payload: string,
	) {
		throw new Error('Method not implemented.');
	}

	private deferClientsWatch() {
		setTimeout(
			() => {
				this.pingSilentClients();
			},
			IDLE_TIMEOUT_PING_MS,
		);
	}

	private pingSilentClients() {
		const ts_now_ms = Date.now();

		for (const client of this.clients.values()) {
			const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);

			if (idle_ms >= IDLE_TIMEOUT_PING_MS) {
				client.ping();
			}
		}

		setTimeout(
			() => {
				this.disconnectDeadClients();
			},
			TIMEFRAME_PING_DISCONNECT_MS,
		);
	}

	private disconnectDeadClients() {
		const ts_now_ms = Date.now();

		for (const client of this.clients.values()) {
			const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);

			if (idle_ms >= IDLE_TIMEOUT_DISCONNECT_MS) {
				client.disconnect();
			}
		}

		this.deferClientsWatch();
	}

	// eslint-disable-next-line class-methods-use-this
	close(): Promise<void> {
		throw new Error('Method not implemented.');
	}
}

export { ExtWSClient } from './client.js';
export { ExtWSEvent } from './event.js';
