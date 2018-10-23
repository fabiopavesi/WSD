import {IPayload} from '../common/payload';
import {Consumer} from './consumer';
import {ConsumerGroup} from './consumer-group';
import {Subject} from 'rxjs';
import {WSTranport} from './ws-transport';

export class Topic {
	name;
	payloads: IPayload[] = []
	consumers: Consumer[] = []
	groupConsumers: ConsumerGroup[] = []
	message = new Subject()
	newConsumer = new Subject()
	leavingConsumer = WSTranport.getInstance().leavingConsumer;

	static topics = []

	static getTopic(name) {
		let found = false;
		for (let t of Topic.topics) {
			if (t.name === name) {
				found = true;
				return t;
			}
		}
		if (!found) {
			const topic = new Topic(name);
			Topic.topics.push(topic)
			return topic;
		}
	}

	private constructor(name) {
		this.name = name
		this.leavingConsumer
			.subscribe(ws => {
				console.log('disconnected');
				for ( let c of this.consumers ) {
					if ( c.webSocket === ws ) {
						console.log('destroying consumer', c.subscriberId)
						c.webSocket.terminate()
						this.consumers.slice(this.consumers.indexOf(c), 1)
					}
				}
				for ( let g of this.groupConsumers ) {
					for ( let c of g.consumers ) {
						if ( c.webSocket === ws ) {
							console.log('destroying consumer', c.subscriberId)
							c.webSocket.terminate()
							g.consumers.slice(g.consumers.indexOf(c), 1)
						}
					}
				}
			})
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

	getGroupConsumer(id) {
		const matchingGroups = this.groupConsumers.filter(g => g.id === id);
		if (matchingGroups && matchingGroups.length > 0) {
			return matchingGroups[0];
		} else {
			return null
		}
	}

	addConsumer(subscriberId: string, groupId: string, webSocket, startOffset?: number) {
		if (groupId) {
			this.addGroupConsumer(subscriberId, groupId, webSocket, startOffset)
		} else {
			const consumer = this.getConsumer(subscriberId)
			if (!consumer) {
				this.consumers.push(new Consumer(
					subscriberId,
					webSocket,
					0,
					this
				))
			} else {
				consumer.subscriberId = subscriberId;
				consumer.webSocket = webSocket;
				consumer.offset = startOffset || this.payloads.length - 1;
			}
		}
	}

	addGroupConsumer(subscriberId: string, groupId: string, webSocket, startOffset?: number) {
		let group = this.getGroupConsumer(groupId)
		if (!group) {
			group = new ConsumerGroup(groupId, this)
			this.groupConsumers.push(group)
		}
		const consumer = group.getConsumer(subscriberId)
		if (consumer) {
			consumer.subscriberId = subscriberId;
			consumer.webSocket = webSocket;
			consumer.offset = startOffset || this.payloads.length - 1;
			consumer.inGroup = true;
		} else {
			group.addConsumer(new Consumer(subscriberId, webSocket, startOffset || this.payloads.length - 1, this, true))
		}
	}

	push(payload: any) {
		this.payloads.push(payload)
		console.log('topics', Topic.topics)
		this.dispatch()
	}

	private removeConsumer(webSocket) {
		for (let i = this.consumers.length - 1; i >= 0; i--) {
			if (this.consumers[i].webSocket === webSocket) {
				this.consumers.splice(i, 1)
			}
		}
		for (let g of this.groupConsumers) {
			for (let i = g.consumers.length - 1; i >= 0; i--) {
				if (g.consumers[i].webSocket === webSocket) {
					g.consumers.splice(i, 1)
				}
			}
		}
	}

	send(ws, payload) {
		try {
			// console.log('sending', payload)
			ws.send(JSON.stringify(payload))
		} catch (e) {
			this.removeConsumer(ws)
			console.log('error', JSON.stringify(e))
			throw 'couldn\'t send'
		}
	}

	private dispatch() {
		for (let s of this.consumers) {
			for (let i = s.offset; i < this.payloads.length; i++) {
				this.payloads[i].offset = i
				try {
					this.send(s.webSocket, this.payloads[i]);
				} catch (e) {

				}
			}
			s.offset = this.payloads.length
		}
	}

}