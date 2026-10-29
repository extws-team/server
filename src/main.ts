import { NeoEventTarget } from 'neoevents';
import { ExtWSClient } from './client.js';
import {
	CHANNEL_BROADCAST,
	CHANNEL_GROUP_PREFIX,
	IDLE_TIMEOUT,
	TIMEFRAME_PING_DISCONNECT,
	WATCHDOG_INTERVAL_MS,
} from './consts.js';
import { ExtWSEvent } from './event.js';
import { buildPayload, parsePayload } from './payload/json.js';
import {
	OutcomePayloadChannelEvent,
	OutcomePayloadEventType,
	OutcomePayloadSocketEvent,
} from './payload/outcome-event.js';
import {
	type ExtWSOptions,
	type PayloadData,
	PayloadType,
} from './payload/types.js';

type EventMap<TData extends Record<string, unknown> | undefined> = {
	connect: ExtWSEvent<undefined, TData>;
	disconnect: ExtWSEvent<undefined, TData>;
	[OutcomePayloadEventType.SOCKET]: OutcomePayloadSocketEvent;
	[OutcomePayloadEventType.CHANNEL]: OutcomePayloadChannelEvent;
} & Record<string, ExtWSEvent<unknown, TData>>;

export class ExtWS<
	TData extends Record<string, unknown> | undefined = undefined,
> extends NeoEventTarget<EventMap<TData>> {
	clients: Map<string, ExtWSClient<TData>> = new Map<
		string,
		ExtWSClient<TData>
	>();
	has_adapter = false;

	constructor({
		idleTimeout = IDLE_TIMEOUT,
		pingTimeout = TIMEFRAME_PING_DISCONNECT,
	}: ExtWSOptions = {}) {
		super();

		if (
			!(
				Number.isFinite(idleTimeout)
				&& pingTimeout > 0
				&& pingTimeout < idleTimeout
			)
		) {
			throw new RangeError(
				`Options must satisfy 0 < pingTimeout < idleTimeout, got pingTimeout ${pingTimeout} and idleTimeout ${idleTimeout}.`,
			);
		}

		this.#idle_timeout = idleTimeout;
		this.#ping_timeout_ms = pingTimeout * 1e3;
		this.#idle_ping_ms = (idleTimeout - pingTimeout) * 1e3;
	}

	protected onConnect(client: ExtWSClient<TData>): void {
		this.clients.set(client.id, client);

		if (this.#timeout_watchdog === undefined) {
			// no client can need a ping earlier than that
			this.#scheduleWatchdog(this.#idle_ping_ms);
		}

		client.addToChannel(CHANNEL_BROADCAST);
		client.sendPayload(
			buildPayload(PayloadType.INIT, {
				id: client.id,
				idle_timeout: this.#idle_timeout,
			}),
		);

		const event = new ExtWSEvent('connect', client, undefined);

		client.dispatchEvent(event);
		this.dispatchEvent(event);
	}

	protected onMessage(
		client: ExtWSClient<TData>,
		payload: string | Buffer,
	): void {
		if (Buffer.isBuffer(payload)) {
			payload = payload.toString('utf8');
		}

		client.stat.ts_last_active = Date.now();
		client.stat.ts_ping = undefined;

		const { payload_type, event_type, data } = parsePayload(payload);

		switch (payload_type) {
			case PayloadType.PING:
				client.sendPayload(buildPayload(PayloadType.PONG));
				break;

			case PayloadType.MESSAGE: {
				const event = new ExtWSEvent(event_type ?? 'message', client, data);

				client.dispatchEvent(event);
				this.dispatchEvent(event);

				break;
			}

			// no default
		}
	}

	sendToSocket(socket_id: string, data?: PayloadData): void;
	sendToSocket(socket_id: string, event_type: string, data?: PayloadData): void;
	sendToSocket(
		socket_id: string,
		arg1?: string | PayloadData,
		arg2?: PayloadData,
	) {
		const client = this.clients.get(socket_id);
		if (client instanceof ExtWSClient) {
			if (typeof arg1 === 'string') {
				client.send(arg1, arg2);
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

	sendToGroup(group_id: string, data?: PayloadData): void;
	sendToGroup(group_id: string, event_type: string, data?: PayloadData): void;
	sendToGroup(
		group_id: string,
		arg1?: string | PayloadData,
		arg2?: PayloadData,
	) {
		const channel_id = CHANNEL_GROUP_PREFIX + group_id;
		const payload = buildPayload(PayloadType.MESSAGE, arg1, arg2);

		this.publish(channel_id, payload);

		if (this.has_adapter) {
			this.dispatchEvent(new OutcomePayloadChannelEvent(channel_id, payload));
		}
	}

	broadcast(data?: PayloadData): void;
	broadcast(event_type: string, data?: PayloadData): void;
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
	 * @internal
	 * @param _channel_id -
	 * @param _payload -
	 */
	// oxlint-disable-next-line class-methods-use-this
	publish(_channel_id: string, _payload: string): void {
		throw new Error('Method not implemented.');
	}

	#idle_timeout: number;
	#ping_timeout_ms: number;
	#idle_ping_ms: number;
	#timeout_watchdog: ReturnType<typeof setTimeout> | undefined;

	#scheduleWatchdog(delay_ms: number) {
		// unref: the watchdog alone must never keep the process alive
		this.#timeout_watchdog = setTimeout(() => {
			this.#runWatchdog();
		}, delay_ms).unref();
	}

	#runWatchdog() {
		const ts_now_ms = Date.now();

		for (const client of this.clients.values()) {
			const { stat } = client;

			if (stat.ts_ping !== undefined) {
				if (ts_now_ms - stat.ts_ping >= this.#ping_timeout_ms) {
					client.disconnect();
				}
			} else if (ts_now_ms - stat.ts_last_active >= this.#idle_ping_ms) {
				client.ping();
				stat.ts_ping = ts_now_ms;
			}
		}

		if (this.clients.size > 0) {
			this.#scheduleWatchdog(WATCHDOG_INTERVAL_MS);
		} else {
			// the next client to connect starts the watchdog again
			this.#timeout_watchdog = undefined;
		}
	}

	/**
	 * Stops the server. WebSocket server implementation should override this method and call `super.close()` once its own teardown is done.
	 * @returns -
	 */
	close(): Promise<void> {
		clearTimeout(this.#timeout_watchdog);
		this.destroy();

		return Promise.resolve();
	}
}

export { ExtWSClient } from './client.js';
export { ExtWSEvent } from './event.js';
