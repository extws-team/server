
import { PAYLOAD_TYPE } from '../consts.js';

export function buildPayload(
	payload_type,
	argument1,
	argument2,
) {
	let payload = String(payload_type);

	let event_type = argument1;
	let data = argument2;
	if (
		undefined === argument2
		&& typeof argument1 !== 'string'
	) {
		data = argument1;
		event_type = undefined;
	}

	if (event_type) {
		payload += event_type;
	}

	if (data) {
		payload += JSON.stringify(data);
	}

	return payload;
}

export function buildMessagePayload(event_type, data) {
	return buildPayload(
		PAYLOAD_TYPE.MESSAGE,
		event_type,
		data,
	);
}

const JSON_START = new Set([ '[', '{' ]);
export function parsePayload(payload) {
	const result = {
		payload_type: payload.codePointAt(0) - 48,
	};

	let start = 1;
	let event_type = '';
	for (
		let index = start;
		index < payload.length && JSON_START.has(payload[index]) === false; // TODO: limit event_type to 31
		index++
	) {
		event_type += payload[index];
		start++;
	}

	if (event_type.length > 0) {
		result.event_type = event_type;
	}

	if (start < payload.length) {
		result.data = JSON.parse(
			payload.slice(start),
		);
	}

	return result;
}
