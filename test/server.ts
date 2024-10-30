import { IP } from '@kirick/ip';
import {
	ExtWS,
} from '../src/main.js';
import { ExtWSTestClient } from './client.js';
import { ExtWSClient } from '../src/client.js';

interface LastPublish {
	group_id?: string;
	payload?: string;
}

export class TestPublishEvent extends Event {
	static type = 'test:publish';

	constructor(
		public group_id: string,
		public payload: string,
	) {
		super(TestPublishEvent.type);
	}
}

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

	protected publish(group_id: string, payload: string) {
		this.dispatchEvent(
			new TestPublishEvent(
				group_id,
				payload,
			),
		);
	}
}
