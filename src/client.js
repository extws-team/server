
import IP                 from '@kirick/ip';
import { customAlphabet } from 'nanoid';

import {
	GROUP_BROADCAST,
	GROUP_PREFIX,
	LISTENER_OPTIONS_ONCE,
	PAYLOAD_TYPE         } from './consts.js';
import * as ENCODER_JSON   from './payload/json.js';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);

export default class ExtWSClient extends EventTarget {
	#is_disconnected = false;

	id;
	driver;
	url;
	headers;
	ip;

	stat = {};

	constructor(
		driver,
		{
			url,
			headers,
			ip,
		},
	) {
		super();

		this.id = nanoid();
		this.driver = driver;

		if (url instanceof URL !== true) {
			throw new TypeError('Invalid URL.');
		}
		this.url = url;

		if (headers instanceof Headers !== true) {
			throw new TypeError('Invalid headers.');
		}
		this.headers = headers;

		if (ip instanceof IP !== true) {
			throw new TypeError('Invalid IP.');
		}
		this.ip = ip;

		// TODO:
		// switch (url.searchParams.get('encoding')) {
		// 	case 'cbor':
		// 		this.encoding = ENCODING.CBOR;
		// 		break;
		// 	default:
		// 		this.encoding = ENCODING.JSON;
		// }

		this.addToGroup(GROUP_BROADCAST);
	}

	#listeners = new Set();

	#addListener(...args) {
		this.addEventListener(...args);

		const off = () => {
			this.removeEventListener(...args);

			this.#listeners.delete(off);
		};

		this.#listeners.add(off);

		return off;
	}

	on(type, listener) {
		if (this.#is_disconnected) {
			throw new Error('Cannot add a listener to disconnected client.');
		}

		return this.#addListener(
			type,
			listener,
		);
	}

	once(type, listener) {
		if (this.#is_disconnected) {
			throw new Error('Cannot add a listener to disconnected client.');
		}

		return this.#addListener(
			type,
			listener,
			LISTENER_OPTIONS_ONCE,
		);
	}

	emit(type, data) {
		const event = new ExtWSClientEvent(
			this,
			type,
			data,
		);

		this.dispatchEvent(event);

		this.driver.server.dispatchEvent(event);
	}

	join(group_id) {
		this.addToGroup(
			GROUP_PREFIX + group_id,
		);
	}

	addToGroup() {
		throw new Error('Method "addToGroup(group_id)" must be defined by ExtWSClient extension.');
	}

	leave(group_id) {
		this.removeFromGroup(
			GROUP_PREFIX + group_id,
		);
	}

	removeFromGroup() {
		throw new Error('Method "removeFromGroup(group_id)" must be defined by ExtWSClient extension.');
	}

	sendPayload() {
		throw new Error('Method "sendPayload(payload)" must be defined by ExtWSClient extension.');
	}

	send(argument0, argument1) {
		this.sendPayload(
			ENCODER_JSON.buildMessagePayload(
				argument0,
				argument1,
			),
		);
	}

	ping() {
		this.sendPayload(
			ENCODER_JSON.buildPayload(
				PAYLOAD_TYPE.PING,
			),
		);
	}

	disconnect() {
		if (this.#is_disconnected === false) {
			this.emit('client.disconnect');

			this.#is_disconnected = true;

			for (const off of this.#listeners) {
				off();
			}
			this.#listeners.clear();
		}

		this.driver.clients.delete(this.id);
	}
}

export class ExtWSClientEvent extends Event {
	constructor(client, type, data) {
		if (type.startsWith('client.') === false) {
			throw new TypeError('Invalid event type.');
		}

		super(type);

		this.client = client;

		if (data) {
			this.data = data;
		}
	}
}
