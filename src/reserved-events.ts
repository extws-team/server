import { OutcomePayloadEventType } from './payload/outcome-event.js';

export const RESERVED_EVENT_TYPES: ReadonlySet<string> = new Set([
	'connect',
	'disconnect',
	OutcomePayloadEventType.SOCKET,
	OutcomePayloadEventType.CHANNEL,
]);
