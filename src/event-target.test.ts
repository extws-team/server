import {
	describe,
	expect,
	test,
} from 'vitest';
import { ExtWSEventTarget } from './event-target.js';

const target = new ExtWSEventTarget();

describe('can disable listeners', () => {
	test('disable listener on "once" listener', () => {
		const listener_size = target.listeners.size;
		// eslint-disable-next-line no-empty-function
		const off = target.once('listener', () => {});
		expect(target.listeners.size).toBe(listener_size + 1);
		off();
		expect(target.listeners.size).toBe(listener_size);
	});

	test('disable listener on "on" listener', () => {
		const listener_size = target.listeners.size;
		// eslint-disable-next-line no-empty-function
		const off = target.on('listener', () => {});
		expect(target.listeners.size).toBe(listener_size + 1);
		off();
		expect(target.listeners.size).toBe(listener_size);
	});
});
