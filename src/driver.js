
import {
	GROUP_BROADCAST,
	IDLE_TIMEOUT,
	TIMEFRAME_PING_DISCONNECT,
	PAYLOAD_TYPE             } from './consts.js';
import * as ENCODER_JSON       from './payload/json.js';

const IDLE_TIMEOUT_DISCONNECT_MS = IDLE_TIMEOUT * 1e3;
const TIMEFRAME_PING_DISCONNECT_MS = TIMEFRAME_PING_DISCONNECT * 1e3;
const IDLE_TIMEOUT_PING_MS = IDLE_TIMEOUT_DISCONNECT_MS - TIMEFRAME_PING_DISCONNECT_MS;

export default class ExtWSDriver {
	clients = new Map();

	constructor() {
		this.#deferClientsWatch();
	}

	onConnect(client) {
		this.clients.set(
			client.id,
			client,
		);

		client.addToGroup(GROUP_BROADCAST);

		client.stat.ts_last_active = Date.now();

		client.sendPayload(
			ENCODER_JSON.buildPayload(
				PAYLOAD_TYPE.INIT,
				{
					id: client.id,
					idle_timeout: IDLE_TIMEOUT,
				},
			),
		);

		client.emit('client.connect');
	}

	onMessage(client, payload) {
		// console.log(new Date(), 'got message', client);

		client.stat.ts_last_active = Date.now();

		const {
			payload_type,
			event_type,
			data,
		} = ENCODER_JSON.parsePayload(payload);

		switch (payload_type) {
			case PAYLOAD_TYPE.PING:
				client.sendPayload(
					ENCODER_JSON.buildPayload(
						PAYLOAD_TYPE.PONG,
					),
				);
				break;
			case PAYLOAD_TYPE.MESSAGE:
				client.emit(
					'client.' + (event_type ?? 'message'),
					data,
				);
				break;
			// no default
		}
	}

	#deferClientsWatch() {
		setTimeout(
			() => {
				this.#pingSilentClients();
			},
			IDLE_TIMEOUT_PING_MS,
		);
	}

	#pingSilentClients() {
		const ts_now_ms = Date.now();

		for (const client of this.clients.values()) {
			const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);

			if (idle_ms >= IDLE_TIMEOUT_PING_MS) {
				client.ping();
			}
		}

		setTimeout(
			() => {
				this.#disconnectDeadClients();
			},
			TIMEFRAME_PING_DISCONNECT_MS,
		);
	}

	#disconnectDeadClients() {
		const ts_now_ms = Date.now();

		for (const client of this.clients.values()) {
			const idle_ms = ts_now_ms - (client.stat.ts_last_active ?? 0);

			if (idle_ms >= IDLE_TIMEOUT_DISCONNECT_MS) {
				client.disconnect(
					null, // is_already_disconnected
					true, // hard
				);
			}
		}

		this.#deferClientsWatch();
	}
}
