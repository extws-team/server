import { NeoEvent } from 'neoevents';
import type { ExtWSClient } from './client.js';

export class ExtWSEvent<D = unknown, ClientData = unknown> extends NeoEvent<D> {
	constructor(
		type: string,
		public client: ExtWSClient<ClientData>,
		data: D,
	) {
		super(type, data);
	}
}
