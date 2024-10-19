import {
	ExtWSClient,
	type ClientOptions,
} from '../src/client.js';
import { ExtWSEvent } from '../src/event-target.js';
import { ExtWS } from '../src/main.js';

export class ExtWSTestClient extends ExtWSClient {
	private groups: Map<string, Set<ExtWSClient>>;

	constructor(server: ExtWS, options: ClientOptions) {
		super(server, options);
		this.groups = new Map();
	}

	protected sendPayload(payload: string) {
		const event = new ExtWSEvent(
			'test.sendPayload',
			this,
			payload,
		);

		this.server.dispatchEvent(event);
	}

	protected addToGroup(group_id: string) {
		const event = new ExtWSEvent(
			'test.addToGroup',
			this,
			{
				group: group_id,
			},
		);

		if (!this.groups.has(group_id)) {
			this.groups.set(group_id, new Set());
			this.server.dispatchEvent(event);
		}

		const group = this.groups.get(group_id);
		if (group) {
			group.add(this);
			this.server.dispatchEvent(event);
		}
	}

	protected removeFromGroup(group_id: string) {
		const event = new ExtWSEvent(
			'test.removeFromGroup',
			this,
			{
				group: group_id,
			},
		);

		this.groups.delete(group_id);
		this.server.dispatchEvent(event);
	}
}
