import { ExtWSClient } from '../src/client.js';
import { ExtWSEvent } from '../src/event.js';

export interface TestClientHookErrors {
	addToChannel?: Error;
	closeTransport?: Error;
	removeFromChannel?: Error;
	sendPayload?: Error;
}

export class ExtWSTestClient<
	ClientData = undefined,
> extends ExtWSClient<ClientData> {
	private channels = new Map<string, Set<ExtWSClient<ClientData>>>();
	hook_errors: TestClientHookErrors = {};
	hook_calls = {
		addToChannel: 0,
		closeTransport: 0,
		removeFromChannel: 0,
		sendPayload: 0,
	};
	close_transport_synchronously = false;

	protected override sendPayload(payload: string): void {
		this.hook_calls.sendPayload++;

		if (this.hook_errors.sendPayload) {
			throw this.hook_errors.sendPayload;
		}

		const event = new ExtWSEvent('test.sendPayload', this, payload);

		this.server.dispatchEvent(event);
	}

	protected override addToChannel(channel_id: string): void {
		this.hook_calls.addToChannel++;

		if (this.hook_errors.addToChannel) {
			throw this.hook_errors.addToChannel;
		}

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
		this.hook_calls.removeFromChannel++;

		if (this.hook_errors.removeFromChannel) {
			throw this.hook_errors.removeFromChannel;
		}

		const event = new ExtWSEvent('test.removeFromChannel', this, {
			channel: channel_id,
		});

		this.channels.delete(channel_id);
		this.server.dispatchEvent(event);
	}

	protected override closeTransport(): void {
		this.hook_calls.closeTransport++;

		if (this.hook_errors.closeTransport) {
			throw this.hook_errors.closeTransport;
		}

		if (this.close_transport_synchronously) {
			this.transportClosed();
		}
	}
}
