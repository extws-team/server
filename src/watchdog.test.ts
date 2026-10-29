import { describe, expect, test, vi } from 'vitest';
import {
	IDLE_TIMEOUT,
	TIMEFRAME_PING_DISCONNECT,
	WATCHDOG_INTERVAL_MS,
} from './consts.js';
import { ExtWSTest } from '../test/server.js';

export const IDLE_TIMEOUT_DISCONNECT_MS: number = IDLE_TIMEOUT * 1e3;
export const TIMEFRAME_PING_DISCONNECT_MS: number =
	TIMEFRAME_PING_DISCONNECT * 1e3;
export const IDLE_TIMEOUT_PING_MS: number =
	IDLE_TIMEOUT_DISCONNECT_MS - TIMEFRAME_PING_DISCONNECT_MS;

describe('watchdog', () => {
	test('ping & disconnect if client is silent', async () => {
		vi.useFakeTimers();

		const server_local = new ExtWSTest();
		server_local.open();

		const promise_ping = server_local.wait('test.sendPayload');
		const promise_disconnect = server_local.wait('disconnect');

		vi.advanceTimersByTime(IDLE_TIMEOUT_PING_MS);
		const event_ping = await promise_ping;
		expect(event_ping).not.toBe(undefined);
		expect(event_ping.detail).toBe('2');

		vi.advanceTimersByTime(TIMEFRAME_PING_DISCONNECT_MS);
		expect(await promise_disconnect).not.toBe(undefined);

		vi.useRealTimers();
	});

	test('close stops the watchdog and clears listeners', async () => {
		vi.useFakeTimers();

		const server_local = new ExtWSTest();
		const client = server_local.open();

		let is_notified = false;
		server_local.on('disconnect', () => {
			is_notified = true;
		});

		expect(vi.getTimerCount()).toBeGreaterThan(0);

		await server_local.close();

		// watchdog is stopped
		expect(vi.getTimerCount()).toBe(0);

		// listeners are cleared, so nothing is dispatched anymore
		client.disconnect();
		expect(is_notified).toBe(false);

		vi.useRealTimers();
	});

	test('client gone silent between watchdog runs is disconnected at idle timeout', () => {
		vi.useFakeTimers();

		const server_local = new ExtWSTest();
		const client = server_local.open();

		let is_disconnected = false;
		server_local.on('disconnect', () => {
			is_disconnected = true;
		});

		// active right before the first watchdog run, then silent
		vi.advanceTimersByTime(IDLE_TIMEOUT_PING_MS - 500);
		server_local.onMessage(client, '2');

		vi.advanceTimersByTime(IDLE_TIMEOUT_DISCONNECT_MS - 1);
		expect(is_disconnected).toBe(false);

		vi.advanceTimersByTime(WATCHDOG_INTERVAL_MS + 1);
		expect(is_disconnected).toBe(true);

		vi.useRealTimers();
	});

	test('client that answers the ping stays connected', () => {
		vi.useFakeTimers();

		const server_local = new ExtWSTest();
		const client = server_local.open();

		let is_disconnected = false;
		server_local.on('disconnect', () => {
			is_disconnected = true;
		});

		vi.advanceTimersByTime(IDLE_TIMEOUT_PING_MS);
		expect(client.stat.ts_ping).toBe(Date.now());

		server_local.onMessage(client, '3');
		expect(client.stat.ts_ping).toBe(undefined);

		vi.advanceTimersByTime(TIMEFRAME_PING_DISCONNECT_MS);
		expect(is_disconnected).toBe(false);

		vi.useRealTimers();
	});

	test('watchdog runs only while there are clients', () => {
		vi.useFakeTimers();

		const server_local = new ExtWSTest();
		expect(vi.getTimerCount()).toBe(0);

		const client = server_local.open();
		expect(vi.getTimerCount()).toBe(1);

		client.disconnect();
		vi.advanceTimersByTime(IDLE_TIMEOUT_PING_MS);
		expect(vi.getTimerCount()).toBe(0);

		server_local.open();
		expect(vi.getTimerCount()).toBe(1);

		vi.useRealTimers();
	});
});

describe('options', () => {
	test('invalid values throw', () => {
		expect(() => new ExtWSTest({ pingTimeout: 0 })).toThrow(RangeError);
		expect(() => new ExtWSTest({ pingTimeout: IDLE_TIMEOUT })).toThrow(
			RangeError,
		);
		// default pingTimeout is 5
		expect(() => new ExtWSTest({ idleTimeout: 5 })).toThrow(RangeError);
		expect(() => new ExtWSTest({ idleTimeout: Infinity })).toThrow(RangeError);
	});

	test('idleTimeout and pingTimeout change the timing', async () => {
		vi.useFakeTimers();

		const server_local = new ExtWSTest({ idleTimeout: 10, pingTimeout: 2 });
		const promise_init = server_local.wait('test.sendPayload');
		const client = server_local.open();
		const event_init = await promise_init;
		expect(event_init.detail).toContain('"idle_timeout":10');

		let is_disconnected = false;
		server_local.on('disconnect', () => {
			is_disconnected = true;
		});

		vi.advanceTimersByTime(8000);
		expect(client.stat.ts_ping).toBe(Date.now());

		vi.advanceTimersByTime(2000 - 1);
		expect(is_disconnected).toBe(false);

		vi.advanceTimersByTime(1);
		expect(is_disconnected).toBe(true);

		vi.useRealTimers();
	});
});
