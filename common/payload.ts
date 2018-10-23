export enum OPS {
	SUBSCRIBE,
	PUBLISH,
	ACK,
	NOOP
}

export interface IPayload {
	id: string;
	offset?: number;
	op: OPS;
	topic?: string;
	subscriberId?: string;
	consumerGroup?: string;
	startOffset?: number;
	payload?: any;
}