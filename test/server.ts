import { IP } from '@kirick/ip';
import {
	ExtWS,
} from '../src/main.js';
import { ExtWSTestClient } from './client.js';
import { ExtWSClient } from '../src/client.js';

export class ExtWSTest extends ExtWS {
	open() {
		const client = new ExtWSTestClient(
			this,
			{
				url: new URL('http://ws'),
				headers: new Map(),
				ip: new IP('::1'),
			},
		);

		this.onConnect(client);

		return client;
	}

	onMessage(client: ExtWSClient, payload: string): void {
		super.onMessage(client, payload);
	}
}
