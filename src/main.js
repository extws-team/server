
import ExtWSClient          from './client.js';
import {
	GROUP_PREFIX,
	GROUP_BROADCAST,
	LISTENER_OPTIONS_ONCE } from './consts.js';
import ExtWSDriver          from './driver.js';
import * as ENCODER_JSON    from './payload/json.js';

export default class ExtWS extends EventTarget {
	driver;

	constructor({
		driver,
		// adapter,
	}) {
		super();

		if (driver instanceof ExtWSDriver !== true) {
			throw new TypeError('Invalid driver.');
		}
		this.driver = driver;
		this.driver.server = this;

		// TODO: adapter
	}

	get clients() {
		return this.driver.clients;
	}

	#addListener(...args) {
		this.addEventListener(...args);

		return () => {
			this.removeEventListener(...args);
		};
	}

	on(type, listener) {
		return this.#addListener(
			type,
			listener,
		);
	}

	once(type, listener) {
		return this.#addListener(
			type,
			listener,
			LISTENER_OPTIONS_ONCE,
		);
	}

	#sendPayload(
		payload,
		socket_id = null,
		group_id = null,
		is_broadcast = false,
		// is_from_adapter = false,
	) {
		if (typeof socket_id === 'string') {
			const client = this.clients.get(socket_id);
			if (client instanceof ExtWSClient) {
				client.emit(payload);
			}
		}
		else if (typeof group_id === 'string') {
			this.driver.publish(
				GROUP_PREFIX + group_id,
				payload,
			);
		}
		else if (is_broadcast) {
			this.driver.publish(
				GROUP_BROADCAST,
				payload,
			);
		}

		// TODO: adapter
		// if (
		// 	!is_from_adapter
		// 	&& this._adapter
		// ) {
		// 	this._adapter.publish(
		// 		payload,
		// 		socket_id,
		// 		group_id,
		// 		is_broadcast,
		// 	);
		// }
	}

	sendToSocket(socket_id, argument1, argument2) {
		this.#sendPayload(
			ENCODER_JSON.buildMessagePayload(
				argument1,
				argument2,
			),
			socket_id,
		);
	}

	sendToGroup(group_id, argument1, argument2) {
		this.#sendPayload(
			ENCODER_JSON.buildMessagePayload(
				argument1,
				argument2,
			),
			null,
			group_id,
		);
	}

	broadcast(argument0, argument1) {
		this.#sendPayload(
			ENCODER_JSON.buildMessagePayload(
				argument0,
				argument1,
			),
			null,
			null,
			true,
		);
	}
}

export { default as ExtWSClient } from './client.js';
export { default as ExtWSDriver } from './driver.js';
