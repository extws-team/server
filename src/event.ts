import { NeoEvent } from 'neoevents';
import type { ExtWSClient } from './main.js';

export class ExtWSEvent<
	D = unknown,
	TData extends Record<string, unknown> | undefined = undefined,
> extends NeoEvent<D> {
	constructor(
		type: string,
		public client: ExtWSClient<TData>,
		data: D,
	) {
		super(type, data);
	}
}
