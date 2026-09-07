// oxlint-disable max-lines-per-function max-lines
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CHANNEL_BROADCAST, CHANNEL_GROUP_PREFIX } from '../src/consts.js';
import { ExtWSTest, TestPublishEvent } from '../test/server.js';
import type { ExtWSEvent } from './event.js';
import { OutcomePayloadEventType } from './payload/outcome-event.js';

const server = new ExtWSTest();

/**
 * Resolves if the given promise hangs.
 * @param promise The promise to check.
 * @returns -
 */
function shouldHang(promise: Promise<unknown>) {
	return Promise.race([
		new Promise<void>((resolve) => {
			setTimeout(resolve, 100);
		}),
		(async () => {
			try {
				await promise;
			} catch {
				throw new Error('Promise rejected');
			}

			throw new Error('Promise resolved');
		})(),
	]);
}

describe('ExtWS', () => {
	test('client connect', async () => {
		const promise = server.wait('connect');

		server.open();

		const event = await promise;

		expect(event.type).toBe('connect');
	});

	test('client data', async () => {
		const server_with_data = new ExtWSTest<{ user_id: string }>();
		const promise = server_with_data.wait('connect');

		server_with_data.open({ user_id: 'initial' });

		const { client } = await promise;
		expect(client.data.user_id).toBe('initial');

		client.data = { user_id: 'updated' };
		expect(client.data.user_id).toBe('updated');
	});

	test('addToGroup', async () => {
		const promise = server.wait('test.addToChannel');

		server.open();

		const event = await promise;

		expect(event.detail).toStrictEqual({
			channel: CHANNEL_BROADCAST,
		});
	});

	test('sendPayload', async () => {
		const promise = server.wait('test.sendPayload');
		server.open();

		const event = (await promise) as ExtWSEvent<string>;
		const startsWith = event.detail.startsWith('1{"');
		expect(startsWith).toBe(true);
	});

	test('healthcheck runs on exact client deadlines', async () => {
		vi.useFakeTimers();

		const server_local = new ExtWSTest({
			healthcheck: { idle_timeout: 10, timeframe_ping_disconnect: 2 },
		});

		try {
			const client = server_local.open();
			expect(client.hook_calls.sendPayload).toBe(1);

			vi.advanceTimersByTime(7999);
			expect(client.hook_calls.sendPayload).toBe(1);
			expect(client.hook_calls.closeTransport).toBe(0);

			vi.advanceTimersByTime(1);
			expect(client.hook_calls.sendPayload).toBe(2);

			vi.advanceTimersByTime(1999);
			expect(client.hook_calls.closeTransport).toBe(0);

			vi.advanceTimersByTime(1);
			expect(client.hook_calls.closeTransport).toBe(1);
			expect(server_local.clients.size).toBe(0);
		} finally {
			await server_local.close();
			vi.useRealTimers();
		}
	});

	test('healthcheck continues after a client transport error', async () => {
		vi.useFakeTimers();

		const server_local = new ExtWSTest({
			healthcheck: { idle_timeout: 10, timeframe_ping_disconnect: 2 },
		});

		try {
			const failing_client = server_local.open();
			const healthy_client = server_local.open();
			failing_client.hook_errors.sendPayload = new Error('ping failed');

			vi.advanceTimersByTime(8000);
			expect(failing_client.hook_calls.sendPayload).toBe(2);
			expect(healthy_client.hook_calls.sendPayload).toBe(2);
			expect(vi.getTimerCount()).toBe(1);

			vi.advanceTimersByTime(2000);
			expect(failing_client.hook_calls.closeTransport).toBe(1);
			expect(healthy_client.hook_calls.closeTransport).toBe(1);
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			await server_local.close();
			vi.useRealTimers();
		}
	});

	test('healthcheck deadlines are relative to each client', async () => {
		vi.useFakeTimers();

		const server_local = new ExtWSTest({
			healthcheck: { idle_timeout: 10, timeframe_ping_disconnect: 2 },
		});

		try {
			vi.advanceTimersByTime(10_001);
			const client = server_local.open();

			vi.advanceTimersByTime(7999);
			expect(client.hook_calls.sendPayload).toBe(1);

			vi.advanceTimersByTime(1);
			expect(client.hook_calls.sendPayload).toBe(2);

			vi.advanceTimersByTime(2000);
			expect(client.hook_calls.closeTransport).toBe(1);
		} finally {
			await server_local.close();
			vi.useRealTimers();
		}
	});

	test('close stops healthcheck and disconnects clients', async () => {
		vi.useFakeTimers();

		try {
			const server_local = new ExtWSTest();
			server_local.open();
			const promise_disconnect = server_local.wait('disconnect');

			expect(vi.getTimerCount()).toBe(1);

			await server_local.close();
			await promise_disconnect;

			expect(server_local.clients.size).toBe(0);
			expect(vi.getTimerCount()).toBe(0);

			await server_local.close();
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			vi.useRealTimers();
		}
	});

	test('invalid payload', () => {
		const client = server.open();

		// invalid payload type
		server.onMessage(client, 'sdsdfsdfdsf{sdfsdf');

		// invalid event type
		server.onMessage(client, `4${'a'.repeat(32)}{"foo":"boo"}`);

		// invalid json
		server.onMessage(
			client,
			'4{"token":"#$344++399949","playerId":1720,"queryPlayerId":1720,"gameId":5577355},"method":"throwDices"}',
		);
	});
});

describe('client', () => {
	describe('groups', () => {
		test('join', async () => {
			const client = server.open();
			const promise = server.wait('test.addToChannel');
			expect(client.join('foo')).toBeUndefined();

			const event = await promise;
			expect(event.detail).toStrictEqual({
				channel: `${CHANNEL_GROUP_PREFIX}foo`,
			});
		});

		test('remove', async () => {
			const client = server.open();
			const promise = server.wait('test.removeFromChannel');
			client?.leave('foo');

			const event = (await promise) as ExtWSEvent<{ group: string }>;
			expect(event.detail).toStrictEqual({
				channel: `${CHANNEL_GROUP_PREFIX}foo`,
			});
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
		expect(event.detail).toStrictEqual({ foo: 'boo' });
		expect(event.type).toBe('message');
	});

	test('onMessage with type', async () => {
		const client = server.open();
		const promise = server.wait('extws');
		server.onMessage(client, '4extws{"foo":"boo"}');

		const event = await promise;
		expect(event.detail).toEqual({ foo: 'boo' });
		expect(event.type).toBe('extws');
	});
});

// oxlint-disable-next-line max-lines-per-function
describe('server -> client', () => {
	describe('client.send', () => {
		const client = server.open();

		test('()', async () => {
			const promise = server.wait('test.sendPayload');

			client.send();

			const event = await promise;
			expect(event.detail).toStrictEqual('4');
		});

		test('(event_type)', async () => {
			const promise = server.wait('test.sendPayload');

			client.send('test');

			const event = await promise;
			expect(event.detail).toStrictEqual('4test');
		});

		test('(data)', async () => {
			const promise = server.wait('test.sendPayload');

			client.send({ foo: 'bar' });

			const event = await promise;
			expect(event.detail).toStrictEqual('4{"foo":"bar"}');
		});

		test('(event_type, data)', async () => {
			const promise = server.wait('test.sendPayload');

			client.send('test', { foo: 'bar' });

			const event = await promise;
			expect(event.detail).toStrictEqual('4test{"foo":"bar"}');
		});

		test('preserves serialized JSON exactly', async () => {
			const data = '{ "z": 1, "a": [ true, null ] }';
			const promise = server.wait('test.sendPayload');

			client.send('test', data);

			const event = await promise;
			expect(event.detail).toBe(`4test${data}`);
		});
	});

	describe('server.sendToSocket', () => {
		const client = server.open();

		test('(socket_id)', async () => {
			const promise = server.wait('test.sendPayload');

			server.sendToSocket(client.id);

			const event = await promise;
			expect(event.detail).toStrictEqual('4');
		});

		test('(socket_id, event_type)', async () => {
			const promise = server.wait('test.sendPayload');

			server.sendToSocket(client.id, 'extws_event');

			const event = await promise;
			expect(event.detail).toStrictEqual('4extws_event');
		});

		test('(socket_id, data)', async () => {
			const promise = server.wait('test.sendPayload');

			server.sendToSocket(client.id, { foo: 'bar' });

			const event = await promise;
			expect(event.detail).toStrictEqual('4{"foo":"bar"}');
		});

		test('(socket_id, event_type, data)', async () => {
			const promise = server.wait('test.sendPayload');

			server.sendToSocket(client.id, 'extws_event', { foo: 'bar' });

			const event = await promise;
			expect(event.detail).toStrictEqual('4extws_event{"foo":"bar"}');
		});

		test('preserves serialized JSON exactly', async () => {
			const data = '{ "z": 1, "a": [ true, null ] }';
			const promise = server.wait('test.sendPayload');

			server.sendToSocket(client.id, 'extws_event', data);

			const event = await promise;
			expect(event.detail).toBe(`4extws_event${data}`);
		});
	});

	describe('server.sendToGroup', () => {
		test('(group_id)', async () => {
			const promise = server.wait(TestPublishEvent.type);

			server.sendToGroup('channel');

			const event = await promise;
			if (!(event instanceof TestPublishEvent)) {
				throw new TypeError('Invalid event type');
			}

			expect(event.group_id).toBe('g-channel');
			expect(event.payload).toBe('4');
		});

		test('(group_id, event_type)', async () => {
			const promise = server.wait(TestPublishEvent.type);

			server.sendToGroup('channel', 'extws_event');

			const event = await promise;
			if (!(event instanceof TestPublishEvent)) {
				throw new TypeError('Invalid event type');
			}

			expect(event.group_id).toBe('g-channel');
			expect(event.payload).toStrictEqual('4extws_event');
		});

		test('(group_id, data)', async () => {
			const promise = server.wait(TestPublishEvent.type);

			server.sendToGroup('channel', { foo: 'bar' });

			const event = await promise;
			if (!(event instanceof TestPublishEvent)) {
				throw new TypeError('Invalid event type');
			}

			expect(event.group_id).toBe('g-channel');
			expect(event.payload).toStrictEqual('4{"foo":"bar"}');
		});

		test('(group_id, event_type, data)', async () => {
			const promise = server.wait(TestPublishEvent.type);

			server.sendToGroup('channel', 'extws_event', { foo: 'bar' });

			const event = await promise;
			if (!(event instanceof TestPublishEvent)) {
				throw new TypeError('Invalid event type');
			}

			expect(event.group_id).toBe('g-channel');
			expect(event.payload).toStrictEqual('4extws_event{"foo":"bar"}');
		});

		test('preserves serialized JSON exactly', async () => {
			const data = '{ "z": 1, "a": [ true, null ] }';
			const promise = server.wait(TestPublishEvent.type);

			server.sendToGroup('channel', 'extws_event', data);

			const event = await promise;
			if (!(event instanceof TestPublishEvent)) {
				throw new TypeError('Invalid event type');
			}

			expect(event.payload).toBe(`4extws_event${data}`);
		});
	});

	describe('server.broadcast', () => {
		test('()', async () => {
			const promise = server.wait(TestPublishEvent.type);

			server.broadcast();

			const event = await promise;
			if (!(event instanceof TestPublishEvent)) {
				throw new TypeError('Invalid event type');
			}

			expect(event.group_id).toStrictEqual('broadcast');
			expect(event.payload).toStrictEqual('4');
		});

		test('(event_type)', async () => {
			const promise = server.wait(TestPublishEvent.type);

			server.broadcast('extws_event');

			const event = await promise;
			if (!(event instanceof TestPublishEvent)) {
				throw new TypeError('Invalid event type');
			}

			expect(event.group_id).toStrictEqual('broadcast');
			expect(event.payload).toStrictEqual('4extws_event');
		});

		test('(data)', async () => {
			const promise = server.wait(TestPublishEvent.type);

			server.broadcast({ foo: 'bar' });

			const event = await promise;
			if (!(event instanceof TestPublishEvent)) {
				throw new TypeError('Invalid event type');
			}

			expect(event.group_id).toStrictEqual('broadcast');
			expect(event.payload).toStrictEqual('4{"foo":"bar"}');
		});

		test('(event_type, data)', async () => {
			const promise = server.wait(TestPublishEvent.type);

			server.broadcast('extws_event', { foo: 'bar' });

			const event = await promise;
			if (!(event instanceof TestPublishEvent)) {
				throw new TypeError('Invalid event type');
			}

			expect(event.group_id).toStrictEqual('broadcast');
			expect(event.payload).toStrictEqual('4extws_event{"foo":"bar"}');
		});

		test('preserves serialized JSON exactly', async () => {
			const data = '{ "z": 1, "a": [ true, null ] }';
			const promise = server.wait(TestPublishEvent.type);

			server.broadcast('extws_event', data);

			const event = await promise;
			if (!(event instanceof TestPublishEvent)) {
				throw new TypeError('Invalid event type');
			}

			expect(event.payload).toBe(`4extws_event${data}`);
		});
	});
});

describe('adapter', () => {
	describe('off', () => {
		beforeEach(() => {
			server.has_adapter = false;
		});

		test('sendToSocket', async () => {
			const promise = shouldHang(server.wait(OutcomePayloadEventType.SOCKET));

			server.sendToSocket('777', { foo: 'bar' });

			await expect(promise).resolves.toBeUndefined();
		});

		test('sendToGroup', async () => {
			const promise = shouldHang(server.wait(OutcomePayloadEventType.CHANNEL));

			server.sendToGroup('channel', { foo: 'bar' });

			await expect(promise).resolves.toBeUndefined();
		});

		test('broadcast', async () => {
			const promise = shouldHang(server.wait(OutcomePayloadEventType.CHANNEL));

			server.broadcast({ foo: 'bar' });

			await expect(promise).resolves.toBeUndefined();
		});
	});

	describe('on', () => {
		beforeEach(() => {
			server.has_adapter = true;
		});

		test('sendToSocket', async () => {
			const data = '{ "z": 1, "a": [ true, null ] }';
			const promise = server.wait(OutcomePayloadEventType.SOCKET);

			server.sendToSocket('777', 'extws_event', data);

			const event = await promise;
			expect(event.detail).toBe(`4extws_event${data}`);
		});

		test('sendToGroup', async () => {
			const promise = server.wait(OutcomePayloadEventType.CHANNEL);

			server.sendToGroup('foo', { foo: 'bar' });

			const event = await promise;
			expect(event.channel_id).toBe(`${CHANNEL_GROUP_PREFIX}foo`);
			expect(event.detail).toStrictEqual('4{"foo":"bar"}');
		});

		test('broadcast', async () => {
			const promise = server.wait(OutcomePayloadEventType.CHANNEL);

			server.broadcast({ foo: 'bar' });

			const event = await promise;
			expect(event.channel_id).toBe(CHANNEL_BROADCAST);
			expect(event.detail).toStrictEqual('4{"foo":"bar"}');
		});
	});
});
