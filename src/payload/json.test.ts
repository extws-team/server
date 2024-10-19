import {
	describe,
	expect,
	test,
} from 'vitest';
import { parsePayload } from '../payload/json.js';
import { PayloadType } from '../payload/types.js';

describe('parsePayload', () => {
	test('should decode and parse an ArrayBuffer payload', () => {
		const encoder = new TextEncoder();
		const payload = encoder.encode('1{"foo":"boo"}');
		const result = parsePayload(payload);
		expect(result).toEqual({
			payload_type: PayloadType.INIT,
			data: {
				foo: 'boo',
			},
		});
	});

	test('should handle payload without event_type', () => {
		const payload = '4{"foo":"boo"}';
		const result = parsePayload(payload);
		expect(result).toEqual({
			payload_type: PayloadType.MESSAGE,
			data: {
				foo: 'boo',
			},
		});
	});

	test('invalid payload type', () => {
		const payload = 33333;
		// @ts-expect-error testing invalid input
		expect(() => parsePayload(payload)).toThrow(TypeError);
	});

	test('should correctly parse payload with event_type', () => {
		const payload = '4extws{"foo":"boo"}';
		const result = parsePayload(payload);
		expect(result).toEqual({
			payload_type: PayloadType.MESSAGE,
			event_type: 'extws',
			data: {
				foo: 'boo',
			},
		});
	});
});
