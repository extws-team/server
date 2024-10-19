export type PayloadData = Record<string, unknown> | unknown[];
export interface Payload {
	payload_type: PayloadType;
	event_type?: string;
	data?: PayloadData;
}

export enum PayloadType {
	ERROR = -1,
	INIT = 1,
	PING = 2,
	PONG = 3,
	MESSAGE = 4,
}
