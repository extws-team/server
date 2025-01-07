import { NeoEvent } from 'neoevents';
import { ExtWSClient } from './main.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ExtWSEvent<D = any> extends NeoEvent {
	constructor(
		type: string,
		public client: ExtWSClient,
		public data: D,
	) {
		super(type, data);
	}
}
