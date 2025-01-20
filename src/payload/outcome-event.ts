import { NeoEvent } from 'neoevents';

export const EVENT_TYPE_SOCKET = 'p.socket';
export const EVENT_TYPE_GROUP = 'p.group';
export const EVENT_TYPE_BROADCAST = 'p.broadcast';

export enum OutcomePayloadEventType {
	SOCKET = EVENT_TYPE_SOCKET,
	GROUP = EVENT_TYPE_GROUP,
	BROADCAST = EVENT_TYPE_BROADCAST,
}

export class OutcomePayloadSocketEvent extends NeoEvent<string> {
	constructor(
		public socket_id: string,
		payload: string,
	) {
		super(
			OutcomePayloadEventType.SOCKET,
			payload,
		);
	}
}

export class OutcomePayloadGroupEvent extends NeoEvent<string> {
	constructor(
		public group_id: string,
		payload: string,
	) {
		super(
			OutcomePayloadEventType.GROUP,
			payload,
		);
	}
}

export class OutcomePayloadBroadcastEvent extends NeoEvent<string> {
	constructor(payload: string) {
		super(
			OutcomePayloadEventType.BROADCAST,
			payload,
		);
	}
}
