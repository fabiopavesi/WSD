import {IPayload} from '../common/payload';
import {Topic} from './topic';

export interface IConsumer {
	subscriberId: string;
	webSocket: string;
	offset: number;
	topic: Topic;
	pending: IPayload[]
}
export class Consumer implements IConsumer {
	subscriberId;
	webSocket;
	offset;
	topic: Topic;
	inGroup = false;
	pending: IPayload[] = []

	constructor(subscriberId, webSocket, startOffset, topic: Topic, inGroup?: boolean) {
		console.log('creating consumer', subscriberId)

		this.subscriberId = subscriberId;
		this.webSocket = webSocket;
		this.offset = startOffset;
		this.topic = topic;
		this.inGroup = inGroup || false

		if ( !this.inGroup ) {
			this.topic.message.subscribe( (message) => {
				console.log('consumer', subscriberId, 'received', message)
				this.topic.send(this.webSocket, message)
			})
		}
	}
}