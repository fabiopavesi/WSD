import WebSocket = require('ws');
import {IPayload, OPS} from '../common/payload';
import {setInterval} from 'timers';
import {BehaviorSubject, Subject} from 'rxjs';

const uuidv4 = require('uuid/v4');

export class Client {
	url;
	ws;
	connected = new BehaviorSubject(false);
	id;
	queue = []
	message = new Subject()
	working = false;

	constructor(url: string) {
		console.log(1)
		this.url = url;
		this.id = uuidv4()
		try {
			this.connect()
			console.log(2)
		} catch (e) {
			console.log('FIRST CONNECT', e)
		}

		console.log(3)
		setInterval(() => {
			// console.log('queue length', this.queue.length)
			if ( !this.working ) {
				this.working = true;
				if ( !this.connected.getValue() ) {
					try {
						this.connect()
					} catch (e) {
						console.log('error connecting', e)
					} finally {
						this.working = false
					}
				} else {
					if ( true || this.ws.readyState >= 1 ) {
						for (let i = this.queue.length - 1; i >= 0; i--) {
							try {
								this.tryAndSend(this.queue[0].id, this.queue[0].payload)
								this.dequeue(this.queue[0].id)
							} catch (e) {
								console.log('couldn\'t send', this.queue[0].payload, e)
								this.connected.next(false);
							}
						}
					}
					this.working = false;
				}
			}
		}, 500)
	}

	connect() {
		try {
			this.ws = new WebSocket(this.url);
			this.ws.on('open', () => {
				console.log('connection open')
				this.connected.next(true);
				this.ws.on('message', (message) => {
					message = JSON.parse(message)
					switch ( message.op ) {
						case OPS.NOOP:
							try {
								this.send({
									id: message.id,
									op: OPS.ACK,
									topic: message.topic
								})
							} catch (e) {
								console.log('NOOP', e)
							}
							break
						case OPS.PUBLISH:
							this.message.next(message)
							break
					}
					// console.log('client Client received', message)
				})
			})
			this.ws.on('error', (e) => {
				console.log('error on connection attempt', e)
			})
		} catch (e) {
			console.log('error connecting', e)
		}
	}

	private dequeue(id: string) {
		for (let i = this.queue.length - 1; i >= 0; i-- ) {
			const m = this.queue[i]
			if ( m.id === id ) {
				this.queue.splice(i, 1)

			}
		}
	}
	private enqueue(payload: IPayload) {
		this.queue.push({
			id: payload.id,
			payload: payload
		})
	}

	private tryAndSend(id, payload: IPayload) {
		payload.id = id;
		this.ws.send(JSON.stringify(payload))
	}

	private send(payload: IPayload) {
		// console.log('send', payload)
		this.enqueue(payload)
	}

	publish(topic: string, message: any) {
		try {
			this.ws.send(JSON.stringify({
				id: uuidv4(),
				op: OPS.PUBLISH,
				topic: topic,
				payload: message
			}))
		} catch (e) {
			console.log('PUBLISH', e)
		}
	}

	subscribe(topic: string, groupId: string, startOffset?: number) {
		try {
			this.send({
				id: uuidv4(),
				op: OPS.SUBSCRIBE,
				topic: topic,
				subscriberId: this.id,
				consumerGroup: groupId,
				startOffset: startOffset
			})
		} catch (e) {
			console.log('SUBSCRIBE', e)
		}
	}
}