import {IPayload, OPS} from '../common/payload';
import {Client} from './client';
import uuidv4 = require('uuid/v4');
import {BehaviorSubject, Subject} from 'rxjs';

export interface IConsumer {
	publish(payload: IPayload);
	subscribe(topic: string, message: any);
}

export class Consumer implements IConsumer {
	private client: Client;
	message = new Subject()
	connected = new BehaviorSubject(false)

	constructor(url: string) {
		this.client = new Client(url);
		this.client.message.subscribe( (payload: IPayload) => this.message.next(payload))
		this.client.connected
			.subscribe( res => this.connected.next(res))
	}

	subscribe(topic: string, groupId?: string, startOffset?: number) {
		this.client.subscribe(topic, groupId, startOffset)
	}
	publish(topic: string, message: any) {
		this.client.publish(topic, message)
	}
}