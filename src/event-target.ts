import { LISTENER_OPTIONS_ONCE } from './consts.js';
import { ExtWSClient } from './main.js';

/**
 * DOM-like Events
 * node_modules/@types/node/dom-events.d.ts
 */
interface EventListenerOptions {
	/** Not directly used by Node.js. Added for API completeness. Default: `false`. */
	capture?: boolean;
}
interface AddEventListenerOptions extends EventListenerOptions {
	/** When `true`, the listener is automatically removed when it is first invoked. Default: `false`. */
	once?: boolean;
	/** When `true`, serves as a hint that the listener will not call the `Event` object's `preventDefault()` method. Default: false. */
	passive?: boolean;
	/** The listener will be removed when the given AbortSignal object's `abort()` method is called. */
	signal?: AbortSignal;
}
interface EventListener {
	(evt: Event): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ExtWSEvent<D = any> extends Event {
	constructor(
		type: string,
		public client: ExtWSClient,
		public data: D,
	) {
		super(type);
	}
}

export class ExtWSEventTarget extends EventTarget {
	listeners = new Set<() => void>();

	private addListener<const E extends Event>(
		type: string,
		listener: (event: E) => void,
		options?: AddEventListenerOptions | boolean,
	): () => void {
		this.addEventListener(
			type,
			listener as EventListener,
			options,
		);

		const off = () => {
			this.removeEventListener(
				type,
				listener as EventListener,
				options,
			);

			this.listeners.delete(off);
		};

		this.listeners.add(off);

		return off;
	}

	on<E extends Event = ExtWSEvent>(
		type: string,
		listener: (event: E) => void,
	): () => void {
		return this.addListener(
			type,
			listener,
		);
	}

	once<E extends Event = ExtWSEvent>(
		type: string,
		listener: (event: E) => void,
	): () => void {
		return this.addListener(
			type,
			listener,
			LISTENER_OPTIONS_ONCE,
		);
	}

	wait<E extends Event = ExtWSEvent>(type: string) {
		return new Promise<E>((resolve) => {
			this.once<E>(
				type,
				(event) => {
					resolve(event);
				},
			);
		});
	}

	protected destroy() {
		for (const off of this.listeners) {
			off();
		}

		this.listeners.clear();
	}
}
