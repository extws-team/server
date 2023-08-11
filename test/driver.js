
import IP from '@kirick/ip';

import ExtWSClient from '../src/client.js';
import ExtWSDriver from '../src/driver.js';

export default class ExtWSTestDriver extends ExtWSDriver {
	publish(channel, payload) {
		const event = new Event('test.publish');
		event.channel = channel;
		event.payload = payload;

		this.server.dispatchEvent(event);
	}

	testConnect({
		url,
		headers,
		ip,
	} = {}) {
		const client = new ExtWSTestClient(
			this,
			{
				url: url ?? new URL('ws://localhost:8080'),
				headers: headers ?? new Headers(),
				ip: ip ?? new IP('127.0.0.1'),
			},
		);

		this.onConnect(client);
	}
}

class ExtWSTestClient extends ExtWSClient {
	#raw_client;

	constructor(...args) {
		super(...args);

		this.#raw_client = {
			groups: new Set(),
		};
	}

	addToGroup(group) {
		this.#raw_client.groups.add(group);

		this.emit(
			'client.test.addToGroup',
			{ group },
		);
	}

	removeFromGroup(group) {
		this.#raw_client.groups.delete(group);

		this.emit(
			'client.test.removeFromGroup',
			{ group },
		);
	}

	sendPayload(payload) {
		this.emit(
			'client.test.payload',
			payload,
		);
	}

	disconnect(
		is_already_disconnected = false,
		hard = false,
	) {
		if (hard === true) {
			this.dispatchEvent(
				new Event('test.client.disconnect_hard'),
			);
		}
		else if (is_already_disconnected !== true) {
			console.log(
				'[CLIENT] Soft disconnect.',
				this,
			);
		}

		super.disconnect();
	}
}
