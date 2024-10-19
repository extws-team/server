export enum OutcomePayloadEventType {
	SOCKET = 'p.socket',
	GROUP = 'p.group',
	BROADCAST = 'p.broadcast',
}

class OutcomePayloadEvent extends Event {
	payload: string;

	constructor(
		type: OutcomePayloadEventType,
		payload: string,
	) {
		super(type);

		this.payload = payload;
	}
}

export class OutcomePayloadSocketEvent extends OutcomePayloadEvent {
	socket_id: string;

	constructor(
		socket_id: string,
		payload: string,
	) {
		super(
			OutcomePayloadEventType.SOCKET,
			payload,
		);

		this.socket_id = socket_id;
	}
}

export class OutcomePayloadGroupEvent extends OutcomePayloadEvent {
	group_id: string;

	constructor(
		group_id: string,
		payload: string,
	) {
		super(
			OutcomePayloadEventType.GROUP,
			payload,
		);

		this.group_id = group_id;
	}
}

export class OutcomePayloadBroadcastEvent extends OutcomePayloadEvent {
	constructor(payload: string) {
		super(
			OutcomePayloadEventType.BROADCAST,
			payload,
		);
	}
}
