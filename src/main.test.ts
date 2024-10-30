import {
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from 'vitest';
import {
	TIMEFRAME_PING_DISCONNECT_MS,
	IDLE_TIMEOUT_PING_MS,
	GROUP_BROADCAST,
	GROUP_PREFIX,
} from '../src/consts.js';
import {
	ExtWSTest,
	TestPublishEvent,
} from '../test/server.js';
import { OutcomePayloadEventType } from './payload/outcome-event.js';

const server = new ExtWSTest();

interface OutcomePayload extends Event {
	group_id?: string;
	payload: string;
}

function shouldHang(promise: Promise<unknown>) {
	return new Promise((resolve, reject) => {
		setTimeout(
			resolve,
			100,
		);

		// eslint-disable-next-line promise/catch-or-return, promise/always-return
		promise.then(() => {
			reject(new Error('Promise resolved'));
		});

		promise.catch(() => {
			reject(new Error('Promise rejected'));
		});
	});
}

describe('ExtWS', () => {
	test('client connect', async () => {
		const promise = server.wait('connect');

		server.open();

		const event = await promise;

		expect(event.type).toBe('connect');
	});

	test('addToGroup', async () => {
		const promise = server.wait('test.addToGroup');

		server.open();

		const event = await promise;

		expect(event.data.group).toBe(GROUP_BROADCAST);
	});

	test('sendPayload', async () => {
		const promise = server.wait('test.sendPayload');
		server.open();

		const event = await promise;
		const startsWith = event.data.startsWith('1{"');
		expect(startsWith).toBe(true);
	});

	test('ping & disconnect if client is silent', async () => {
		vi.useFakeTimers();

		const server_local = new ExtWSTest();
		server_local.open();

		const promise_ping = server_local.wait('test.sendPayload');
		const promise_disconnect = server_local.wait('disconnect');

		vi.advanceTimersByTime(IDLE_TIMEOUT_PING_MS);
		const event_ping = await promise_ping;
		expect(event_ping).not.toBe(undefined);
		expect(event_ping.data).toBe('2');

		vi.advanceTimersByTime(TIMEFRAME_PING_DISCONNECT_MS);
		expect(
			await promise_disconnect,
		).not.toBe(undefined);

		vi.useRealTimers();
	});

	test('invalid payload', () => {
		const client = server.open();

		// invalid payload type
		server.onMessage(client, 'sdsdfsdfdsf{sdfsdf');

		// invalid event type
		server.onMessage(client, `4${'a'.repeat(32)}{"foo":"boo"}`);

		// invalid json
		server.onMessage(client, '4{"token":"#$344++399949","playerId":1720,"queryPlayerId":1720,"gameId":5577355},"method":"throwDices"}');
	});
});

describe('client', () => {
	describe('groups', () => {
		test('join', async () => {
			const client = server.open();
			const promise = server.wait('test.addToGroup');
			client?.join('foo');

			const event = await promise;
			expect(event.data.group).toBe(`${GROUP_PREFIX}foo`);
		});

		test('remove', async () => {
			const client = server.open();
			const promise = server.wait('test.removeFromGroup');
			client?.leave('foo');

			const event = await promise;
			expect(event.data.group).toBe(`${GROUP_PREFIX}foo`);
		});
	});

	test('manual disconnect', async () => {
		const client = server.open();
		const promise = server.wait('disconnect');

		client?.disconnect();

		const response = await promise;
		expect(response.type).toBe('disconnect');
	});
});

describe('client -> server', () => {
	test('onMessage with no type', async () => {
		const client = server.open();
		const promise = server.wait('message');
		server.onMessage(client, '4{"foo":"boo"}');

		const event = await promise;
		expect(event.data).toEqual({ foo: 'boo' });
		expect(event.type).toBe('message');
	});

	test('onMessage with type', async () => {
		const client = server.open();
		const promise = server.wait('extws');
		server.onMessage(client, '4extws{"foo":"boo"}');

		const event = await promise;
		expect(event.data).toEqual({ foo: 'boo' });
		expect(event.type).toBe('extws');
	});
});

describe('server -> client', () => {
	describe('client.send', () => {
		const client = server.open();

		test('()', async () => {
			const promise = server.wait('test.sendPayload');

			client.send();

			const event = await promise;
			expect(event.data).toStrictEqual('4');
		});

		test('(event_type)', async () => {
			const promise = server.wait('test.sendPayload');

			client.send('test');

			const event = await promise;
			expect(event.data).toStrictEqual('4test');
		});

		test('(data)', async () => {
			const promise = server.wait('test.sendPayload');

			client.send({ foo: 'bar' });

			const event = await promise;
			expect(event.data).toStrictEqual('4{"foo":"bar"}');
		});

		test('(event_type, data)', async () => {
			const promise = server.wait('test.sendPayload');

			client.send(
				'test',
				{ foo: 'bar' },
			);

			const event = await promise;
			expect(event.data).toStrictEqual('4test{"foo":"bar"}');
		});
	});

	describe('server.sendToSocket', () => {
		const client = server.open();

		test('(socket_id)', async () => {
			const promise = server.wait('test.sendPayload');

			server.sendToSocket(client.id);

			const event = await promise;
			expect(event.data).toStrictEqual('4');
		});

		test('(socket_id, event_type)', async () => {
			const promise = server.wait('test.sendPayload');

			server.sendToSocket(client.id, 'extws_event');

			const event = await promise;
			expect(event.data).toStrictEqual('4extws_event');
		});

		test('(socket_id, data)', async () => {
			const promise = server.wait('test.sendPayload');

			server.sendToSocket(client.id, { foo: 'bar' });

			const event = await promise;
			expect(event.data).toStrictEqual('4{"foo":"bar"}');
		});

		test('(socket_id, event_type, data)', async () => {
			const promise = server.wait('test.sendPayload');

			server.sendToSocket(client.id, 'extws_event', { foo: 'bar' });

			const event = await promise;
			expect(event.data).toStrictEqual('4extws_event{"foo":"bar"}');
		});
	});

	describe('server.sendToGroup', () => {
		test('(group_id)', async () => {
			const promise = server.wait<TestPublishEvent>(TestPublishEvent.type);

			server.sendToGroup('channel');

			const event = await promise;
			expect(event.group_id).toBe('g-channel');
			expect(event.payload).toBe('4');
		});

		test('(group_id, event_type)', async () => {
			const promise = server.wait<TestPublishEvent>(TestPublishEvent.type);

			server.sendToGroup('channel', 'extws_event');

			const event = await promise;
			expect(event.group_id).toBe('g-channel');
			expect(event.payload).toStrictEqual('4extws_event');
		});

		test('(group_id, data)', async () => {
			const promise = server.wait<TestPublishEvent>(TestPublishEvent.type);

			server.sendToGroup('channel', { foo: 'bar' });

			const event = await promise;
			expect(event.group_id).toBe('g-channel');
			expect(event.payload).toStrictEqual('4{"foo":"bar"}');
		});

		test('(group_id, event_type, data)', async () => {
			const promise = server.wait<TestPublishEvent>(TestPublishEvent.type);

			server.sendToGroup('channel', 'extws_event', { foo: 'bar' });

			const event = await promise;
			expect(event.group_id).toBe('g-channel');
			expect(event.payload).toStrictEqual('4extws_event{"foo":"bar"}');
		});
	});

	describe('server.broadcast', () => {
		test('()', async () => {
			const promise = server.wait<TestPublishEvent>(TestPublishEvent.type);

			server.broadcast();

			const event = await promise;
			expect(event.group_id).toStrictEqual('broadcast');
			expect(event.payload).toStrictEqual('4');
		});

		test('(event_type)', async () => {
			const promise = server.wait<TestPublishEvent>(TestPublishEvent.type);

			server.broadcast('extws_event');

			const event = await promise;
			expect(event.group_id).toStrictEqual('broadcast');
			expect(event.payload).toStrictEqual('4extws_event');
		});

		test('(data)', async () => {
			const promise = server.wait<TestPublishEvent>(TestPublishEvent.type);

			server.broadcast({ foo: 'bar' });

			const event = await promise;
			expect(event.group_id).toStrictEqual('broadcast');
			expect(event.payload).toStrictEqual('4{"foo":"bar"}');
		});

		test('(event_type, data)', async () => {
			const promise = server.wait<TestPublishEvent>(TestPublishEvent.type);

			server.broadcast('extws_event', { foo: 'bar' });

			const event = await promise;
			expect(event.group_id).toStrictEqual('broadcast');
			expect(event.payload).toStrictEqual('4extws_event{"foo":"bar"}');
		});
	});
});

describe('adapter', () => {
	describe('off', () => {
		beforeEach(() => {
			server.has_adapter = false;
		});

		test('sendToSocket', async () => {
			const promise = shouldHang(
				server.wait(OutcomePayloadEventType.SOCKET),
			);

			server.sendToSocket('777', { foo: 'bar' });

			await expect(promise).resolves.toBeUndefined();
		});

		test('sendToGroup', async () => {
			const promise = shouldHang(
				server.wait(OutcomePayloadEventType.GROUP),
			);

			server.sendToGroup('channel', { foo: 'bar' });

			await expect(promise).resolves.toBeUndefined();
		});

		test('broadcast', async () => {
			const promise = shouldHang(
				server.wait(OutcomePayloadEventType.BROADCAST),
			);

			server.broadcast({ foo: 'bar' });

			await expect(promise).resolves.toBeUndefined();
		});
	});

	describe('on', () => {
		beforeEach(() => {
			server.has_adapter = true;
		});

		test('sendToSocket', async () => {
			const promise = server.wait<OutcomePayload>(OutcomePayloadEventType.SOCKET);

			server.sendToSocket('777', { foo: 'bar' });

			const event = await promise;
			expect(event.payload).toStrictEqual('4{"foo":"bar"}');
		});

		test('sendToGroup', async () => {
			const promise = server.wait<OutcomePayload>(OutcomePayloadEventType.GROUP);

			server.sendToGroup('channel', { foo: 'bar' });

			const event = await promise;
			expect(event.payload).toStrictEqual('4{"foo":"bar"}');
		});

		test('broadcast', async () => {
			const promise = server.wait<OutcomePayload>(OutcomePayloadEventType.BROADCAST);

			server.broadcast({ foo: 'bar' });

			const event = await promise;
			expect(event.payload).toStrictEqual('4{"foo":"bar"}');
		});
	});
});
