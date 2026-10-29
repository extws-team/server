import { describe, expect, test } from 'vitest';
import { buildPayload, parsePayload } from '../payload/json.js';
import { PayloadType } from '../payload/types.js';

describe('buildPayload', () => {
	test('no event_type, no data', () => {
		expect(buildPayload(PayloadType.MESSAGE)).toBe('4');
	});

	test('event_type only', () => {
		expect(buildPayload(PayloadType.MESSAGE, 'chat')).toBe('4chat');
	});

	test('data only', () => {
		expect(buildPayload(PayloadType.MESSAGE, { foo: 'boo' })).toBe(
			'4{"foo":"boo"}',
		);
	});

	test('array data', () => {
		expect(buildPayload(PayloadType.MESSAGE, [1, 2])).toBe('4[1,2]');
	});

	test('event_type and data', () => {
		expect(buildPayload(PayloadType.MESSAGE, 'chat', { foo: 'boo' })).toBe(
			'4chat{"foo":"boo"}',
		);
	});

	test('explicitly undefined event_type keeps data', () => {
		expect(buildPayload(PayloadType.MESSAGE, undefined, { foo: 'boo' })).toBe(
			'4{"foo":"boo"}',
		);
	});

	test('payload type with no body', () => {
		expect(buildPayload(PayloadType.PING)).toBe('2');
	});

	test('round-trips through parsePayload', () => {
		expect(
			parsePayload(buildPayload(PayloadType.MESSAGE, 'chat', { foo: 'boo' })),
		).toEqual({
			payload_type: PayloadType.MESSAGE,
			event_type: 'chat',
			data: { foo: 'boo' },
		});
	});

	test('event_type at the length limit round-trips', () => {
		const event_type = 'a'.repeat(31);

		expect(
			parsePayload(
				buildPayload(PayloadType.MESSAGE, event_type, { foo: 'boo' }),
			),
		).toEqual({
			payload_type: PayloadType.MESSAGE,
			event_type,
			data: { foo: 'boo' },
		});
	});

	test('rejects event_type over the length limit', () => {
		expect(() => buildPayload(PayloadType.MESSAGE, 'a'.repeat(32))).toThrow(
			TypeError,
		);
	});

	test('rejects event_type containing JSON start characters', () => {
		expect(() => buildPayload(PayloadType.MESSAGE, 'a{b')).toThrow(TypeError);
		expect(() => buildPayload(PayloadType.MESSAGE, 'a[b')).toThrow(TypeError);
		// "4[]" would otherwise be read back as data with the default event type
		expect(() => buildPayload(PayloadType.MESSAGE, '[]')).toThrow(TypeError);
	});
});

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
