import {Consumer} from './consumer';
import {IPayload} from '../common/payload';
import {createWriteStream} from 'fs';
import {interval} from 'rxjs';

const consumer1 = new Consumer('http://localhost:9898');
/*
for ( let i = 0; i < 2; i++ ) {
	consumer1.publish('test2', {
		text: '' + i
	})
}
*/
console.log(11)
const group = 'test';

const consumer2 = new Consumer('http://localhost:9898');
const consumer3 = new Consumer('http://localhost:9898');
consumer2.subscribe('test1', group, 0)
let total = 0;
let total2 = 0;
let total3 = 0;

const list2 = []
const list3 = []

const stream2 = createWriteStream('stream2.txt', 'utf8')
const stream3 = createWriteStream('stream3.txt', 'utf8')

consumer2.message.subscribe((payload: IPayload) => {
	total2++ // += payload.payload.value;
	stream2.write(payload.payload.value + '\n')
	// list2.push(payload.payload.value)
	console.log('consumer2 received', payload.payload.text)
})
console.log(12)
consumer3.subscribe('test1', group, 0)
consumer3.message.subscribe((payload: IPayload) => {
	total3++ // += payload.payload.value;
	stream3.write(payload.payload.value + '\n')
	// list3.push(payload.payload.value)
	console.log('consumer3 received', payload.payload.text)
})
console.log(13)
/*
const consumer4 = new Consumer('http://localhost:9898');
consumer4.subscribe('test1', null, 0)
consumer4.message.subscribe( (payload: IPayload) => console.log('consumer4 received', payload.payload.text))
*/
console.log(14)

function intersect(a, b) {
	const temp = []
	for (let i1 of a) {
		for (let i2 of b) {
			if (i1 === i2) {
				temp.push(i1)
			}
		}
	}
	return temp;
}

function union(a, b) {
	return a.concat(b).sort()
}

function allNumbersPresent(a, b) {
	const unionValues = union(a, b);
	const temp = []
	let previous = -1
	for (let u of unionValues) {
		if (u - previous <= 1) {
			temp.push(u);
		}
		previous = u
	}
	return temp;
}

let i = 0;

setTimeout( () => {
	consumer1.connected
		.subscribe(connected => {
			if (connected) {
/*
				for (let i = 0; i < 1000000; i++) {
					process.stdout.write('' + i + '\r')
					consumer1.publish('test1', {
						text: '' + i,
						value: i
					})
				}
*/
				const interval = setInterval( () => {
					process.stdout.write('' + i + '\r')
					consumer1.publish('test1', {
						text: '' + i,
						value: i
					})
					i++
					if ( i > 1000000 ) {
						clearInterval(interval)
					}
				}, 1)
			}
		})
}, 1000)


/*setInterval( () => {
	try {
		consumer1.publish('test1', {
			text: '' + i,
			value: i
		})
		i++
		total = i

		if ( i > 100000 ) {
			stream2.end()
			stream3.end()
		}
/!*
		const temp = intersect(list2, list3)
		const allPresent = allNumbersPresent(list2, list3)
		process.stdout.write('total = ' + total + ' - ' + Math.round(total2 / total * 100.0) + '%, ' + Math.round(total3 / total * 100.0) + '%, intersection: ' + (temp.length) + ', union - missing: ' + allPresent.length + '\r')
*!/
	} catch (e) {
		console.log('error publishing', e)
	}
}, 1)*/
