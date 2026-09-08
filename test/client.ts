import { ExtWSClient } from '../src/client.js';
import { ExtWSEvent } from '../src/event.js';

export class ExtWSTestClient extends ExtWSClient {
	private channels = new Map<string, Set<ExtWSClient>>();

	protected override sendPayload(payload: string): void {
		const event = new ExtWSEvent('test.sendPayload', this, payload);

		this.server.dispatchEvent(event);
	}

	protected override addToChannel(channel_id: string): void {
		const event = new ExtWSEvent('test.addToChannel', this, {
			channel: channel_id,
		});

		if (!this.channels.has(channel_id)) {
			this.channels.set(channel_id, new Set());
			this.server.dispatchEvent(event);
		}

		const group = this.channels.get(channel_id);
		if (group) {
			group.add(this);
			this.server.dispatchEvent(event);
		}
	}

	protected override removeFromChannel(channel_id: string): void {
		const event = new ExtWSEvent('test.removeFromChannel', this, {
			channel: channel_id,
		});

		this.channels.delete(channel_id);
		this.server.dispatchEvent(event);
	}
}
