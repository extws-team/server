import { NeoEventTarget } from 'neoevents';
import { ExtWSClient } from './client.js';
import {
	CHANNEL_BROADCAST,
	CHANNEL_GROUP_PREFIX,
	IDLE_TIMEOUT,
	TIMEFRAME_PING_DISCONNECT,
} from './consts.js';
import { ExtWSEvent } from './event.js';
import { buildPayload, parsePayload } from './payload/json.js';
import {
	OutcomePayloadChannelEvent,
	OutcomePayloadEventType,
	OutcomePayloadSocketEvent,
} from './payload/outcome-event.js';
import { type PayloadData, PayloadType } from './payload/types.js';
import { RESERVED_EVENT_TYPES } from './reserved-events.js';

const MAX_TIMEOUT_MS = 2_147_483_647;

export interface ExtWSHealthcheckOptions {
	idle_timeout?: number;
	timeframe_ping_disconnect?: number;
}

export interface ExtWSOptions {
	healthcheck?: ExtWSHealthcheckOptions;
}

export interface ExtWSHealthcheck {
	idle_timeout: number;
	timeframe_ping_disconnect: number;
	idle_timeout_disconnect_ms: number;
	timeframe_ping_disconnect_ms: number;
	idle_timeout_ping_ms: number;
}

/**
 * Validates a healthcheck timeout value.
 * @param name Option name used in validation errors.
 * @param value Value to validate.
 * @returns The validated timeout in seconds.
 */
function validateTimeout(name: string, value: unknown): number {
	if (typeof value !== 'number') {
		throw new TypeError(`Healthcheck option "${name}" must be a number.`);
	}

	if (!Number.isFinite(value) || value < 0) {
		throw new RangeError(
			`Healthcheck option "${name}" must be a finite, non-negative number.`,
		);
	}

	return value;
}

export type ExtWSEventMap<ClientData> = {
	connect: ExtWSEvent<undefined, ClientData>;
	disconnect: ExtWSEvent<undefined, ClientData>;
	[OutcomePayloadEventType.SOCKET]: OutcomePayloadSocketEvent;
	[OutcomePayloadEventType.CHANNEL]: OutcomePayloadChannelEvent;
} & Record<string, ExtWSEvent<unknown, ClientData>>;

export class ExtWS<ClientData = undefined> extends NeoEventTarget<
	ExtWSEventMap<ClientData>
> {
	clients: Map<string, ExtWSClient<ClientData>> = new Map<
		string,
		ExtWSClient<ClientData>
	>();
	has_adapter = false;
	readonly healthcheck: ExtWSHealthcheck;
	private healthcheck_timeout?: ReturnType<typeof setTimeout>;
	private is_closed = false;

	constructor({ healthcheck = {} }: ExtWSOptions = {}) {
		super();

		const idle_timeout = validateTimeout(
			'idle_timeout',
			healthcheck.idle_timeout ?? IDLE_TIMEOUT,
		);
		const timeframe_ping_disconnect = validateTimeout(
			'timeframe_ping_disconnect',
			healthcheck.timeframe_ping_disconnect ?? TIMEFRAME_PING_DISCONNECT,
		);

		if (timeframe_ping_disconnect >= idle_timeout) {
			throw new RangeError(
				'Healthcheck option "timeframe_ping_disconnect" must be less than "idle_timeout".',
			);
		}

		const idle_timeout_disconnect_ms = idle_timeout * 1e3;
		const timeframe_ping_disconnect_ms = timeframe_ping_disconnect * 1e3;

		this.healthcheck = {
			idle_timeout,
			timeframe_ping_disconnect,
			idle_timeout_disconnect_ms,
			timeframe_ping_disconnect_ms,
			idle_timeout_ping_ms:
				idle_timeout_disconnect_ms - timeframe_ping_disconnect_ms,
		};
	}

	/**
	 * Removes state created by a failed client initialization.
	 * @param client Client whose initialization failed.
	 * @param initialization_error Error raised by the transport hook.
	 */
	private rollbackClientConnection(
		client: ExtWSClient<ClientData>,
		initialization_error: unknown,
	): void {
		this.clients.delete(client.id);

		try {
			// @ts-expect-error Property is protected
			client.removeFromChannel(CHANNEL_BROADCAST);
		} catch (error) {
			throw new AggregateError(
				[initialization_error, error],
				'Failed to initialize client and roll back its broadcast subscription.',
			);
		}
	}

	protected onConnect(client: ExtWSClient<ClientData>): void {
		if (this.is_closed) {
			client.disconnect();
			return;
		}

		this.clients.set(client.id, client);

		try {
			// @ts-expect-error Property is protected
			client.addToChannel(CHANNEL_BROADCAST);
			// @ts-expect-error Property is protected
			client.sendPayload(
				buildPayload(PayloadType.INIT, {
					id: client.id,
					idle_timeout: this.healthcheck.idle_timeout,
				}),
			);
		} catch (error) {
			this.rollbackClientConnection(client, error);
			throw error;
		}

		this.scheduleHealthcheck();

		const event = new ExtWSEvent('connect', client, undefined);

		client.dispatchEvent(event);
		this.dispatchEvent(event);
	}

	protected onMessage(
		client: ExtWSClient<ClientData>,
		payload: string | Buffer,
	): void {
		if (Buffer.isBuffer(payload)) {
			payload = payload.toString('utf8');
		}

		client.stat.ts_last_active = Date.now();
		client.stat.ts_pinged_for_activity = undefined;
		this.scheduleHealthcheck();

		const { payload_type, event_type, data } = parsePayload(payload);

		switch (payload_type) {
			case PayloadType.PING:
				// @ts-expect-error using private property
				client.sendPayload(buildPayload(PayloadType.PONG));
				break;

			case PayloadType.MESSAGE: {
				if (event_type && RESERVED_EVENT_TYPES.has(event_type)) {
					break;
				}

				const event = new ExtWSEvent(event_type ?? 'message', client, data);

				client.dispatchEvent(event);
				this.dispatchEvent(event);
				break;
			}

			// no default
		}
	}

	sendToSocket(socket_id: string, event_type_or_data?: PayloadData): void;
	sendToSocket(socket_id: string, event_type: string, data: PayloadData): void;
	sendToSocket(
		socket_id: string,
		arg1?: string | PayloadData,
		arg2?: PayloadData,
	): void {
		const client = this.clients.get(socket_id);
		if (client instanceof ExtWSClient) {
			if (arg2 !== undefined) {
				client.send(arg1 as string, arg2);
			} else if (arg1 === undefined) {
				client.send();
			} else {
				client.send(arg1);
			}
		} else if (this.has_adapter) {
			this.dispatchEvent(
				new OutcomePayloadSocketEvent(
					socket_id,
					buildPayload(PayloadType.MESSAGE, arg1, arg2),
				),
			);
		}
	}

	sendToGroup(group_id: string, event_type_or_data?: PayloadData): void;
	sendToGroup(group_id: string, event_type: string, data: PayloadData): void;
	sendToGroup(
		group_id: string,
		arg1?: string | PayloadData,
		arg2?: PayloadData,
	): void {
		const channel_id = CHANNEL_GROUP_PREFIX + group_id;
		const payload = buildPayload(PayloadType.MESSAGE, arg1, arg2);

		this.publish(channel_id, payload);

		if (this.has_adapter) {
			this.dispatchEvent(new OutcomePayloadChannelEvent(channel_id, payload));
		}
	}

	broadcast(event_type_or_data?: PayloadData): void;
	broadcast(event_type: string, data: PayloadData): void;
	broadcast(arg0?: string | PayloadData, arg1?: PayloadData): void {
		const payload = buildPayload(PayloadType.MESSAGE, arg0, arg1);

		this.publish(CHANNEL_BROADCAST, payload);

		if (this.has_adapter) {
			this.dispatchEvent(
				new OutcomePayloadChannelEvent(CHANNEL_BROADCAST, payload),
			);
		}
	}

	/**
	 * Sends a message to a specific group of clients. THis method should be implemented by WebSocket server implementation.
	 * @param _channel_id -
	 * @param _payload -
	 */
	// oxlint-disable-next-line class-methods-use-this
	protected publish(_channel_id: string, _payload: string): void {
		throw new Error('Method not implemented.');
	}

	private scheduleHealthcheck(): void {
		if (this.healthcheck_timeout) {
			clearTimeout(this.healthcheck_timeout);
			this.healthcheck_timeout = undefined;
		}

		if (this.is_closed || this.clients.size === 0) {
			return;
		}

		const ts_now_ms = Date.now();
		let next_deadline_ms = Infinity;

		for (const client of this.clients.values()) {
			const { ts_last_active, ts_pinged_for_activity } = client.stat;
			const deadline_ms =
				ts_last_active
				+ (ts_pinged_for_activity === ts_last_active
					? this.healthcheck.idle_timeout_disconnect_ms
					: this.healthcheck.idle_timeout_ping_ms);
			next_deadline_ms = Math.min(next_deadline_ms, deadline_ms);
		}

		this.healthcheck_timeout = setTimeout(
			() => {
				this.healthcheck_timeout = undefined;
				this.checkClientsHealth();
			},
			Math.min(MAX_TIMEOUT_MS, Math.max(0, next_deadline_ms - ts_now_ms)),
		);
	}

	private checkClientsHealth(): void {
		const ts_now_ms = Date.now();

		for (const client of this.clients.values()) {
			const { ts_last_active } = client.stat;
			const idle_ms = ts_now_ms - ts_last_active;

			if (
				idle_ms >= this.healthcheck.idle_timeout_ping_ms
				&& client.stat.ts_pinged_for_activity !== ts_last_active
			) {
				client.stat.ts_pinged_for_activity = ts_last_active;

				try {
					client.ping();
				} catch {
					// A failed transport must not stop healthchecks for other clients.
				}
			}

			if (idle_ms >= this.healthcheck.idle_timeout_disconnect_ms) {
				try {
					client.disconnect();
				} catch {
					// disconnect() still finalizes core state when transport close fails.
				}
			}
		}

		this.scheduleHealthcheck();
	}

	close(): Promise<void> {
		if (this.is_closed) {
			return Promise.resolve();
		}

		this.is_closed = true;

		if (this.healthcheck_timeout) {
			clearTimeout(this.healthcheck_timeout);
			this.healthcheck_timeout = undefined;
		}

		const errors: unknown[] = [];
		for (const client of this.clients.values()) {
			try {
				client.disconnect();
			} catch (error) {
				errors.push(error);
			}
		}

		if (errors.length > 0) {
			return Promise.reject(
				new AggregateError(errors, 'Failed to close one or more clients.'),
			);
		}

		return Promise.resolve();
	}
}

export {
	type ClientOptions,
	ExtWSClient,
	type ExtWSClientEventMap,
	type ExtWSClientStat,
} from './client.js';
export { ExtWSEvent } from './event.js';
