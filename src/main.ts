import {
	GROUP_BROADCAST,
	IDLE_TIMEOUT,
	IDLE_TIMEOUT_DISCONNECT_MS,
	TIMEFRAME_PING_DISCONNECT_MS,
	IDLE_TIMEOUT_PING_MS,
} from './consts.js';
import { ExtWSClient } from './client.js';
import {
	ExtWSEvent,
	ExtWSEventTarget,
} from './event-target.js';
import {
	buildPayload,
	parsePayload,
} from './payload/json.js';
import {
	PayloadType,
	type PayloadData,
} from './payload/types.js';
import {
	OutcomePayloadSocketEvent,
	OutcomePayloadGroupEvent,
	OutcomePayloadBroadcastEvent,
} from './payload/outcome-event.js';

export class ExtWS extends ExtWSEventTarget {
	clients: Map<string, ExtWSClient> = new Map();

	constructor() {
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
		payload: string,
	) {
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
		else {
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
		argument1?: string | PayloadData,
		argument2?: PayloadData,
	) {
		this.dispatchEvent(
			new OutcomePayloadGroupEvent(
				group_id,
				buildPayload(
					PayloadType.MESSAGE,
					argument1,
					argument2,
				),
			),
		);
	}

	broadcast(): void;
	broadcast(event_type: string): void;
	broadcast(data: PayloadData): void;
	broadcast(event_type: string, data: PayloadData): void;
	broadcast(
		arg0?: string | PayloadData,
		arg1?: PayloadData,
	): void {
		this.dispatchEvent(
			new OutcomePayloadBroadcastEvent(
				buildPayload(
					PayloadType.MESSAGE,
					arg0,
					arg1,
				),
			),
		);
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
}

export { ExtWSClient } from './client.js';
export { OutcomePayloadEventType } from './payload/outcome-event.js';
