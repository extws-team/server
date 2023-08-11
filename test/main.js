
import {
	describe,
	after,
	it      }         from 'mocha';
import {
	strictEqual,
	deepStrictEqual } from 'node:assert/strict';

import ExtWS         from '../src/main.js';
import {
	GROUP_BROADCAST,
	GROUP_PREFIX   } from '../src/consts.js';

import ExtWSTestAdapter from './adapter.js';
import ExtWSTestDriver  from './driver.js';

function createServer() {
	const adapter = new ExtWSTestAdapter();
	const driver = new ExtWSTestDriver();
	const server = new ExtWS({
		driver,
		adapter,
	});

	return server;
}
function getClient(server) {
	return server.clients.values().next().value;
}

const server = createServer();

describe('ExtWS', () => {
	it('client connect', () => {
		const promise = Promise.all([
			new Promise((resolve) => {
				server.once(
					'client.test.addToGroup',
					(event) => {
						strictEqual(
							event.data.group,
							GROUP_BROADCAST,
						);

						resolve();
					},
				);
			}),
			new Promise((resolve, reject) => {
				server.once(
					'client.test.payload',
					(event) => {
						if (event.data.startsWith('1{')) {
							resolve();
						}
						else {
							reject(
								new TypeError('Invalid payload'),
							);
						}
					},
				);
			}),
			new Promise((resolve) => {
				server.once(
					'client.connect',
					() => {
						resolve();
					},
				);
			}),
		]);

		server.driver.testConnect();

		return promise;
	});

	describe('manage client\'s groups', () => {
		it('add to group', () => new Promise((resolve) => {
			const client = getClient(server);

			client.once(
				'client.test.addToGroup',
				(event) => {
					strictEqual(
						event.data.group,
						GROUP_PREFIX + 'foo',
					);

					resolve();
				},
			);

			client.join('foo');
		}));
		it('remove from group', () => new Promise((resolve) => {
			const client = getClient(server);

			client.once(
				'client.test.removeFromGroup',
				(event) => {
					strictEqual(
						event.data.group,
						GROUP_PREFIX + 'foo',
					);

					resolve();
				},
			);

			client.leave('foo');
		}));
	});

	describe('receive messages from client', () => {
		it('default name (message)', () => new Promise((resolve) => {
			const client = getClient(server);

			client.once(
				'client.message',
				(event) => {
					deepStrictEqual(
						event.data,
						{
							foo: 'bar',
						},
					);

					resolve();
				},
			);

			server.driver.onMessage(
				client,
				'4{"foo":"bar"}',
			);
		}));
		it('custom name', () => new Promise((resolve) => {
			const client = getClient(server);

			client.once(
				'client.custom',
				(event) => {
					deepStrictEqual(
						event.data,
						{
							foo: 'bar',
						},
					);

					resolve();
				},
			);

			server.driver.onMessage(
				client,
				'4custom{"foo":"bar"}',
			);
		}));
	});

	describe('send messages to client', () => {
		it('default name (message)', () => new Promise((resolve) => {
			const client = getClient(server);

			client.once(
				'client.test.payload',
				(event) => {
					strictEqual(
						event.data,
						'4{"foo":"bar"}',
					);

					resolve();
				},
			);

			client.send({
				foo: 'bar',
			});
		}));
		it('custom name', () => new Promise((resolve) => {
			const client = getClient(server);

			client.once(
				'client.test.payload',
				(event) => {
					strictEqual(
						event.data,
						'4helloworld{"foo":"bar"}',
					);

					resolve();
				},
			);

			client.send(
				'helloworld',
				{
					foo: 'bar',
				},
			);
		}));
	});

	describe('send message to group', () => {
		it('to group name', () => new Promise((resolve) => {
			server.once(
				'test.publish',
				(event) => {
					strictEqual(
						event.channel,
						GROUP_PREFIX + 'some-channel',
					);

					strictEqual(
						event.payload,
						'4{"foo":"bar"}',
					);

					resolve();
				},
			);

			server.sendToGroup(
				'some-channel',
				{
					foo: 'bar',
				},
			);
		}));
		it('broadcast', () => new Promise((resolve) => {
			server.once(
				'test.publish',
				(event) => {
					strictEqual(
						event.channel,
						'broadcast',
					);

					strictEqual(
						event.payload,
						'4extws{"foo":"bar"}',
					);

					resolve();
				},
			);

			server.broadcast(
				'extws',
				{
					foo: 'bar',
				},
			);
		}));
	});

	describe('using adapter', () => {
		it('to group', () => new Promise((resolve) => {
			server.adapter.addEventListener(
				'test.publish',
				(event) => {
					// payload
					strictEqual(
						event.args[0],
						'4{"foo":"bar"}',
					);

					// socket_id
					strictEqual(
						event.args[1],
						null,
					);

					// group_id
					strictEqual(
						event.args[2],
						'some-channel',
					);

					// broadcast
					strictEqual(
						event.args[3],
						false,
					);

					resolve();
				},
				{
					once: true,
				},
			);

			server.sendToGroup(
				'some-channel',
				{
					foo: 'bar',
				},
			);
		}));
		it('broadcast', () => new Promise((resolve) => {
			server.adapter.addEventListener(
				'test.publish',
				(event) => {
					// payload
					strictEqual(
						event.args[0],
						'4someEventType{"foo":"bar"}',
					);

					// socket_id
					strictEqual(
						event.args[1],
						null,
					);

					// group_id
					strictEqual(
						event.args[2],
						null,
					);

					// broadcast
					strictEqual(
						event.args[3],
						true,
					);

					resolve();
				},
				{
					once: true,
				},
			);

			server.broadcast(
				'someEventType',
				{
					foo: 'bar',
				},
			);
		}));
	});

	describe('deferred', () => {
		it('client timeout disconnect', async function () {
			this.slow(1_000_000);
			this.timeout(121_000);

			const client = getClient(server);
			const ts_start = Date.now();

			const ts_end = await new Promise((resolve) => {
				client.once(
					'test.client.disconnect_hard',
					() => {
						resolve(
							Date.now(),
						);
					},
				);
			});

			if (ts_end - ts_start < 60_000) {
				throw new Error('Client disconnected too early');
			}

			return true;
		});
	});

	after(() => {
		setTimeout(
			() => process.exit(0), // eslint-disable-line no-process-exit, unicorn/no-process-exit
			1000,
		);
	});
});
