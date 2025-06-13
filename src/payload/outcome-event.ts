import { NeoEvent } from 'neoevents';

export enum OutcomePayloadEventType {
	SOCKET = 'p.socket',
	CHANNEL = 'p.channel',
}

export class OutcomePayloadSocketEvent extends NeoEvent<string> {
	constructor(
		public socket_id: string,
		payload: string,
	) {
		super(OutcomePayloadEventType.SOCKET, payload);
	}
}

export class OutcomePayloadChannelEvent extends NeoEvent<string> {
	constructor(
		public channel_id: string,
		payload: string,
	) {
		super(OutcomePayloadEventType.CHANNEL, payload);
	}
}
