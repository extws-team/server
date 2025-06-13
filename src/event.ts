import { NeoEvent } from 'neoevents';
import type { ExtWSClient } from './main.js';

export class ExtWSEvent<D = unknown> extends NeoEvent<D> {
	constructor(
		type: string,
		public client: ExtWSClient,
		data: D,
	) {
		super(type, data);
	}
}
