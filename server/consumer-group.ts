import {Consumer, IConsumer} from './consumer';
import {IPayload} from '../common/payload';
import {Topic} from './topic';

const SENDING_INTERVAL = 10

interface IPendingPayload {
	payload: IPayload;
	sent: Date;
	received?: Date;
}
export class ConsumerGroup {
	id;
	topic: Topic;
	offset = -1;
	consumers: Consumer[] = []
	lastServed = -1
	pending: IPendingPayload[] = []
	readonly usePending = false;

	constructor(id, topic) {
		this.id = id;
		this.topic = topic;
		this.topic.message.subscribe( (message: IPayload) => {
			// console.log('consumer group', id, 'received', message.id)
			if ( this.usePending ) {
				this.pending.push({
					sent: null,
					payload: message
				});
			} else {
				let sent = false;
				let nextConsumer = this.nextConsumer();
				while (!sent) {
					const recipient = this.consumers[nextConsumer]
					if (recipient && recipient.webSocket) {
						try {
							console.log('sending', message.payload.value, 'to', nextConsumer)
							this.topic.send(recipient.webSocket, message)
							sent = true;
						} catch (e) {

						}
					}
				}
			}
		})

		if ( this.usePending ) {
			setInterval( () => {
				if ( this.pending.length > 0 ) {
					// console.log('pending first', this.pending[0], 'of', this.pending.length)
					if ( !this.pending[0].sent) {
						console.log('ready to send message', this.pending[0].payload.id)
						const nextConsumer = this.nextConsumer();
						const recipient = this.consumers[nextConsumer]
						if (recipient) {
							this.pending[0].sent = new Date()
							try {
								this.topic.send(recipient.webSocket, this.pending[0].payload)
								this.pending.splice(0, 1)
							} catch (e) {
								console.log('couldn\'t deliver', this.pending[0].payload.id)
							}
						} else {
							console.log('consumer not found', nextConsumer)
						}
					} else {
						if ( this.pending[0].received ) {
							this.pending.splice(0, 1)
						}
					}
				}
			}, SENDING_INTERVAL)
		}

	}

	nextConsumer() {
		this.lastServed++;
		if ( this.lastServed >= this.consumers.length ) {
			this.lastServed = 0;
		}

		return this.lastServed
	}

	addConsumer(consumer: Consumer) {
		this.consumers.push(consumer)
	}

	getConsumer(id) {
		const matchingConsumers = this.consumers.filter(s => {
			return s.subscriberId === id
		})
		if (!matchingConsumers || matchingConsumers.length === 0) {
			return null
		} else {
			return matchingConsumers[0]
		}
	}

}