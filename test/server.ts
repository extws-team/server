import { IP } from '@kirick/ip';
import type { ClientOptions, ExtWSClient } from '../src/client.js';
import { ExtWS } from '../src/main.js';
import { ExtWSTestClient, type TestClientHookErrors } from './client.js';

export class TestPublishEvent extends Event {
	static type = 'test:publish';

	constructor(
		public group_id: string,
		public payload: string,
	) {
		super(TestPublishEvent.type);
	}
}

interface TestClientBaseOptions {
	url: URL;
	headers: Headers;
	ip: IP;
}

/** Builds fixture options while preserving the public conditional data contract. */
function createClientOptions<ClientData>(
	base: TestClientBaseOptions,
	data: ClientData | undefined,
): ClientOptions<ClientData>;
/** Builds fixture options while preserving the public conditional data contract. */
function createClientOptions(
	base: TestClientBaseOptions,
	data: unknown,
): TestClientBaseOptions & { data?: unknown } {
	return data === undefined ? base : { ...base, data };
}

export class ExtWSTest<ClientData = undefined> extends ExtWS<ClientData> {
	open(
		...[data, hook_errors]: undefined extends ClientData
			? [data?: ClientData, hook_errors?: TestClientHookErrors]
			: [data: ClientData, hook_errors?: TestClientHookErrors]
	): ExtWSTestClient<ClientData> {
		const options = createClientOptions<ClientData>(
			{
				url: new URL('http://ws'),
				headers: new Headers(),
				ip: new IP('::1'),
			},
			data,
		);
		const client = new ExtWSTestClient<ClientData>(this, options);
		client.hook_errors = hook_errors ?? {};

		this.onConnect(client);

		return client;
	}

	override onMessage(client: ExtWSClient<ClientData>, payload: string): void {
		super.onMessage(client, payload);
	}

	protected override publish(group_id: string, payload: string): void {
		this.dispatchEvent(new TestPublishEvent(group_id, payload));
	}
}
