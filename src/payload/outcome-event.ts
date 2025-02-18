import { NeoEvent } from 'neoevents';

export const EVENT_TYPE_SOCKET = 'p.socket';
export const EVENT_TYPE_CHANNEL = 'p.channel';

export enum OutcomePayloadEventType {
	SOCKET = EVENT_TYPE_SOCKET,
	CHANNEL = EVENT_TYPE_CHANNEL,
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

export class OutcomePayloadChannelEvent extends NeoEvent<string> {
	constructor(
		public channel_id: string,
		payload: string,
	) {
		super(
			OutcomePayloadEventType.CHANNEL,
			payload,
		);
	}
}
