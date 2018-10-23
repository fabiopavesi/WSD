import {IPayload, OPS} from '../common/payload';
import {Topic} from './topic';
import {Subject} from 'rxjs';

const uuidv4 = require('uuid/v4');
const WebSocket = require('ws');
const JSON = require('circular-json')
const port = process.env.PORT || 9898

export class WSTranport {
	wss;
	newConsumer = new Subject()
	leavingConsumer = new Subject()
	static instance = new WSTranport()

	private constructor() {
		this.wss = new WebSocket.Server({ port: port });
		this.wss.on('connection', (ws, req) => {
			this.newConsumer.next(ws)
			ws.on('message', (message) => {
				this.onMessage(ws, message)
			});
			ws.on('close', () => {
				this.leavingConsumer.next(ws)
			});
			ws.isAlive = true;
			ws.on('pong', heartbeat);
		});

		function noop() {}

		function heartbeat() {
			this.isAlive = true;
			// console.log('this', this);
		}

		const interval = setInterval(() => {
			this.wss.clients.forEach((ws) => {
				if (ws.isAlive === false) {
					this.leavingConsumer.next(ws)
					return ws.terminate();
				}

				ws.isAlive = false;
				ws.ping(noop);
			});
		}, 30000);
	}

	static getInstance() {
		return WSTranport.instance
	}

	private send(ws, payload: IPayload) {
		try {
			ws.send(JSON.stringify(payload))
		} catch (e) {
			console.log('send exception', e)
		}
	}

	private dispatch(ws, payload: IPayload) {
		const topic = Topic.getTopic(payload.topic);
		switch (payload.op) {
			case OPS.SUBSCRIBE:
				topic.addConsumer(payload.subscriberId, payload.consumerGroup, ws, payload.startOffset)
				break;
			case OPS.PUBLISH:
				topic.message.next(payload)
				break;
		}
	}

	onMessage(ws, message) {
		message = JSON.parse(message)
		// console.log('transport received', message.id)
		this.dispatch(ws, message)
	}

}

const main = WSTranport.getInstance()