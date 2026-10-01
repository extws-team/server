import { IDLE_TIMEOUT, TIMEFRAME_PING_DISCONNECT } from './consts.js';
import type { ExtWSHealthcheck } from './main.js';

/**
 * Validates a healthcheck timeout value.
 * @param value Value to validate.
 * @returns The validated timeout in seconds.
 */
function validateTimeout(value: unknown): number {
	if (typeof value !== 'number') {
		throw new TypeError(`Healthcheck option must be a number.`);
	}

	if (!Number.isFinite(value) || value < 0) {
		throw new RangeError(
			`Healthcheck option must be a finite, non-negative number.`,
		);
	}

	return value;
}

/** Creates healthcheck object */
export function createHealthcheck(idle_timeout?: number): ExtWSHealthcheck {
	idle_timeout = validateTimeout(idle_timeout ?? IDLE_TIMEOUT);

	const timeframe_ping_disconnect = TIMEFRAME_PING_DISCONNECT;

	if (timeframe_ping_disconnect >= idle_timeout) {
		throw new RangeError(
			'Healthcheck option "timeframe_ping_disconnect" must be less than "idle_timeout".',
		);
	}

	const idle_timeout_disconnect_ms = idle_timeout * 1e3;
	const timeframe_ping_disconnect_ms = timeframe_ping_disconnect * 1e3;

	return {
		idle_timeout,
		timeframe_ping_disconnect,
		timeframe_ping_disconnect_ms,
		idle_timeout_disconnect_ms,
		idle_timeout_ping_ms:
			idle_timeout_disconnect_ms - timeframe_ping_disconnect_ms,
	};
}
